/**
 * One monitoring run over the official-source registry (Phase 2B-A).
 *
 * The runner reads the registry and its monitor configs, checks due sources, records state, snapshots,
 * audit events and review items in a MonitorStore, and returns run metrics. It NEVER changes a source,
 * a rule or a dataset: it has no access to data.ts beyond reading, and it never touches Source.checked.
 * A detected change becomes a review item with before/after lines and the official URL; a person
 * decides what it means.
 *
 * Every dependency (transport, PDF extractor, clock, sleep, store) is injected, so tests are
 * deterministic and never touch live government websites.
 */
import { jName } from "../jurisdictions";
import { MONITOR_POLICY } from "../monitoring";
import type { AccessRule, Source } from "../types";
import { ruleId } from "../verification";
import { validateMonitorConfigs, type SourceMonitorConfig } from "./config";
import { extractText, pdfjsExtractor, type PdfTextExtractor } from "./extract";
import { safeFetch, withRetry, type FetchResult, type RequestGate, type Transport } from "./fetcher";
import { classifyChange, normaliseText, sha256 } from "./fingerprint";
import { isPathAllowed, parseRobots } from "./robots";
import type { MonitorRun, MonitorStore, ReviewItem, SourceMonitorState } from "./store";

export const MONITOR_LIMITS = { htmlMaxBytes: 5_000_000, pdfMaxBytes: 20_000_000, robotsMaxBytes: 500_000, maxEvidenceLines: 40, lockTtlMs: 30 * 60_000 } as const;
export const ROBOTS_TOKEN = "UncleJetlagSourceMonitor";
const LOCK = "passport-source-monitor";

export type RunOptions = {
  sources: Source[];
  configs: SourceMonitorConfig[];
  rules: AccessRule[];
  store: MonitorStore;
  transport: Transport;
  pdf?: PdfTextExtractor;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  runId: string;
  /** Check these sources even if not yet due (still must be enabled). */
  force?: boolean;
};

const DAY = 86_400_000;

