/**
 * Phase 2B-A: official-source monitoring foundation. Deterministic: every network response comes from
 * a mocked transport, the clock and sleep are injected, and no live government website is contacted.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ruleRecords, rules, sources } from "@/lib/passport/data";
import {
  applyMarkers, BlockedAddressError, classifyChange, defaultMonitorConfigs, diffLines, extractText, FileStore, guardedLookup, htmlToText, isBlockedAddress, isPathAllowed, MemoryStore,
  monitorMetrics, nodeHttpsTransport, normaliseText, parseRobots, pdfjsExtractor, runMonitor, safeFetch, sha256, TimeoutError, TooLargeError, validateMonitorConfigs, validateSourceUrl, verifyAuditChain, withRetry,
  type SourceMonitorConfig, type Transport, type TransportResponse,
} from "@/lib/passport/monitor";
import type { Source } from "@/lib/passport/types";

const ROOT = path.resolve(__dirname, "..");
const enc = (s: string) => new TextEncoder().encode(s);
const html = (body: string, extra: Record<string, string> = {}): TransportResponse => ({ status: 200, headers: { "content-type": "text/html; charset=utf-8", ...extra }, body: enc(body) });
const status = (s: number, headers: Record<string, string> = {}): TransportResponse => ({ status: s, headers, body: new Uint8Array() });

/** Mocked transport: per-URL queue of responses (last one repeats) or thrown errors. Records requests. */
function mockTransport(routes: Record<string, (TransportResponse | Error)[]>) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const t: Transport = async (req) => {
    const url = req.url.toString();
    calls.push({ url, headers: req.headers });
    const q = routes[url];
    if (!q) return status(404);
    const r = q.length > 1 ? q.shift()! : q[0];
    if (r instanceof Error) throw r;
    return r;
  };
  return { t, calls };
}

const SRC: Source = { id: "test-src", title: "Visa exempt list", publisher: "Immigration Department", url: "https://immigration.example.gov/visa-exempt", type: "government", authorityJurisdiction: "ZA", checked: "2026-10-10" };
const PDF_SRC: Source = { ...SRC, id: "test-pdf", url: "https://immigration.example.gov/list.pdf" };
const cfg = (sourceId: string, extra: Partial<SourceMonitorConfig> = {}): SourceMonitorConfig => ({ sourceId, strategy: "html", enabled: true, frequencyDays: 7, termsReview: { reviewedOn: "2026-10-10", reviewer: "founder", robotsAllows: true, termsAllow: true }, ...extra });
const testRules = [{ passport: "ZW", destination: "ZA", category: "visa-free" as const, evidence: "Listed as exempt", sourceId: "test-src", verification: "verified" as const, confidence: "high" as const }];
const ROBOTS = "https://immigration.example.gov/robots.txt";
const page = (items: string[]) => `<html><head><script>var t=${Math.random()}</script></head><body><nav>Home | About</nav><main><h1>Visa exempt countries</h1><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></main><footer>Last updated: 10:42</footer></body></html>`;

function clock(start = "2026-10-10T08:00:00Z") {
  let t = Date.parse(start);
  return { now: () => new Date(t), advanceDays: (d: number) => { t += d * 86_400_000; } };
}
const noSleep = async () => {};

