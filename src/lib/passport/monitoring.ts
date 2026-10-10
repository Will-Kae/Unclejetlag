/**
 * Official-source monitoring: architecture and decision logic (Phase 2A).
 *
 * This module decides what a monitor should do; it does not fetch anything. No runner, schedule or
 * storage exists yet: those need a separate architecture decision (Phase 2B). The rules it encodes:
 *
 * 1. A change detected on a source page never changes a rule. It creates a review task.
 * 2. Only sources whose terms and robots.txt have been reviewed are checked automatically; everything
 *    else is "manual". A robots disallow, login wall, CAPTCHA or bot challenge switches the source to
 *    manual. The monitor never bypasses access controls.
 * 3. Requests are rate-limited per host and retried with back-off. Repeated failures raise a
 *    "source unavailable" task; the rules stay as they are and are flagged, never removed.
 * 4. Every check, outcome and task is written to an append-only audit log.
 * See docs/passport-source-monitoring.md.
 */
import type { Source } from "./types";

export type MonitoringMode = "automated" | "manual";

export const MONITOR_POLICY = {
  /** Identify ourselves honestly; never spoof a browser. */
  userAgent: "UncleJetlagSourceMonitor/0.1 (+https://unclejetlag.com/passport-index/data-sources)",
  /** At most this many requests per host per minute, across all sources on that host. */
  maxRequestsPerHostPerMinute: 2,
  /** Minimum days between automated checks of one source. */
  minDaysBetweenChecks: 7,
  /** Back-off between attempts within one check (ms). */
  retryBackoffMs: [60_000, 300_000, 1_800_000],
  /** Consecutive failed checks before a "source unavailable" review task is raised. */
  failuresBeforeUnavailableTask: 3,
  requestTimeoutMs: 30_000,
} as const;

/**
 * Monitoring mode per source. All "manual" at Phase 2A: no source's terms or robots.txt have been
 * reviewed for automated access yet, and several African immigration portals are JavaScript-only or
 * block automated readers (docs/passport-index.md).
 */
export const monitoringMode = (_source: Source): MonitoringMode => "manual";

export type CheckOutcome = "changed" | "unchanged" | "http-error" | "timeout" | "blocked" | "robots-disallowed" | "not-found";

export type CheckResult = {
  sourceId: string;
  at: string; // ISO timestamp
  outcome: CheckOutcome;
  httpStatus?: number;
  /** Hash of normaliseForHash(text). Computed by the runner. */
  contentHash?: string;
  attempts: number;
};

export type SourceState = {
  sourceId: string;
  mode: MonitoringMode;
  lastHash?: string;
  lastOkAt?: string;
  consecutiveFailures: number;
};

export type ReviewTaskKind = "content-changed" | "source-unavailable" | "source-moved-or-removed" | "manual-check-required" | "review-due";

export type ReviewTask = { kind: ReviewTaskKind; sourceId: string; createdAt: string; ruleIds: string[]; detail: string };

export type AuditEvent = { at: string; sourceId: string; event: "check" | "task-created" | "mode-changed"; outcome?: CheckOutcome; detail: string };

/**
 * Strip markup and volatile text before hashing so cosmetic changes (scripts, whitespace, timestamps,
 * session tokens in links) do not raise tasks. Conservative: when unsure, a change raises a task.
 */
export function normaliseForHash(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Decide the consequences of one check. Pure: returns the new state, audit events and any review task.
 * It never returns a rule change.
 */
export function evaluateCheck(state: SourceState, result: CheckResult, ruleIds: string[]): { state: SourceState; events: AuditEvent[]; task?: ReviewTask } {
  const events: AuditEvent[] = [{ at: result.at, sourceId: result.sourceId, event: "check", outcome: result.outcome, detail: `attempts=${result.attempts}${result.httpStatus ? ` http=${result.httpStatus}` : ""}` }];
  const task = (kind: ReviewTaskKind, detail: string): ReviewTask => {
    events.push({ at: result.at, sourceId: result.sourceId, event: "task-created", detail: `${kind}: ${detail}` });
    return { kind, sourceId: result.sourceId, createdAt: result.at, ruleIds, detail };
  };

  if (result.outcome === "blocked" || result.outcome === "robots-disallowed") {
    const next: SourceState = { ...state, mode: "manual" };
    if (state.mode !== "manual") events.push({ at: result.at, sourceId: result.sourceId, event: "mode-changed", detail: "automated → manual (access refused; not bypassed)" });
    return { state: next, events, task: task("manual-check-required", "Automated access refused. Read the source manually.") };
  }
  if (result.outcome === "not-found") {
    return { state: { ...state, consecutiveFailures: state.consecutiveFailures + 1 }, events, task: task("source-moved-or-removed", "Source returned not found. Find the official replacement; rules stay unchanged and flagged until reviewed.") };
  }
  if (result.outcome === "http-error" || result.outcome === "timeout") {
    const failures = state.consecutiveFailures + 1;
    const next = { ...state, consecutiveFailures: failures };
    if (failures === MONITOR_POLICY.failuresBeforeUnavailableTask) return { state: next, events, task: task("source-unavailable", `${failures} consecutive failed checks. Rules stay published and flagged; do not remove them because a site is down.`) };
    return { state: next, events };
  }
  // A successful fetch.
  const base: SourceState = { ...state, consecutiveFailures: 0, lastOkAt: result.at, lastHash: result.contentHash ?? state.lastHash };
  if (state.lastHash && result.contentHash && result.contentHash !== state.lastHash) {
    return { state: base, events, task: task("content-changed", "Page content changed since the last check. Read it and confirm, amend or supersede the affected rules. A changed page is not evidence of a policy change on its own.") };
  }
  return { state: base, events };
}

/** Sources due an automated check on `today`, ordered oldest first, respecting the per-source interval. */
export function planChecks(states: SourceState[], today: string): SourceState[] {
  const dayMs = 86_400_000;
  return states
    .filter((s) => s.mode === "automated")
    .filter((s) => !s.lastOkAt || (Date.parse(`${today}T00:00:00Z`) - Date.parse(s.lastOkAt)) / dayMs >= MONITOR_POLICY.minDaysBetweenChecks)
    .sort((a, b) => (a.lastOkAt ?? "").localeCompare(b.lastOkAt ?? ""));
}

/** Spread planned checks so no host gets more than the per-minute limit. Returns minute offsets. */
export function scheduleByHost(urls: { sourceId: string; url: string }[]): { sourceId: string; minute: number }[] {
  const perHost = new Map<string, number>();
  return urls.map(({ sourceId, url }) => {
    const host = new URL(url).host;
    const n = perHost.get(host) ?? 0;
    perHost.set(host, n + 1);
    return { sourceId, minute: Math.floor(n / MONITOR_POLICY.maxRequestsPerHostPerMinute) };
  });
}
