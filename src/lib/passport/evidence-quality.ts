/**
 * Phase 4C.4: evidence-quality checks for the World Passport Index.
 *
 * These checks are read-only. They never change a record's category or status and never approve
 * anything: they report problems so a human reviewer can act. `errors` must be fixed before data
 * ships; `warnings` are tracked against a reviewed baseline (tests/fixtures/passport-evidence-quality-
 * baseline.json) so that new weaknesses fail CI while known ones stay visible.
 */
import { currentMethodology, type MethodologyVersion } from "./methodology";
import type { AccessCategory, AccessRule, Source } from "./types";
import { SOURCE_TIER } from "./types";
import { LEAD_ONLY_DOMAINS } from "./validation";
import { PUBLISHABLE_STATUSES, addDays, detectConflicts, effectiveStatus, inEffect, isIsoDate, pairKey, publicationDecisions, reviewDueOn, ruleId } from "./verification";

export type QualitySeverity = "error" | "warning";

export type QualityCode =
  | "conflicting-classification"
  | "evidence-review-due"
  | "evidence-expired"
  | "source-document-old"
  | "source-check-in-future"
  | "source-missing"
  | "source-not-official"
  | "source-not-https"
  | "diplomatic-exemption-on-ordinary-record"
  | "stay-duration-missing"
  | "stay-duration-contradiction"
  | "duplicate-record"
  | "duplicate-pair"
  | "unsupported-requirement-claim"
  | "unpublishable-record-published";

export type QualityIssue = {
  code: QualityCode;
  severity: QualitySeverity;
  /** Rule id, source id or page path the issue is about. */
  subject: string;
  message: string;
};

/** Categories where the traveller needs no visa before travel: a stay limit matters most here. */
export const STAY_EXPECTED: AccessCategory[] = ["visa-free", "visa-on-arrival", "eta"];

/** A source document older than this (by its own stated date) is flagged for a newer version. */
export const OLD_DOCUMENT_YEARS = 3;

const DIPLOMATIC = /\b(diplomatic|official|service)(\s*(\/|and|or|,)\s*(official|service|diplomatic))*\s+passports?\b|\bdiplomatic and official only\b/i;
const ORDINARY = /\bordinary passports?\b|\ball passports\b|\bholders of all passports\b/i;

/**
 * Entry requirements that must be stated by a source before we repeat them. Each claim in a rule's
 * conditions must also appear in its evidence, its source's title or note, or an additional source.
 */
export const REQUIREMENT_TERMS: { term: string; pattern: RegExp; severity: QualitySeverity }[] = [
  { term: "insurance", pattern: /\binsurance\b/i, severity: "error" },
  { term: "vaccination", pattern: /\b(vaccinat\w*|yellow fever|yellow card)\b/i, severity: "error" },
  { term: "fee", pattern: /\b(fee|USD|US\$|N\$|\$\s?\d)/i, severity: "warning" },
  { term: "return or onward ticket", pattern: /\b(return|onward) ticket\b/i, severity: "warning" },
  { term: "proof of funds", pattern: /\bfunds\b/i, severity: "warning" },
];

const WORD_NUMBERS: Record<string, number> = { thirty: 30, sixty: 60, ninety: 90, "one hundred and eighty": 180, fourteen: 14, seven: 7 };
const MONTHS: Record<string, number> = { one: 30, three: 90, six: 180, twelve: 365 };

/** Stay periods (in days) stated in a piece of text: "90 days", "ninety (90) days", "three months", "six months". */
export function statedStayDays(text: string | undefined): number[] {
  if (!text) return [];
  const out = new Set<number>();
  for (const m of text.matchAll(/\((\d{1,3})\)\s*days|\b(\d{1,3})[\s-]*days?\b/gi)) out.add(Number(m[1] ?? m[2]));
  for (const m of text.matchAll(/\b(thirty|sixty|ninety|fourteen|seven)\s+days\b/gi)) out.add(WORD_NUMBERS[m[1].toLowerCase()]);
  for (const m of text.matchAll(/\b(one|three|six|twelve)\s+months?\b/gi)) out.add(MONTHS[m[1].toLowerCase()]);
  for (const m of text.matchAll(/\bperiod of six months\b/gi)) if (m) out.add(180);
  return [...out].filter((n) => n > 0);
}

const yearsBefore = (date: string, years: number) => `${Number(date.slice(0, 4)) - years}${date.slice(4)}`;