describe("URL safety (SSRF)", () => {
  it("accepts only https URLs with a public hostname on port 443", () => {
    expect(validateSourceUrl("https://www.gov.uk/guidance/x").ok).toBe(true);
    for (const [u, reason] of [
      ["http://www.gov.uk/x", "scheme-not-https"],
      ["file:///etc/passwd", "scheme-not-https"],
      ["https://user:pw@www.gov.uk/", "credentials-in-url"],
      ["https://www.gov.uk:8443/", "non-standard-port"],
      ["https://127.0.0.1/", "ip-literal"],
      ["https://[::1]/", "ip-literal"],
      ["https://2130706433/", "ip-literal"],
      ["https://localhost/", "host-not-fqdn"],
      ["https://metadata.google.internal/", "internal-hostname"],
      ["not a url", "url-invalid"],
    ] as const) expect(validateSourceUrl(u), u).toEqual({ ok: false, reason });
  });
  it("enforces the host allow-list", () => {
    expect(validateSourceUrl("https://evil.example.com/", new Set(["www.gov.uk"]))).toEqual({ ok: false, reason: "host-not-allowed" });
  });
  it("blocks private, loopback, link-local, metadata, multicast and reserved addresses (v4 and v6)", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1", "::1", "::", "fe80::1", "fc00::1", "fd12::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::a00:1", "2002:a00:1::", "2001:db8::1", "not-an-ip"]) expect(isBlockedAddress(ip), ip).toBe(true);
    for (const ip of ["8.8.8.8", "196.21.1.1", "2a00:1450:4001::1", "::ffff:8.8.8.8"]) expect(isBlockedAddress(ip), ip).toBe(false);
  });
  it("refuses a hostname whose DNS answer includes a blocked address (rebinding)", async () => {
    const lookup = guardedLookup((_h, _o, cb) => cb(null, [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.5", family: 4 }]));
    const err = await new Promise((resolve) => lookup("immigration.example.gov", {}, (e) => resolve(e)));
    expect(err).toBeInstanceOf(BlockedAddressError);
    const ok = await new Promise((resolve) => guardedLookup((_h, _o, cb) => cb(null, [{ address: "93.184.216.34", family: 4 }]))("x.example.gov", {}, (e, a) => resolve(e ?? a)));
    expect(ok).toBe("93.184.216.34");
  });
});

describe("production transport", () => {
  it("refuses to connect when DNS answers with a private address (no network needed)", async () => {
    const transport = nodeHttpsTransport(guardedLookup((_h, _o, cb) => cb(null, [{ address: "127.0.0.1", family: 4 }])));
    const r = await safeFetch("https://immigration.example.gov/visa", { transport, allowedHosts: new Set(["immigration.example.gov"]), userAgent: "t", maxBytes: 1000, timeoutMs: 2000 });
    expect(r).toEqual({ kind: "blocked", reason: "blocked-address" });
  });
});

describe("safe fetcher", () => {
  const hosts = new Set(["immigration.example.gov", "www.example.gov"]);
  const base = { allowedHosts: hosts, userAgent: "test", maxBytes: 1000, timeoutMs: 1000 };
  it("sends conditional headers and treats 304 as not modified", async () => {
    const { t, calls } = mockTransport({ [SRC.url]: [status(304)] });
    const r = await safeFetch(SRC.url, { ...base, transport: t, etag: '"abc"', lastModified: "Sat, 10 Oct 2026 08:00:00 GMT" });
    expect(r.kind).toBe("not-modified");
    expect(calls[0].headers).toMatchObject({ "if-none-match": '"abc"', "if-modified-since": "Sat, 10 Oct 2026 08:00:00 GMT", "accept-encoding": "identity" });
  });
  it("follows redirects only to allowed https hosts and re-validates every hop", async () => {
    const ok = mockTransport({ [SRC.url]: [status(301, { location: "https://www.example.gov/new" })], "https://www.example.gov/new": [html("<p>x</p>")] });
    const r = await safeFetch(SRC.url, { ...base, transport: ok.t });
    expect(r).toMatchObject({ kind: "ok", finalUrl: "https://www.example.gov/new", redirects: ["https://www.example.gov/new"] });
    for (const loc of ["https://attacker.example.com/", "http://www.example.gov/", "https://169.254.169.254/latest/meta-data/"]) {
      const bad = mockTransport({ [SRC.url]: [status(302, { location: loc })] });
      expect((await safeFetch(SRC.url, { ...base, transport: bad.t })).kind, loc).toBe("redirect-rejected");
      expect(bad.calls).toHaveLength(1);
    }
  });
  it("stops redirect loops", async () => {
    const { t } = mockTransport({ [SRC.url]: [status(302, { location: SRC.url })] });
    expect(await safeFetch(SRC.url, { ...base, transport: t })).toMatchObject({ kind: "redirect-rejected", reason: "too-many-redirects" });
  });
  it("maps errors, refusals and oversized or unexpected content to safe outcomes", async () => {
    const cases: [TransportResponse | Error, string][] = [
      [status(404), "not-found"], [status(410), "not-found"], [status(403), "blocked"], [status(429), "rate-limited"], [status(503), "http-error"],
      [new TimeoutError("t"), "timeout"], [new TooLargeError("big"), "too-large"], [new BlockedAddressError("rebind"), "blocked"], [new Error("ECONNRESET"), "network-error"],
      [{ status: 200, headers: { "content-type": "application/octet-stream" }, body: enc("x") }, "unsupported-content-type"],
      [{ status: 200, headers: { "content-type": "text/html" }, body: new Uint8Array(5000) }, "too-large"],
    ];
    for (const [resp, kind] of cases) {
      const { t } = mockTransport({ [SRC.url]: [resp] });
      expect((await safeFetch(SRC.url, { ...base, transport: t })).kind, kind).toBe(kind);
    }
  });
  it("retries timeouts, 429 and 5xx with back-off, but not 404 or blocked", async () => {
    const waits: number[] = [];
    const sleep = async (ms: number) => { waits.push(ms); };
    const flaky = mockTransport({ [SRC.url]: [status(503), new TimeoutError("t"), html("<p>ok</p>")] });
    const r = await withRetry(() => safeFetch(SRC.url, { ...base, transport: flaky.t }), [10, 20, 30], sleep);
    expect(r).toMatchObject({ attempts: 3, result: { kind: "ok" } });
    expect(waits).toEqual([10, 20]);
    const gone = mockTransport({ [SRC.url]: [status(404)] });
    expect((await withRetry(() => safeFetch(SRC.url, { ...base, transport: gone.t }), [10, 20], sleep)).attempts).toBe(1);
  });
  it("refuses to fetch a malicious source URL at all", async () => {
    const { t, calls } = mockTransport({});
    for (const u of ["https://127.0.0.1/", "http://immigration.example.gov/", "https://other.example.org/"]) expect((await safeFetch(u, { ...base, transport: t })).kind).toBe("blocked");
    expect(calls).toHaveLength(0);
  });
});

describe("robots.txt", () => {
  const txt = "User-agent: *\nDisallow: /private\nAllow: /private/public\n\nUser-agent: UncleJetlagSourceMonitor\nDisallow: /no-monitor\n";
  it("uses the monitor's own group when present, otherwise *", () => {
    const mine = parseRobots(txt, "UncleJetlagSourceMonitor");
    expect(isPathAllowed(mine, "/no-monitor/x")).toBe(false);
    expect(isPathAllowed(mine, "/private")).toBe(true);
    const other = parseRobots(txt, "SomeBot");
    expect(isPathAllowed(other, "/private/x")).toBe(false);
    expect(isPathAllowed(other, "/private/public/x")).toBe(true);
  });
  it("supports wildcards and end anchors", () => {
    const r = parseRobots("User-agent: *\nDisallow: /*.pdf$\n", "x");
    expect(isPathAllowed(r, "/docs/list.pdf")).toBe(false);
    expect(isPathAllowed(r, "/docs/list.pdf?v=1")).toBe(true);
  });
});

describe("content extraction", () => {
  it("turns HTML into lines, dropping scripts, styles and comments", () => {
    const t = htmlToText("<style>p{}</style><p>Visa&nbsp;exempt &amp; free</p><!-- hidden --><script>alert(1)</script><ul><li>Botswana</li><li>Zambia</li></ul><table><tr><td>Ghana</td><td>90 days</td></tr></table>");
    expect(t.split("\n")).toEqual(["Visa exempt & free", "Botswana", "Zambia", "Ghana | 90 days"]);
  });
  it("trims to configured markers and reports a missing marker", () => {
    expect(applyMarkers("menu\nVisa exempt countries\nBotswana\nFooter", { startMarker: "visa exempt", endMarker: "botswana" })).toEqual({ text: "Visa exempt countries\nBotswana", markerMissing: false });
    expect(applyMarkers("menu", { startMarker: "visa exempt" }).markerMissing).toBe(true);
  });
  it("extracts text from a real PDF with pdfjs", async () => {
    const bytes = new Uint8Array(fs.readFileSync(path.join(ROOT, "tests/fixtures/monitor/list-v1.pdf")));
    const r = await extractText("application/pdf", bytes, {});
    expect(r).toMatchObject({ ok: true, pages: 1 });
    expect(r.ok && r.text).toContain("Zambia: 90 days");
  });
  it("handles PDF failures without crashing: not a PDF, corrupt, no text, timeout", async () => {
    expect(await extractText("application/pdf", enc("<html>not a pdf</html>"), {})).toMatchObject({ ok: false, reason: "not-a-pdf" });
    expect(await extractText("application/pdf", enc("%PDF-1.7\n%%garbage that is not a pdf\n%%EOF"), {})).toMatchObject({ ok: false, reason: "pdf-parse-failed" });
    expect(await extractText("application/pdf", enc("%PDF-1.7"), {}, async () => ["", "  "])).toMatchObject({ ok: false, reason: "no-text" });
    expect(await extractText("application/pdf", enc("%PDF-1.7"), {}, () => new Promise(() => {}), 20)).toMatchObject({ ok: false, reason: "pdf-timeout" });
  });
  it("is the pdfjs extractor used by default", () => {
    expect(typeof pdfjsExtractor).toBe("function");
  });
});

describe("change detection", () => {
  it("ignores clock times and page furniture but keeps dates and stay lengths", () => {
    expect(normaliseText("Visa exempt\nLast updated: 12 March 2026\n© 2026 Government")).toBe("visa exempt");
    expect(normaliseText("Botswana 90 days from 1 January 2025 at 10:42")).toBe("botswana 90 days from 1 january 2025 at");
  });
  it("diffs lines", () => {
    expect(diffLines("a\nb\nc", "a\nc\nd")).toEqual({ added: ["d"], removed: ["b"] });
  });
  it("separates none, cosmetic and substantive changes and prioritises named passports", () => {
    const a = { rawHash: "r1", textHash: "t1", text: "botswana 90 days\nzambia 90 days" };
    expect(classifyChange(a, { ...a }, []).change).toBe("none");
    expect(classifyChange(a, { ...a, rawHash: "r2" }, []).change).toBe("cosmetic");
    const c = classifyChange(a, { rawHash: "r3", textHash: "t3", text: "botswana 90 days\nzambia 30 days" }, ["zambia"]);
    expect(c).toMatchObject({ change: "substantive", priority: "high", diff: { removed: ["zambia 90 days"], added: ["zambia 30 days"] } });
    expect(c.signals).toEqual(expect.arrayContaining(["names:zambia", "term:days"]));
  });
});

describe("store and audit trail", () => {
  it("hash-chains the audit log and detects edits, deletions and reordering", async () => {
    const s = new MemoryStore();
    for (let i = 0; i < 3; i++) await s.appendAudit({ at: `2026-10-10T0${i}:00:00Z`, actor: "t", action: "check", subject: "x", detail: String(i) });
    expect(verifyAuditChain(await s.readAudit())).toEqual({ ok: true });
    const raw = s.unsafeAuditForTests();
    raw[1] = { ...raw[1], detail: "edited" };
    expect(verifyAuditChain(await s.readAudit())).toMatchObject({ ok: false, brokenAt: 2, reason: "record altered" });
    const s2 = new MemoryStore();
    for (let i = 0; i < 3; i++) await s2.appendAudit({ at: "t", actor: "t", action: "a", subject: "s", detail: String(i) });
    const recs = await s2.readAudit();
    expect(verifyAuditChain([recs[0], recs[2]]).ok).toBe(false);
  });
  it("de-duplicates open review items", async () => {
    const s = new MemoryStore();
    const item = { kind: "content-changed" as const, dedupeKey: "k", sourceId: "x", sourceUrl: "https://x", createdAt: "t", priority: "normal" as const, detail: "", ruleIds: [], signals: [] };
    expect((await s.openReviewItem(item)).created).toBe(true);
    expect((await s.openReviewItem(item)).created).toBe(false);
    expect(await s.listReviewItems()).toHaveLength(1);
  });
  it("prevents overlapping runs with a lease lock that expires", async () => {
    const s = new MemoryStore();
    expect(await s.acquireLock("m", "run-1", 0, 1000)).toBe(true);
    expect(await s.acquireLock("m", "run-2", 500, 1000)).toBe(false);
    expect(await s.acquireLock("m", "run-2", 1500, 1000)).toBe(true);
  });
  it("persists state, items, snapshots and a verifiable audit log on disk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uj-monitor-"));
    const s = new FileStore(dir);
    const h = await s.putSnapshot("hello");
    await s.appendAudit({ at: "t", actor: "a", action: "b", subject: "c", detail: "d" });
    await s.putState({ sourceId: "x", consecutiveFailures: 0, errors: [] });
    const again = new FileStore(dir);
    expect(await again.getSnapshot(h)).toBe("hello");
    expect(await again.getSnapshot("../../etc/passwd")).toBeUndefined();
    expect(await again.getState("x")).toBeDefined();
    expect(verifyAuditChain(await again.readAudit())).toEqual({ ok: true });
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("monitor configuration", () => {
  it("has a config for every registered source and none is enabled", () => {
    const configs = defaultMonitorConfigs(sources);
    expect(configs).toHaveLength(sources.length);
    expect(configs.filter((c) => c.enabled)).toEqual([]);
    expect(validateMonitorConfigs(configs, sources)).toEqual([]);
    expect(configs.filter((c) => c.strategy === "pdf").map((c) => c.sourceId).sort()).toEqual(["eu-2018-1806", "ie-visa-list", "na-mha-2025"]);
  });
  it("refuses to enable a source without a positive terms/robots review", () => {
    const issues = validateMonitorConfigs([{ ...cfg("za-dirco-exempt"), termsReview: null }, { ...cfg("eu-2018-1806"), termsReview: { reviewedOn: "2026-10-10", reviewer: "f", robotsAllows: false, termsAllow: true } }, { ...cfg("gb-visa-nationals"), strategy: "manual-js" }], sources.slice(0, 3));
    expect(issues.join("\n")).toMatch(/za-dirco-exempt: enabled without/);
    expect(issues.join("\n")).toMatch(/eu-2018-1806: enabled although/);
    expect(issues.join("\n")).toMatch(/gb-visa-nationals: manual strategies/);
  });
});

describe("monitoring runs", () => {
  const setup = (routes: Record<string, (TransportResponse | Error)[]>, configs = [cfg("test-src")], srcs = [SRC]) => {
    const { t, calls } = mockTransport({ [ROBOTS]: [status(404)], ...routes });
    const store = new MemoryStore();
    const c = clock();
    let n = 0;
    const run = (extra: Partial<Parameters<typeof runMonitor>[0]> = {}) => runMonitor({ sources: srcs, configs, rules: testRules, store, transport: t, now: c.now, sleep: noSleep, runId: `run-${++n}`, ...extra });
    return { store, calls, run, clock: c };
  };

  it("records a baseline, then ignores cosmetic changes and raises one review item for a real change", async () => {
    const { store, run, clock } = setup({ [SRC.url]: [html(page(["Botswana: 90 days", "Zimbabwe: 90 days"])), html(page(["Botswana: 90 days", "Zimbabwe: 90 days"])), html(page(["Botswana: 90 days", "Zimbabwe: 30 days"]))] });
    expect(await run()).toMatchObject({ status: "completed", baselines: 1, itemsCreated: 0 });
    clock.advanceDays(7);
    expect(await run()).toMatchObject({ cosmetic: 1, changed: 0, itemsCreated: 0 });
    clock.advanceDays(7);
    expect(await run()).toMatchObject({ changed: 1, itemsCreated: 1 });
    const [item] = await store.listReviewItems();
    expect(item).toMatchObject({ kind: "content-changed", sourceUrl: SRC.url, priority: "high", ruleIds: ["ZW-ZA-test-src"], removedLines: ["zimbabwe: 90 days"], addedLines: ["zimbabwe: 30 days"] });
    expect(item.signals).toContain("names:zimbabwe");
    expect(item.detail).toMatch(/not, by itself, evidence of a policy change/);
    expect(await store.getSnapshot(item.beforeHash!)).toContain("zimbabwe: 90 days");
    expect(await store.getSnapshot(item.afterHash!)).toContain("zimbabwe: 30 days");
    clock.advanceDays(7);
    expect((await run()).itemsCreated).toBe(0);
    expect(verifyAuditChain(await store.readAudit())).toEqual({ ok: true });
  });

  it("uses conditional requests and counts 304 as unchanged", async () => {
    const { calls, run, clock } = setup({ [SRC.url]: [html(page(["A"]), { etag: '"v1"' }), status(304)] });
    await run();
    clock.advanceDays(7);
    expect(await run()).toMatchObject({ unchanged: 1, changed: 0 });
    expect(calls.filter((c) => c.url === SRC.url).at(-1)!.headers["if-none-match"]).toBe('"v1"');
  });

  it("detects a changed PDF list", async () => {
    const pdf = (f: string): TransportResponse => ({ status: 200, headers: { "content-type": "application/pdf" }, body: new Uint8Array(fs.readFileSync(path.join(ROOT, "tests/fixtures/monitor", f))) });
    const { store, run, clock } = setup({ [PDF_SRC.url]: [pdf("list-v1.pdf"), pdf("list-v2.pdf")] }, [cfg("test-pdf", { strategy: "pdf" })], [PDF_SRC]);
    await run();
    clock.advanceDays(7);
    expect(await run()).toMatchObject({ changed: 1 });
    const [item] = await store.listReviewItems();
    expect(item.addedLines).toEqual(expect.arrayContaining(["zambia: 30 days", "ghana: 90 days"]));
  });

  it("raises one source-unavailable item after repeated outages and never removes anything", async () => {
    const { store, run, clock } = setup({ [SRC.url]: [status(503)] });
    for (let i = 0; i < 4; i++) { await run(); clock.advanceDays(7); }
    const items = await store.listReviewItems();
    expect(items.map((i) => i.kind)).toEqual(["source-unavailable"]);
    expect((await store.getState("test-src"))!.consecutiveFailures).toBe(4);
    expect((await store.getState("test-src"))!.errors).toHaveLength(4);
  });

  it("reports moved sources and refuses off-registry redirects", async () => {
    const gone = setup({ [SRC.url]: [status(404)] });
    await gone.run();
    expect((await gone.store.listReviewItems())[0]).toMatchObject({ kind: "source-moved-or-removed", priority: "high" });
    const redir = setup({ [SRC.url]: [status(302, { location: "https://phishing.example.com/visa" })] });
    await redir.run();
    expect((await redir.store.listReviewItems())[0].detail).toMatch(/not an approved official host/);
    expect(redir.calls.some((c) => c.url.includes("phishing"))).toBe(false);
  });

  it("obeys robots.txt and treats an unreachable robots.txt as a refusal", async () => {
    const disallow = setup({ [ROBOTS]: [{ status: 200, headers: { "content-type": "text/plain" }, body: enc("User-agent: *\nDisallow: /visa") }], [SRC.url]: [html("<p>x</p>")] });
    await disallow.run();
    expect(disallow.calls.some((c) => c.url === SRC.url)).toBe(false);
    expect((await disallow.store.listReviewItems())[0].kind).toBe("manual-check-required");
    const down = setup({ [ROBOTS]: [status(500)], [SRC.url]: [html("<p>x</p>")] });
    await down.run();
    expect(down.calls.some((c) => c.url === SRC.url)).toBe(false);
  });

  it("flags extraction failures for review", async () => {
    const { store, run } = setup({ [PDF_SRC.url]: [{ status: 200, headers: { "content-type": "application/pdf" }, body: enc("%PDF-1.4 broken") }] }, [cfg("test-pdf", { strategy: "pdf" })], [PDF_SRC]);
    await run();
    expect((await store.listReviewItems())[0].kind).toBe("extraction-failed");
  });

  it("skips disabled, unreviewed and manual sources and fetches nothing for them", async () => {
    const { calls, run } = setup({ [SRC.url]: [html("<p>x</p>")] }, [cfg("test-src", { enabled: false })]);
    expect(await run()).toMatchObject({ due: 0, checked: 0 });
    const r2 = setup({ [SRC.url]: [html("<p>x</p>")] }, [cfg("test-src", { termsReview: null })]);
    expect((await r2.run()).due).toBe(0);
    const r3 = setup({ [SRC.url]: [html("<p>x</p>")] }, [cfg("test-src", { strategy: "manual-js" })]);
    expect((await r3.run()).due).toBe(0);
    expect([...calls, ...r2.calls, ...r3.calls]).toEqual([]);
  });

  it("checks nothing with the real registry today, because every source is disabled", async () => {
    const { t, calls } = mockTransport({});
    const run = await runMonitor({ sources, configs: defaultMonitorConfigs(sources), rules, store: new MemoryStore(), transport: t, now: clock().now, sleep: noSleep, runId: "real" });
    expect(run).toMatchObject({ status: "completed", due: 0, checked: 0 });
    expect(calls).toEqual([]);
  });

  it("does not run twice at once", async () => {
    const { store, run } = setup({ [SRC.url]: [html("<p>x</p>")] });
    await store.acquireLock("passport-source-monitor", "someone-else", Date.parse("2026-10-10T08:00:00Z"), 60_000);
    expect((await run()).status).toBe("skipped-locked");
  });

  it("spaces requests to the same host", async () => {
    const waits: number[] = [];
    const { run } = setup({ [SRC.url]: [html("<p>x</p>")] });
    await run({ sleep: async (ms) => { waits.push(ms); } });
    expect(waits).toEqual([30_000]);
  });

  it("never changes sources, rules or Source.checked", async () => {
    const before = JSON.stringify({ sources, ruleRecords });
    const srcCopy = structuredClone(SRC);
    const { run, clock } = setup({ [SRC.url]: [html(page(["A"])), html(page(["B"]))] });
    await run();
    clock.advanceDays(7);
    await run();
    expect(SRC).toEqual(srcCopy);
    expect(JSON.stringify({ sources, ruleRecords })).toBe(before);
  });

  it("reports operational metrics", async () => {
    const { store, run, clock } = setup({ [SRC.url]: [html(page(["A"])), status(503)] });
    await run();
    clock.advanceDays(7);
    await run();
    const m = await monitorMetrics(store);
    expect(m).toMatchObject({ completedRuns: 2, checks: 2, successRate: 0.5, openReviewItems: 0 });
  });
});

describe("isolation from the public site", () => {
  it("no page, route or component imports the monitor or node-only modules", () => {
    const files: string[] = [];
    const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|mjs)$/.test(e.name)) files.push(p); } };
    walk(path.join(ROOT, "src/app"));
    walk(path.join(ROOT, "src/components"));
    const offenders = files.filter((f) => /passport\/monitor|pdfjs-dist/.test(fs.readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
    expect(fs.readFileSync(path.join(ROOT, "src/lib/passport/index.ts"), "utf8")).not.toMatch(/monitor\//);
  });
  it("keeps the published dataset exactly as Phase 2A left it", () => {
    expect(rules).toHaveLength(640);
    expect(sha256(JSON.stringify(ruleRecords))).toBe(sha256(JSON.stringify(rules)));
  });
});