export async function runMonitor(o: RunOptions): Promise<MonitorRun> {
  const iso = () => o.now().toISOString();
  const run: MonitorRun = { id: o.runId, startedAt: iso(), status: "running", due: 0, checked: 0, unchanged: 0, cosmetic: 0, changed: 0, baselines: 0, failed: 0, itemsCreated: 0 };
  const audit = (action: string, subject: string, detail: string) => o.store.appendAudit({ at: iso(), actor: `monitor:${o.runId}`, action, subject, detail });

  // Fail closed: any invalid monitor config (e.g. a source enabled without an explicitly positive terms
  // and robots review) refuses the whole run before a single network request is made.
  const configIssues = validateMonitorConfigs(o.configs, o.sources);
  if (configIssues.length) {
    const refused = { ...run, status: "refused-invalid-config" as const, finishedAt: iso(), error: configIssues.slice(0, 20).join("; ").slice(0, 1000) };
    await o.store.saveRun(refused);
    await audit("run-refused", o.runId, `invalid monitor config: ${configIssues.length} issue(s)`);
    return refused;
  }

  if (!(await o.store.acquireLock(LOCK, o.runId, o.now().getTime(), MONITOR_LIMITS.lockTtlMs))) {
    const skipped = { ...run, status: "skipped-locked" as const, finishedAt: iso() };
    await o.store.saveRun(skipped);
    await audit("run-skipped", LOCK, "another run holds the lock");
    return skipped;
  }
  await o.store.saveRun(run);
  await audit("run-started", o.runId, "");

  try {
    const sourceMap = new Map(o.sources.map((s) => [s.id, s]));
    const allowedHosts = new Set(o.sources.map((s) => new URL(s.url).hostname.toLowerCase()));
    const due: { cfg: SourceMonitorConfig; source: Source; state: SourceMonitorState }[] = [];
    for (const cfg of o.configs) {
      const source = sourceMap.get(cfg.sourceId);
      if (!source || !cfg.enabled || !cfg.termsReview || (cfg.strategy !== "html" && cfg.strategy !== "pdf")) continue;
      const state = (await o.store.getState(cfg.sourceId)) ?? { sourceId: cfg.sourceId, consecutiveFailures: 0, errors: [] };
      const last = state.lastCheckedAt ? Date.parse(state.lastCheckedAt) : 0;
      if (o.force || !last || o.now().getTime() - last >= cfg.frequencyDays * DAY) due.push({ cfg, source, state });
    }
    run.due = due.length;

    // Per-host rate limit: requests to the same host are spaced 60s / maxRequestsPerHostPerMinute apart.
    const hostsSeen = new Set<string>();
    const spacing = 60_000 / MONITOR_POLICY.maxRequestsPerHostPerMinute;
    const pace = async (host: string) => {
      if (hostsSeen.has(host)) await o.sleep(spacing);
      hostsSeen.add(host);
    };
    const fetchOpts = { transport: o.transport, allowedHosts, userAgent: MONITOR_POLICY.userAgent, timeoutMs: MONITOR_POLICY.requestTimeoutMs };

    // robots.txt, fetched once per host per run and enforced before EVERY request, including each
    // redirect hop (to another path on the same host or to another approved host). An unreachable
    // robots.txt (5xx, timeout, refusal) means: do not fetch from that host.
    const robotsCache = new Map<string, { allowed: (p: string) => boolean; reason?: string }>();
    const gate = async (target: URL): Promise<RequestGate> => {
      const host = target.hostname.toLowerCase();
      if (!robotsCache.has(host)) {
        await pace(host);
        const r = await safeFetch(`https://${host}/robots.txt`, { ...fetchOpts, maxBytes: MONITOR_LIMITS.robotsMaxBytes, accept: ["text/plain", "text/html"] });
        if (r.kind === "ok") {
          const parsed = parseRobots(new TextDecoder().decode(r.body), ROBOTS_TOKEN);
          robotsCache.set(host, { allowed: (p) => isPathAllowed(parsed, p) });
        } else if (r.kind === "not-found") robotsCache.set(host, { allowed: () => true });
        else robotsCache.set(host, { allowed: () => false, reason: `robots.txt unavailable (${r.kind})` });
      }
      const robots = robotsCache.get(host)!;
      if (!robots.allowed(target.pathname + target.search)) return { allowed: false, reason: robots.reason ?? `robots.txt disallows ${target.pathname}` };
      await pace(host);
      return { allowed: true };
    };

    for (const { cfg, source, state } of due) {
      const rules = o.rules.filter((r) => r.sourceId === source.id || r.additionalSourceIds?.includes(source.id));
      const ruleIds = rules.map(ruleId).sort();
      const watchNames = [...new Set(rules.map((r) => jName(r.passport).toLowerCase()))];
      const openItem = async (kind: ReviewItem["kind"], dedupeKey: string, detail: string, extra: Partial<ReviewItem> = {}) => {
        const { item, created } = await o.store.openReviewItem({ kind, dedupeKey, sourceId: source.id, sourceUrl: source.url, createdAt: iso(), priority: "normal", detail, ruleIds, signals: [], ...extra });
        if (created) {
          run.itemsCreated++;
          await audit("review-item-opened", item.id, `${kind} ${source.id}`);
        }
      };

      const maxBytes = cfg.strategy === "pdf" ? MONITOR_LIMITS.pdfMaxBytes : MONITOR_LIMITS.htmlMaxBytes;
      const { result, attempts } = await withRetry(() => safeFetch(source.url, { ...fetchOpts, maxBytes, etag: state.etag, lastModified: state.lastModified, beforeRequest: gate }), MONITOR_POLICY.retryBackoffMs, o.sleep);
      run.checked++;
      const base: SourceMonitorState = { ...state, lastCheckedAt: iso(), lastOutcome: result.kind };
      await audit("check", source.id, `${result.kind} attempts=${attempts}`);

      const fail = async (kind: string, detail: string) => {
        run.failed++;
        const failures = state.consecutiveFailures + 1;
        await o.store.putState({ ...base, consecutiveFailures: failures, errors: [...state.errors, { at: iso(), kind, detail }] });
        return failures;
      };

      if (result.kind === "not-modified") {
        run.unchanged++;
        await o.store.putState({ ...base, lastSuccessAt: iso(), consecutiveFailures: 0 });
        continue;
      }
      if (result.kind === "robots-disallowed") {
        await o.store.putState(base);
        await openItem("manual-check-required", `${source.id}:robots`, `Automated access is not permitted (${result.reason}; at ${result.url}). Read the source manually; do not work around it.`);
        continue;
      }
      if (result.kind !== "ok") {
        const detail = describe(result);
        const failures = await fail(result.kind, detail);
        if (result.kind === "not-found") await openItem("source-moved-or-removed", `${source.id}:not-found`, `The official URL returned ${result.status}. Find the official replacement; rules stay published and flagged until reviewed.`, { priority: "high" });
        else if (result.kind === "redirect-rejected") await openItem("source-moved-or-removed", `${source.id}:redirect:${result.location}`, `The source redirects to ${result.location}, which is not an approved official host (${result.reason}). Not followed.`, { priority: "high" });
        else if (result.kind === "blocked") await openItem("manual-check-required", `${source.id}:blocked`, `Automated access refused (${result.reason}). Read the source manually; do not work around it.`);
        else if (result.kind === "too-large" || result.kind === "unsupported-content-type") await openItem("extraction-failed", `${source.id}:${result.kind}`, detail);
        else if (failures >= MONITOR_POLICY.failuresBeforeUnavailableTask) await openItem("source-unavailable", `${source.id}:unavailable`, `${failures} consecutive failed checks (${detail}). Rules stay published and flagged; never remove a rule because a site is down.`);
        continue;
      }

      const extracted = await extractText(result.contentType, result.body, cfg, o.pdf ?? pdfjsExtractor);
      if (!extracted.ok) {
        await fail(`extract:${extracted.reason}`, extracted.detail ?? extracted.reason);
        await openItem("extraction-failed", `${source.id}:extract:${extracted.reason}:${sha256(result.body)}`, `Could not read text from the source (${extracted.reason}). Check it manually.`);
        continue;
      }
      const text = normaliseText(extracted.text);
      const next = { rawHash: sha256(result.body), textHash: sha256(text), text };
      const ok: SourceMonitorState = { ...base, lastSuccessAt: iso(), consecutiveFailures: 0, etag: result.etag, lastModified: result.lastModified, finalUrl: result.finalUrl, rawHash: next.rawHash, textHash: next.textHash };
      await o.store.putSnapshot(text);
      if (extracted.markerMissing) await openItem("marker-missing", `${source.id}:marker:${next.textHash}`, "The configured start/end marker was not found; the page layout may have changed. Check the source and the monitor config.");

      if (!state.textHash) {
        run.baselines++;
        await o.store.putState(ok);
        await audit("baseline-recorded", source.id, next.textHash);
        continue;
      }
      const before = await o.store.getSnapshot(state.textHash);
      const c = classifyChange({ rawHash: state.rawHash, textHash: state.textHash, text: before }, next, watchNames);
      await o.store.putState(ok);
      if (c.change === "none") run.unchanged++;
      else if (c.change === "cosmetic") {
        run.cosmetic++;
        await audit("cosmetic-change", source.id, `${state.rawHash?.slice(0, 12)} → ${next.rawHash.slice(0, 12)}`);
      } else {
        run.changed++;
        await openItem("content-changed", `${source.id}:changed:${next.textHash}`, "The official source's text changed. Read it and decide whether any rule must be confirmed, amended or superseded. A changed page is not, by itself, evidence of a policy change.", {
          priority: c.priority,
          signals: c.signals,
          beforeHash: state.textHash,
          afterHash: next.textHash,
          removedLines: c.diff.removed.slice(0, MONITOR_LIMITS.maxEvidenceLines),
          addedLines: c.diff.added.slice(0, MONITOR_LIMITS.maxEvidenceLines),
        });
      }
    }
    run.status = "completed";
  } catch (e) {
    run.status = "failed";
    run.error = e instanceof Error ? e.message.slice(0, 300) : String(e);
  } finally {
    run.finishedAt = iso();
    await o.store.saveRun(run);
    await audit("run-finished", o.runId, `${run.status} due=${run.due} checked=${run.checked} changed=${run.changed} failed=${run.failed} items=${run.itemsCreated}`);
    await o.store.releaseLock(LOCK, o.runId);
  }
  return run;
}

