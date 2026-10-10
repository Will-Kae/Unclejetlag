/**
 * Per-source monitoring configuration.
 *
 * Every source starts disabled. A source may be checked automatically only after a person has
 * reviewed its terms of use and robots.txt and recorded that review here. The runner also obeys
 * robots.txt at run time. Strategies:
 * - "html" / "pdf": fetched, extracted and compared.
 * - "manual-js": the page needs a browser (JavaScript-rendered or behind a bot challenge). Never
 *   fetched; a person re-reads it when its rules fall review-due (180 days, methodology v0.1).
 *   A headless-browser strategy would need its own security review (Phase 2B-D or later).
 * - "manual": checked by a person only.
 */
import type { Source } from "../types";

export type MonitorStrategy = "html" | "pdf" | "manual-js" | "manual";

export type TermsReview = { reviewedOn: string; reviewer: string; robotsAllows: boolean; termsAllow: boolean; notes?: string };

export type SourceMonitorConfig = {
  sourceId: string;
  strategy: MonitorStrategy;
  enabled: boolean;
  /** Days between checks once enabled. */
  frequencyDays: number;
  startMarker?: string;
  endMarker?: string;
  termsReview: TermsReview | null;
  note?: string;
};

const PDF_SOURCES = new Set(["eu-2018-1806", "ie-visa-list", "na-mha-2025"]);

/** Defaults for every registered source: disabled until a terms/robots review is recorded. */
export function defaultMonitorConfigs(sources: Source[]): SourceMonitorConfig[] {
  return sources.map((s) => ({
    sourceId: s.id,
    strategy: PDF_SOURCES.has(s.id) || /\.pdf($|\?)/i.test(s.url) ? "pdf" : "html",
    enabled: false,
    frequencyDays: 7,
    termsReview: null,
    note: "Disabled: terms of use and robots.txt not yet reviewed.",
  }));
}

/** Problems that would make a config unsafe to run. */
export function validateMonitorConfigs(configs: SourceMonitorConfig[], sources: Source[]): string[] {
  const issues: string[] = [];
  const ids = new Set(sources.map((s) => s.id));
  const seen = new Set<string>();
  for (const c of configs) {
    if (seen.has(c.sourceId)) issues.push(`${c.sourceId}: duplicate monitor config`);
    seen.add(c.sourceId);
    if (!ids.has(c.sourceId)) issues.push(`${c.sourceId}: no such source`);
    if (!Number.isInteger(c.frequencyDays) || c.frequencyDays < 1) issues.push(`${c.sourceId}: frequencyDays must be a whole number ≥ 1`);
    if (c.enabled) {
      if (!c.termsReview) issues.push(`${c.sourceId}: enabled without a recorded terms/robots review`);
      else if (!c.termsReview.robotsAllows || !c.termsReview.termsAllow) issues.push(`${c.sourceId}: enabled although the review did not allow automated access`);
      if (c.strategy === "manual" || c.strategy === "manual-js") issues.push(`${c.sourceId}: manual strategies cannot be enabled for automated fetching`);
    }
  }
  for (const s of sources) if (!seen.has(s.id)) issues.push(`${s.id}: no monitor config`);
  return issues;
}
