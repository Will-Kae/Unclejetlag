/**
 * Verification workflow and publication safeguards (Phase 2A).
 *
 * Lifecycle:
 *   discovered → pending-verification → verified → review-due → superseded | rejected
 *   with disputed for conflicting evidence.
 *
 * Only rules whose effective status is verified or review-due, whose sources are official (tiers 1–3),
 * that are in effect at the evaluation date and that are not part of an unresolved conflict are
 * published. Review-due rules stay published but are flagged, because methodology v0.1 defines
 * freshness as a re-verification flag, not an exclusion (see methodology.ts, freshnessDays).
 *
 * Pure functions only: no network, no clock. Callers pass the evaluation date (`asOf`), so results are
 * reproducible. This module must not import data.ts (data.ts imports it).
 */
import { isSpecialEntryPair } from "./jurisdictions";
import { currentMethodology, type MethodologyVersion } from "./methodology";
import { SOURCE_TIER, type AccessRule, type RuleRevision, type Source, type VerificationStatus } from "./types";

export const VERIFICATION_STATUSES: VerificationStatus[] = ["discovered", "pending-verification", "verified", "review-due", "disputed", "superseded", "rejected"];

/** Allowed stored-status transitions. superseded and rejected are terminal. */
export const TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  discovered: ["pending-verification", "rejected"],
  "pending-verification": ["verified", "disputed", "rejected"],
  verified: ["review-due", "disputed", "superseded"],
  "review-due": ["verified", "disputed", "superseded", "rejected"],
  disputed: ["verified", "superseded", "rejected"],
  superseded: [],
  rejected: [],
};

export const canTransition = (from: VerificationStatus, to: VerificationStatus) => TRANSITIONS[from].includes(to);