function describe(r: FetchResult): string {
  switch (r.kind) {
    case "http-error": return `HTTP ${r.status}`;
    case "rate-limited": return `HTTP 429${r.retryAfter ? ` (retry-after ${r.retryAfter})` : ""}`;
    case "network-error": return `network error: ${r.message}`;
    case "blocked": return `blocked: ${r.reason}`;
    case "not-found": return `HTTP ${r.status}`;
    case "redirect-rejected": return `redirect to ${r.location} rejected (${r.reason})`;
    case "unsupported-content-type": return `unsupported content type ${r.contentType}`;
    default: return r.kind;
  }
}

/** Operational metrics over stored runs and items (for the 2B-C dashboard and alerts). */
export async function monitorMetrics(store: MonitorStore) {
  const runs = (await store.listRuns()).filter((r) => r.status === "completed");
  const checked = runs.reduce((n, r) => n + r.checked, 0);
  const failed = runs.reduce((n, r) => n + r.failed, 0);
  const open = await store.listReviewItems({ status: "open" });
  return {
    completedRuns: runs.length,
    checks: checked,
    successRate: checked ? (checked - failed) / checked : null,
    openReviewItems: open.length,
    openByKind: open.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.kind]: (acc[i.kind] ?? 0) + 1 }), {}),
    oldestOpenItem: open.map((i) => i.createdAt).sort()[0] ?? null,
  };
}
