/**
 * Phase 2B-A security hardening (PR #7 review findings). Deterministic: mocked transport, fake DNS,
 * local temp directories and child processes only. No live website is contacted.
 *
 * 1. robots.txt is enforced before every request, including each redirect hop.
 * 2. A run with any invalid monitor config is refused before any network request.
 * 3. FileStore is safe for concurrent processes and fails closed.
 * 4. SSRF: private addresses, metadata endpoints, IPv6, DNS rebinding, URL tricks and redirects.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { buildSync } from "esbuild";
import { afterAll, describe, expect, it } from "vitest";
import {
  FileStore, guardedLookup, isBlockedAddress, MemoryStore, nodeHttpsTransport, runMonitor, safeFetch, StoreIntegrityError, StoreLockedError, validateMonitorConfigs, validateSourceUrl, verifyAuditChain,
  type SourceMonitorConfig, type Transport, type TransportResponse,
} from "@/lib/passport/monitor";
import type { Source } from "@/lib/passport/types";

const run = promisify(execFile);
const ROOT = path.resolve(__dirname, "..");
const enc = (s: string) => new TextEncoder().encode(s);
const html = (b: string): TransportResponse => ({ status: 200, headers: { "content-type": "text/html" }, body: enc(b) });
const text = (b: string): TransportResponse => ({ status: 200, headers: { "content-type": "text/plain" }, body: enc(b) });
const status = (s: number, headers: Record<string, string> = {}): TransportResponse => ({ status: s, headers, body: new Uint8Array() });

function mock(routes: Record<string, TransportResponse | Error>) {
  const calls: string[] = [];
  const t: Transport = async (req) => {
    const u = req.url.toString();
    calls.push(u);
    const r = routes[u] ?? status(404);
    if (r instanceof Error) throw r;
    return r;
  };
  return { t, calls };
}

const A = "https://immigration.example.gov";
const B = "https://visas.example.gov";
const SRC: Source = { id: "s", title: "t", publisher: "p", url: `${A}/visa/list`, type: "government", authorityJurisdiction: "ZA", checked: "2026-10-10" };
const SRC_B: Source = { ...SRC, id: "s-b", url: `${B}/home` };
const review = { reviewedOn: "2026-10-10", reviewer: "founder", robotsAllows: true, termsAllow: true };
const cfg = (sourceId = "s", extra: Partial<SourceMonitorConfig> = {}): SourceMonitorConfig => ({ sourceId, strategy: "html", enabled: true, frequencyDays: 7, termsReview: review, ...extra });
const now = () => new Date("2026-10-11T08:00:00Z");
const go = (t: Transport, configs: SourceMonitorConfig[], sources: Source[] = [SRC], store = new MemoryStore()) =>
  runMonitor({ sources, configs, rules: [], store, transport: t, now, sleep: async () => {}, runId: "r" }).then((r) => ({ r, store }));

describe("1. robots.txt on every redirect hop", () => {
  it("refuses a same-host redirect to a disallowed path and never requests it", async () => {
    const { t, calls } = mock({
      [`${A}/robots.txt`]: text("User-agent: *\nDisallow: /private/"),
      [`${A}/visa/list`]: status(302, { location: "/private/list" }),
      [`${A}/private/list`]: html("<p>secret</p>"),
    });
    const { r, store } = await go(t, [cfg()]);
    expect(calls).toEqual([`${A}/robots.txt`, `${A}/visa/list`]);
    expect(r.failed).toBe(0);
    const [item] = await store.listReviewItems();
    expect(item).toMatchObject({ kind: "manual-check-required" });
    expect(item.detail).toContain(`${A}/private/list`);
  });

  it("fetches and obeys robots.txt of a second approved host reached by redirect", async () => {
    const { t, calls } = mock({
      [`${A}/robots.txt`]: status(404),
      [`${A}/visa/list`]: status(301, { location: `${B}/visa` }),
      [`${B}/robots.txt`]: text("User-agent: UncleJetlagSourceMonitor\nDisallow: /visa"),
      [`${B}/visa`]: html("<p>x</p>"),
    });
    await go(t, [cfg(), cfg("s-b", { enabled: false })], [SRC, SRC_B]);
    expect(calls).toEqual([`${A}/robots.txt`, `${A}/visa/list`, `${B}/robots.txt`]);
  });

  it("refuses a hop when the redirect target's robots.txt is unreachable", async () => {
    const { t, calls } = mock({ [`${A}/robots.txt`]: status(404), [`${A}/visa/list`]: status(302, { location: `${B}/x` }), [`${B}/robots.txt`]: status(503), [`${B}/x`]: html("<p>x</p>") });
    await go(t, [cfg(), cfg("s-b", { enabled: false })], [SRC, SRC_B]);
    expect(calls).not.toContain(`${B}/x`);
  });

  it("follows a redirect to an allowed path and reads it", async () => {
    const { t, calls } = mock({ [`${A}/robots.txt`]: text("User-agent: *\nDisallow: /private/"), [`${A}/visa/list`]: status(302, { location: "/visa/list-2026" }), [`${A}/visa/list-2026`]: html("<p>Visa exempt</p>") });
    const { r } = await go(t, [cfg()]);
    expect(r).toMatchObject({ baselines: 1, failed: 0 });
    expect(calls).toEqual([`${A}/robots.txt`, `${A}/visa/list`, `${A}/visa/list-2026`]);
  });

  it("safeFetch calls the gate before every hop and sends nothing once it denies", async () => {
    const { t, calls } = mock({ [`${A}/a`]: status(302, { location: "/b" }), [`${A}/b`]: status(302, { location: "/c" }), [`${A}/c`]: html("<p>c</p>") });
    const seen: string[] = [];
    const r = await safeFetch(`${A}/a`, {
      transport: t, allowedHosts: new Set(["immigration.example.gov"]), userAgent: "t", maxBytes: 1000, timeoutMs: 1000,
      beforeRequest: async (u) => { seen.push(u.pathname); return u.pathname === "/c" ? { allowed: false, reason: "robots" } : { allowed: true }; },
    });
    expect(seen).toEqual(["/a", "/b", "/c"]);
    expect(calls).toEqual([`${A}/a`, `${A}/b`]);
    expect(r).toMatchObject({ kind: "robots-disallowed", url: `${A}/c` });
  });
});

describe("2. monitor config is validated before any network request", () => {
  const unsafe: [string, Partial<SourceMonitorConfig>][] = [
    ["no review", { termsReview: null }],
    ["robots not allowed", { termsReview: { ...review, robotsAllows: false } }],
    ["terms not allowed", { termsReview: { ...review, termsAllow: false } }],
    ["truthy string instead of true", { termsReview: { ...review, robotsAllows: "yes" as unknown as boolean } }],
    ["truthy number instead of true", { termsReview: { ...review, termsAllow: 1 as unknown as boolean } }],
    ["no reviewer", { termsReview: { ...review, reviewer: " " } }],
    ["invalid review date", { termsReview: { ...review, reviewedOn: "last week" } }],
    ["manual strategy enabled", { strategy: "manual-js" }],
    ["enabled not a boolean", { enabled: "true" as unknown as boolean }],
  ];
  for (const [label, extra] of unsafe) {
    it(`refuses the whole run (${label}) and makes zero requests`, async () => {
      const { t, calls } = mock({ [`${A}/robots.txt`]: status(404), [SRC.url]: html("<p>x</p>"), [`${B}/robots.txt`]: status(404), [SRC_B.url]: html("<p>y</p>") });
      // One valid enabled source plus one unsafe one: the valid one must not be fetched either.
      const { r, store } = await go(t, [cfg("s"), cfg("s-b", extra)], [SRC, SRC_B]);
      expect(r.status).toBe("refused-invalid-config");
      expect(r.error).toMatch(/s-b/);
      expect(calls).toEqual([]);
      expect((await store.readAudit()).map((e) => e.action)).toEqual(["run-refused"]);
    });
  }
  it("refuses configs for unknown sources and sources without a config", async () => {
    const { t, calls } = mock({});
    expect((await go(t, [cfg("s"), cfg("ghost")])).r.status).toBe("refused-invalid-config");
    expect((await go(t, [cfg("s")], [SRC, SRC_B])).r.status).toBe("refused-invalid-config");
    expect(calls).toEqual([]);
  });
  it("lists every problem", () => {
    const issues = validateMonitorConfigs([cfg("s", { termsReview: null }), cfg("s", { termsReview: null })], [SRC]).join("\n");
    expect(issues).toMatch(/duplicate monitor config/);
    expect(issues).toMatch(/enabled without a recorded/);
  });
  it("runs normally when every enabled source has an explicit positive review", async () => {
    const { t } = mock({ [`${A}/robots.txt`]: status(404), [SRC.url]: html("<p>x</p>") });
    expect((await go(t, [cfg()])).r.status).toBe("completed");
  });
});

describe("3. FileStore under concurrent processes", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "uj-store-"));
  afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));
  const bundle = path.join(tmpRoot, "store.mjs");
  buildSync({ entryPoints: [path.join(ROOT, "src/lib/passport/monitor/store.ts")], bundle: true, platform: "node", format: "esm", outfile: bundle, logLevel: "silent" });
  const worker = path.join(tmpRoot, "worker.mjs");
  fs.writeFileSync(
    worker,
    `import { FileStore } from ${JSON.stringify(bundle)};
const [dir, id, n, startAt] = process.argv.slice(2);
const s = new FileStore(dir, { mutexTimeoutMs: 30000 });
while (Date.now() < Number(startAt)) {}
const lock = await s.acquireLock("run", "w" + id, Date.now(), 600000);
for (let i = 0; i < Number(n); i++) {
  await s.appendAudit({ at: new Date().toISOString(), actor: "w" + id, action: "check", subject: "s", detail: String(i) });
  await s.openReviewItem({ kind: "content-changed", dedupeKey: "w" + id + ":" + i, sourceId: "s", sourceUrl: "https://x.example.gov", createdAt: "t", priority: "normal", detail: "", ruleIds: [], signals: [] });
  const st = (await s.getState("counter")) ?? { sourceId: "counter", consecutiveFailures: 0, errors: [] };
  await s.putState({ ...st, consecutiveFailures: st.consecutiveFailures });
}
process.stdout.write(JSON.stringify({ lock }));
`,
  );

  it("6 processes × 40 writes: no lost updates, an intact audit chain and exactly one run-lock winner", async () => {
    const dir = path.join(tmpRoot, "shared");
    const N = 6, M = 40;
    const startAt = Date.now() + 1500;
    const outs = await Promise.all(Array.from({ length: N }, (_, i) => run(process.execPath, [worker, dir, String(i), String(M), String(startAt)], { timeout: 60_000 })));
    const locks = outs.map((o) => JSON.parse(o.stdout).lock as boolean);
    expect(locks.filter(Boolean)).toHaveLength(1);
    const store = new FileStore(dir);
    const audit = await store.readAudit();
    expect(audit).toHaveLength(N * M);
    expect(verifyAuditChain(audit)).toEqual({ ok: true });
    const items = await store.listReviewItems();
    expect(items).toHaveLength(N * M);
    expect(new Set(items.map((i) => i.id)).size).toBe(N * M);
    expect(new Set(items.map((i) => i.dedupeKey)).size).toBe(N * M);
    expect(fs.existsSync(store.mutexPath)).toBe(false);
    expect(fs.readdirSync(dir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  }, 90_000);

  it("fails closed when another process holds (or a crashed process left) the store lock", async () => {
    const dir = fs.mkdtempSync(path.join(tmpRoot, "locked-"));
    const s = new FileStore(dir, { mutexTimeoutMs: 50 });
    await s.putState({ sourceId: "x", consecutiveFailures: 0, errors: [] });
    const before = fs.readFileSync(path.join(dir, "state.json"), "utf8");
    fs.writeFileSync(s.mutexPath, JSON.stringify({ token: "someone-else" }));
    await expect(s.putState({ sourceId: "y", consecutiveFailures: 0, errors: [] })).rejects.toBeInstanceOf(StoreLockedError);
    await expect(s.appendAudit({ at: "t", actor: "a", action: "b", subject: "c", detail: "d" })).rejects.toBeInstanceOf(StoreLockedError);
    expect(fs.readFileSync(path.join(dir, "state.json"), "utf8")).toBe(before);
    expect(JSON.parse(fs.readFileSync(s.mutexPath, "utf8")).token).toBe("someone-else");
    const { t, calls } = mock({ [SRC.url]: html("<p>x</p>") });
    await expect(runMonitor({ sources: [SRC], configs: [cfg()], rules: [], store: s, transport: t, now, sleep: async () => {}, runId: "r" })).rejects.toBeInstanceOf(StoreLockedError);
    expect(calls).toEqual([]);
  });

  it("refuses to overwrite corrupt state and to extend a tampered audit chain", async () => {
    const dir = fs.mkdtempSync(path.join(tmpRoot, "corrupt-"));
    const s = new FileStore(dir);
    fs.writeFileSync(path.join(dir, "state.json"), "{ not json");
    await expect(s.putState({ sourceId: "x", consecutiveFailures: 0, errors: [] })).rejects.toBeInstanceOf(StoreIntegrityError);
    expect(fs.readFileSync(path.join(dir, "state.json"), "utf8")).toBe("{ not json");

    const dir2 = fs.mkdtempSync(path.join(tmpRoot, "tamper-"));
    const s2 = new FileStore(dir2);
    for (let i = 0; i < 3; i++) await s2.appendAudit({ at: "t", actor: "a", action: "b", subject: "c", detail: String(i) });
    const p = path.join(dir2, "audit.jsonl");
    const lines = fs.readFileSync(p, "utf8").trim().split("\n");
    lines[1] = lines[1].replace('"detail":"1"', '"detail":"edited"');
    fs.writeFileSync(p, lines.join("\n") + "\n");
    const tampered = fs.readFileSync(p, "utf8");
    await expect(s2.appendAudit({ at: "t", actor: "a", action: "b", subject: "c", detail: "3" })).rejects.toBeInstanceOf(StoreIntegrityError);
    expect(fs.readFileSync(p, "utf8")).toBe(tampered);
    fs.appendFileSync(p, "{ torn line");
    await expect(s2.readAudit()).rejects.toBeInstanceOf(StoreIntegrityError);
  });

  it("re-entrant operations inside one store do not deadlock", async () => {
    const s = new FileStore(fs.mkdtempSync(path.join(tmpRoot, "reent-")), { mutexTimeoutMs: 200 });
    expect(await s.acquireLock("run", "a", 0, 1000)).toBe(true);
    await s.releaseLock("run", "a");
    expect(await s.acquireLock("run", "b", 1, 1000)).toBe(true);
  });
});

describe("4. SSRF regression matrix", () => {
  const allowed = new Set(["immigration.example.gov"]);
  it("rejects URL-parsing tricks before any request", () => {
    const cases: [string, string][] = [
      ["https://immigration.example.gov@evil.example.com/", "credentials-in-url"],
      ["https://evil.example.com#@immigration.example.gov/", "host-not-allowed"],
      ["https://evil.example.com\\@immigration.example.gov/", "host-not-allowed"],
      ["https://0x7f.1/", "ip-literal"],
      ["https://0177.0.0.1/", "ip-literal"],
      ["https://2852039166/", "ip-literal"],
      ["https://[::ffff:169.254.169.254]/", "ip-literal"],
      ["https://[fd00:ec2::254]/", "ip-literal"],
      ["https://immigration.example.gov./", "host-not-fqdn"],
      ["https://immigration.example.gov:444/", "non-standard-port"],
      ["https://metadata.google.internal/computeMetadata/v1/", "internal-hostname"],
      ["https://router.home.arpa/", "internal-hostname"],
      ["ftp://immigration.example.gov/", "scheme-not-https"],
      ["javascript:alert(1)", "scheme-not-https"],
      ["data:text/html,<p>x</p>", "scheme-not-https"],
      ["file:///etc/passwd", "scheme-not-https"],
      ["https://xn--mmigration-u8a.example.gov/", "host-not-allowed"],
    ];
    for (const [u, reason] of cases) expect(validateSourceUrl(u, allowed), u).toEqual({ ok: false, reason });
    expect(validateSourceUrl("https://IMMIGRATION.example.gov/visa", allowed).ok).toBe(true);
  });

  it("blocks cloud metadata and private addresses in every notation", () => {
    for (const ip of ["169.254.169.254", "100.100.100.200", "168.63.129.16", "fd00:ec2::254", "::ffff:169.254.169.254", "::ffff:a9fe:a9fe", "64:ff9b::a9fe:a9fe", "2002:a9fe:a9fe::1", "0:0:0:0:0:ffff:7f00:1", "fe80::1%eth0", "::127.0.0.1", "2001::1", "100::1"]) {
      expect(isBlockedAddress(ip), ip).toBe(true);
    }
  });

  it("rejects redirects to private, metadata, IPv6, downgraded, odd-port and foreign targets without requesting them", async () => {
    const targets = [
      "https://169.254.169.254/latest/meta-data/", "https://[::1]/", "https://[fd00:ec2::254]/", "https://0x7f000001/", "http://immigration.example.gov/visa",
      "https://immigration.example.gov:8443/visa", "https://evil.example.com/", "file:///etc/passwd", "data:text/plain,x", "javascript:alert(1)", "//evil.example.com/x",
      "https://user:pw@immigration.example.gov/visa",
    ];
    for (const loc of targets) {
      const { t, calls } = mock({ [`${A}/visa`]: status(302, { location: loc }) });
      const r = await safeFetch(`${A}/visa`, { transport: t, allowedHosts: allowed, userAgent: "t", maxBytes: 1000, timeoutMs: 1000 });
      expect(r.kind, loc).toBe("redirect-rejected");
      expect(calls, loc).toEqual([`${A}/visa`]);
    }
  });

  it("blocks DNS rebinding: a public answer on the first lookup does not whitelist a private one later", async () => {
    const answers = [[{ address: "93.184.216.34", family: 4 }], [{ address: "169.254.169.254", family: 4 }], [{ address: "fd00:ec2::254", family: 6 }]];
    let n = 0;
    const lookup = guardedLookup((_h, _o, cb) => cb(null, answers[Math.min(n++, answers.length - 1)]));
    const ask = () => new Promise<unknown>((resolve) => lookup("immigration.example.gov", {}, (e, a) => resolve(e ? "blocked" : a)));
    expect(await ask()).toBe("93.184.216.34");
    expect(await ask()).toBe("blocked");
    expect(await ask()).toBe("blocked");
  });

  it("blocks a mixed DNS answer even when the first address is public, in both lookup modes", async () => {
    const mixed = [{ address: "93.184.216.34", family: 4 }, { address: "::1", family: 6 }];
    const lookup = guardedLookup((_h, _o, cb) => cb(null, mixed));
    for (const opts of [{}, { all: true }]) {
      const r = await new Promise((resolve) => lookup("immigration.example.gov", opts, (e) => resolve(e)));
      expect(r).toBeInstanceOf(Error);
    }
  });

  it("the production transport refuses to connect for every blocked DNS answer (no network)", async () => {
    for (const address of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "168.63.129.16", "::1", "fd00:ec2::254", "::ffff:10.0.0.1"]) {
      const family = address.includes(":") ? 6 : 4;
      const transport = nodeHttpsTransport(guardedLookup((_h, _o, cb) => cb(null, [{ address, family }])));
      const r = await safeFetch(`${A}/visa`, { transport, allowedHosts: allowed, userAgent: "t", maxBytes: 1000, timeoutMs: 2000 });
      expect(r, address).toEqual({ kind: "blocked", reason: "blocked-address" });
    }
  });
});