export function auditEvidenceQuality(records: AccessRule[], sources: Source[], asOf: string, m: MethodologyVersion = currentMethodology): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const push = (code: QualityCode, severity: QualitySeverity, subject: string, message: string) => issues.push({ code, severity, subject, message });
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // ── Sources ──
  for (const s of sources) {
    if (!s.url.startsWith("https://")) push("source-not-https", "error", s.id, `Source URL is not https: ${s.url}`);
    if (LEAD_ONLY_DOMAINS.test(s.url)) push("source-not-official", "error", s.id, "Commercial index, encyclopedia or agency cited as a source");
    if (!(s.type in SOURCE_TIER)) push("source-not-official", "error", s.id, `Source type "${s.type}" is not an official tier`);
    if (isIsoDate(s.checked) && s.checked > asOf) push("source-check-in-future", "error", s.id, `Checked ${s.checked} is after the dataset date ${asOf}`);
    if (s.sourceUpdated && s.sourceUpdated < yearsBefore(asOf, OLD_DOCUMENT_YEARS))
      push("source-document-old", "warning", s.id, `The source's own date is ${s.sourceUpdated}, more than ${OLD_DOCUMENT_YEARS} years before ${asOf}; look for a current or consolidated version`);
    if (isIsoDate(s.checked) && asOf >= reviewDueOn(s, m)) push("evidence-review-due", "warning", s.id, `Checked ${s.checked}; re-verification was due ${reviewDueOn(s, m)}`);
    if (isIsoDate(s.checked) && asOf >= addDays(s.checked, m.freshnessDays * 2)) push("evidence-expired", "error", s.id, `Checked ${s.checked}; more than twice the ${m.freshnessDays}-day freshness window has passed`);
  }

  // ── Records ──
  const seenIds = new Map<string, number>();
  const pairs = new Map<string, AccessRule[]>();
  for (const r of records) {
    const id = ruleId(r);
    seenIds.set(id, (seenIds.get(id) ?? 0) + 1);
    pairs.set(pairKey(r), [...(pairs.get(pairKey(r)) ?? []), r]);
    const src = sourceMap.get(r.sourceId);
    if (!src) push("source-missing", "error", id, `Source ${r.sourceId} is not in the source register`);
    for (const extra of r.additionalSourceIds ?? []) if (!sourceMap.has(extra)) push("source-missing", "error", id, `Additional source ${extra} is not in the source register`);

    // Diplomatic or official-passport exemptions must never be published as ordinary-passport access.
    const text = `${r.evidence} ${r.conditions ?? ""}`;
    if (DIPLOMATIC.test(text) && !ORDINARY.test(text) && r.category !== "visa-required" && r.category !== "restricted")
      push("diplomatic-exemption-on-ordinary-record", "error", id, "Evidence or conditions refer to diplomatic, official or service passports, but the record grants ordinary-passport access");

    // Stay duration
    const fromEvidence = statedStayDays(r.evidence);
    const fromConditions = statedStayDays(r.conditions);
    const stated = [...new Set([...fromEvidence, ...fromConditions])];
    if (r.maxStayDays !== undefined && fromEvidence.length && !fromEvidence.includes(r.maxStayDays))
      push("stay-duration-contradiction", "error", id, `maxStayDays is ${r.maxStayDays} but the evidence states ${fromEvidence.join(" / ")} days`);
    else if (r.maxStayDays !== undefined && fromConditions.length && !fromConditions.includes(r.maxStayDays) && !fromEvidence.includes(r.maxStayDays))
      push("stay-duration-contradiction", "warning", id, `maxStayDays is ${r.maxStayDays} but the conditions mention ${fromConditions.join(" / ")} days; check that the other figure belongs to a different entry route`);
    if (r.maxStayDays === undefined && stated.length > 1 && STAY_EXPECTED.includes(r.category))
      push("stay-duration-contradiction", "warning", id, `Evidence states more than one stay period (${stated.join(" / ")} days) and no maxStayDays is set`);
    if (r.maxStayDays === undefined && STAY_EXPECTED.includes(r.category) && stated.length === 0)
      push("stay-duration-missing", "warning", id, `No stay period recorded for a ${r.category} record`);

    // Requirement claims in conditions must be backed by evidence or a cited source.
    if (r.conditions) {
      const support = [r.evidence, src?.title, src?.note, ...(r.additionalSourceIds ?? []).flatMap((x) => [sourceMap.get(x)?.title, sourceMap.get(x)?.note])].filter(Boolean).join(" ");
      for (const t of REQUIREMENT_TERMS)
        if (t.pattern.test(r.conditions) && !t.pattern.test(support))
          push("unsupported-requirement-claim", t.severity, id, `Conditions mention ${t.term}, but neither the evidence nor a cited source's title or note does`);
    }
  }
  for (const [id, n] of seenIds) if (n > 1) push("duplicate-record", "error", id, `${n} records share this passport, destination and source`);
  for (const [pair, rs] of pairs) {
    const live = rs.filter((r) => PUBLISHABLE_STATUSES.includes(r.verification) && inEffect(r, asOf) && !r.supersededBy);
    const overridden = new Set(live.flatMap((r) => r.overrides ?? []));
    const remaining = live.filter((r) => !overridden.has(ruleId(r)));
    if (remaining.length > 1 && new Set(remaining.map((r) => r.category)).size === 1)
      push("duplicate-pair", "warning", pair, `${remaining.length} live records state the same category; keep one primary record and cite the rest as additional sources`);
  }

  // ── Conflicts among records that could be published ──
  const candidates = records.filter((r) => PUBLISHABLE_STATUSES.includes(r.verification) && inEffect(r, asOf));
  for (const c of detectConflicts(candidates)) push("conflicting-classification", "error", c.pair, `Conflicting categories ${c.categories.join(" vs ")} (${c.ruleIds.join(", ")})`);

  return issues.sort((a, b) => (a.severity === b.severity ? a.code.localeCompare(b.code) || a.subject.localeCompare(b.subject) : a.severity === "error" ? -1 : 1));
}