/** Statuses that may appear in published scores, profiles and rankings. */
export const PUBLISHABLE_STATUSES: VerificationStatus[] = ["verified", "review-due"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(s: string | undefined): s is string {
  if (!s || !ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Stable identifier for a rule record. Unique while each source states one category per pair. */
export const ruleId = (r: Pick<AccessRule, "passport" | "destination" | "sourceId">) => `${r.passport}-${r.destination}-${r.sourceId}`;
export const pairKey = (r: Pick<AccessRule, "passport" | "destination">) => `${r.passport}>${r.destination}`;

/** First day a source's evidence is due for re-verification. */
export const reviewDueOn = (source: Pick<Source, "checked">, m: MethodologyVersion = currentMethodology) => addDays(source.checked, m.freshnessDays);

/** Stored status, upgraded to review-due when the source check is older than the freshness window. */
export function effectiveStatus(rule: AccessRule, source: Source | undefined, asOf: string, m: MethodologyVersion = currentMethodology): VerificationStatus {
  if (rule.verification === "verified" && source && asOf >= reviewDueOn(source, m)) return "review-due";
  return rule.verification;
}

export function inEffect(rule: AccessRule, asOf: string): boolean {
  if (rule.effectiveFrom && rule.effectiveFrom > asOf) return false;
  if (rule.effectiveTo && rule.effectiveTo < asOf) return false;
  return true;
}

export type Conflict = { pair: string; ruleIds: string[]; categories: string[] };

/**
 * Two or more candidate rules for the same pair that state different categories, where neither declares
 * that it overrides the other. Conflicts are held for review: we never pick the favourable answer.
 * Agreement between sources (same category) is corroboration, not a conflict.
 */
export function detectConflicts(rules: AccessRule[]): Conflict[] {
  const byPair = new Map<string, AccessRule[]>();
  for (const r of rules) byPair.set(pairKey(r), [...(byPair.get(pairKey(r)) ?? []), r]);
  const out: Conflict[] = [];
  for (const [pair, rs] of byPair) {
    if (new Set(rs.map((r) => r.category)).size < 2) continue;
    const overridden = new Set(rs.flatMap((r) => r.overrides ?? []));
    const remaining = rs.filter((r) => !overridden.has(ruleId(r)));
    if (new Set(remaining.map((r) => r.category)).size < 2) continue;
    out.push({ pair, ruleIds: remaining.map(ruleId).sort(), categories: [...new Set(remaining.map((r) => r.category))].sort() });
  }
  return out.sort((a, b) => a.pair.localeCompare(b.pair));
}

export type PublicationReason =
  | "status-not-publishable"
  | "source-missing"
  | "supporting-source-missing"
  | "not-yet-in-effect-or-expired"
  | "unresolved-conflict"
  | "overridden"
  | "evidence-missing"
  | "special-entry-pair-without-conditions";

export type PublicationDecision = { id: string; eligible: boolean; status: VerificationStatus; reasons: PublicationReason[]; reviewDue: boolean };

/** Candidates for conflict checks: records whose stored status could be published. */
const candidates = (records: AccessRule[], asOf: string) => records.filter((r) => PUBLISHABLE_STATUSES.includes(r.verification) && inEffect(r, asOf));

export function publicationDecisions(records: AccessRule[], sources: Source[], asOf: string, m: MethodologyVersion = currentMethodology): PublicationDecision[] {
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const cands = candidates(records, asOf);
  const conflicted = new Set(detectConflicts(cands).flatMap((c) => c.ruleIds));
  const overridden = new Set(cands.flatMap((r) => r.overrides ?? []));
  return records.map((r) => {
    const source = sourceMap.get(r.sourceId);
    const status = effectiveStatus(r, source, asOf, m);
    const reasons: PublicationReason[] = [];
    const id = ruleId(r);
    if (!PUBLISHABLE_STATUSES.includes(status)) reasons.push("status-not-publishable");
    if (!source || !(source.type in SOURCE_TIER)) reasons.push("source-missing");
    if ((r.additionalSourceIds ?? []).some((s) => !sourceMap.has(s))) reasons.push("supporting-source-missing");
    if (!inEffect(r, asOf)) reasons.push("not-yet-in-effect-or-expired");
    if (conflicted.has(id)) reasons.push("unresolved-conflict");
    if (overridden.has(id)) reasons.push("overridden");
    if (!r.evidence || r.evidence.trim().length < 6) reasons.push("evidence-missing");
    if (isSpecialEntryPair(r.passport, r.destination) && !r.conditions) reasons.push("special-entry-pair-without-conditions");
    return { id, eligible: reasons.length === 0, status, reasons, reviewDue: status === "review-due" };
  });
}

/**
 * The publication gate. Returns the eligible records themselves (same objects, same order), so the
 * scoring engine sees exactly what it saw before Phase 2A when every record is eligible.
 * Overridden rules are dropped here; the overriding rule carries the pair.
 */
export function publishableRules(records: AccessRule[], sources: Source[], asOf: string, m: MethodologyVersion = currentMethodology): AccessRule[] {
  const decisions = publicationDecisions(records, sources, asOf, m);
  return records.filter((_, i) => decisions[i].eligible);
}

export class TransitionError extends Error {}

export type TransitionContext = { date: string; process: string; ref: string; source?: Source; note?: string; supersededBy?: string };

/**
 * Apply a review decision to a rule record. Returns the updated record and the revision to append to
 * its history. Throws when the transition is not allowed or its evidence requirements are not met.
 */
export function transition(rule: AccessRule, to: VerificationStatus, ctx: TransitionContext, previousRevision = 0): { rule: AccessRule; revision: RuleRevision } {
  if (!canTransition(rule.verification, to)) throw new TransitionError(`${rule.verification} → ${to} is not allowed`);
  if (!isIsoDate(ctx.date)) throw new TransitionError("transition date must be an ISO date (YYYY-MM-DD)");
  if (!ctx.process || !ctx.ref) throw new TransitionError("a verification process id and a reference are required");
  if (to === "verified") {
    if (!ctx.source) throw new TransitionError("verification needs an official source");
    if (ctx.source.id !== rule.sourceId) throw new TransitionError("source does not match the rule's sourceId");
    if (!(ctx.source.type in SOURCE_TIER)) throw new TransitionError("source is not an official (tier 1–3) source");
    if (!isIsoDate(ctx.source.checked) || ctx.source.checked > ctx.date) throw new TransitionError("source check date must be a real date on or before the verification date");
    if (!rule.evidence || rule.evidence.trim().length < 6) throw new TransitionError("evidence from the source is required");
  }
  if (to === "superseded" && !ctx.supersededBy) throw new TransitionError("superseded needs the id of the replacing rule");
  if ((to === "rejected" || to === "disputed") && !ctx.note) throw new TransitionError(`${to} needs a note explaining why`);
  const next: AccessRule = { ...rule, verification: to, ...(to === "superseded" ? { supersededBy: ctx.supersededBy } : {}) };
  const action: RuleRevision["action"] = to === "verified" && (rule.verification === "review-due" || rule.verification === "disputed") ? "re-verified" : "status-changed";
  return { rule: next, revision: { revision: previousRevision + 1, date: ctx.date, action, status: to, process: ctx.process, ref: ctx.ref, ...(ctx.note ? { note: ctx.note } : {}) } };
}