/**
 * The set the site publishes must be exactly the gate's eligible set: nothing disputed, pending,
 * discovered, rejected, superseded, expired or in conflict may appear in it.
 */
export function auditPublishedSet(published: AccessRule[], records: AccessRule[], sources: Source[], asOf: string, m: MethodologyVersion = currentMethodology): QualityIssue[] {
  const decisions = new Map(publicationDecisions(records, sources, asOf, m).map((d) => [d.id, d]));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const issues: QualityIssue[] = [];
  for (const r of published) {
    const id = ruleId(r);
    const d = decisions.get(id);
    const status = effectiveStatus(r, sourceMap.get(r.sourceId), asOf, m);
    if (!d) issues.push({ code: "unpublishable-record-published", severity: "error", subject: id, message: "Published record is not in the dataset's records" });
    else if (!d.eligible) issues.push({ code: "unpublishable-record-published", severity: "error", subject: id, message: `Published despite: ${d.reasons.join(", ")}` });
    if (!PUBLISHABLE_STATUSES.includes(status)) issues.push({ code: "unpublishable-record-published", severity: "error", subject: id, message: `Published with status ${status}` });
  }
  return issues;
}

/**
 * Content pages: sentences that state a mandatory insurance or vaccination requirement.
 *
 * An insurance requirement is "supported" only when the page lists a source whose title is about
 * insurance and whose host is a government domain or a state portal we have opened and confirmed
 * (OFFICIAL_PORTAL_HOSTS). Insurer marketing pages, law-firm notes and trade associations do not count.
 */
const GOV_HOST = /(^|\.)(gov|go|gouv|govt|gob|gv)\.[a-z]{2,3}$|\.gov$|(^|\.)europa\.eu$/i;
const MANDATORY = /\b(must|mandatory|required|requires|need to)\b/i;
const HEALTH_OR_INSURANCE = /\b(insurance|yellow fever|vaccinat\w*)\b/i;

/** State-run portals on non-government domains, each confirmed by opening it (date in the comment). */
export const OFFICIAL_PORTAL_HOSTS: Record<string, string> = {
  // Opened 2026-10-15: headed "The United Republic of Tanzania, Mandatory Inbound Travel Insurance Portal",
  // run by the state-owned National Insurance Corporation. It states no effective date or exemptions.
  "inbound.nicinsurance.co.tz": "National Insurance Corporation of Tanzania (state-owned)",
};

export type PageSource = { title: string; url: string };
export type ContentClaim = { page: string; sentence: string; kind: "insurance" | "vaccination" };

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};
export const isOfficialHost = (url: string) => url.startsWith("https://") && (GOV_HOST.test(hostOf(url)) || hostOf(url) in OFFICIAL_PORTAL_HOSTS);

export function findRequirementClaims(page: string, body: string): ContentClaim[] {
  return body
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => HEALTH_OR_INSURANCE.test(s) && MANDATORY.test(s))
    .map((sentence) => ({ page, sentence: sentence.trim(), kind: /\binsurance\b/i.test(sentence) ? "insurance" : "vaccination" }));
}

/** Insurance claims on a page with no official, insurance-specific source. */
export function unsupportedInsuranceClaims(claims: ContentClaim[], pageSources: PageSource[]): ContentClaim[] {
  const supported = pageSources.some((s) => /insurance/i.test(s.title) && isOfficialHost(s.url));
  return supported ? [] : claims.filter((c) => c.kind === "insurance");
}
