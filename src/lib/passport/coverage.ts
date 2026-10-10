/**
 * Machine-readable coverage report (Phase 2A). Distinguishes, for every passport–destination pair:
 * - verified:   published, evidence within the freshness window
 * - review-due: published, but the evidence check is older than the freshness window (flagged)
 * - disputed:   official evidence conflicts; held out of publication until reviewed
 * - pending:    a record exists (discovered / pending verification) but evidence is not verified
 * - unknown:    no usable record. Never counted as a restriction.
 * "visa-required" and "restricted" are verified restrictions and appear only as categories of
 * verified or review-due pairs.
 */
import { scorePassport, rankingStatus } from "./engine";
import { jurisdictions } from "./jurisdictions";
import { currentMethodology, type MethodologyVersion } from "./methodology";
import { reviewDueOn as dueOn, detectConflicts, inEffect, pairKey, publicationDecisions, PUBLISHABLE_STATUSES, type PublicationDecision } from "./verification";
import { SOURCE_TIER, type AccessCategory, type AccessRule, type Source } from "./types";

export type PairStatus = "verified" | "review-due" | "disputed" | "pending" | "unknown";
export const PAIR_STATUSES: PairStatus[] = ["verified", "review-due", "disputed", "pending", "unknown"];

type Tally = Record<PairStatus, number>;
const tally = (): Tally => ({ verified: 0, "review-due": 0, disputed: 0, pending: 0, unknown: 0 });

export type CoverageReport = {
  dataset: { version: string; asOf: string; methodology: string };
  universe: { jurisdictions: number; pairs: number; note: string };
  totals: Tally & { published: number; records: number };
  coverageShare: number;
  claims: { completeWorldwideCoverage: boolean; statement: string };
  ranking: { published: boolean; scoredPassports: number; required: number; totalPassports: number };
  evidenceBasis: Record<string, number>;
  confidence: Record<string, number>;
  conflicts: { pair: string; ruleIds: string[]; categories: string[] }[];
  passports: ({ code: string; coverage: number; scored: boolean } & Tally)[];
  destinations: ({ code: string } & Tally)[];
  pairs: { passport: string; destination: string; status: Exclude<PairStatus, "unknown">; category: AccessCategory | null; ruleIds: string[]; sourceIds: string[]; reviewDueOn: string | null }[];
  sources: { id: string; tier: number; authorityJurisdiction: string | null; rules: number; publishedRules: number; checked: string; sourceUpdated: string | null; reviewDueOn: string }[];
  nextReviewDue: string | null;
};

export function pairStatuses(records: AccessRule[], decisions: PublicationDecision[]) {
  const byPair = new Map<string, { rules: AccessRule[]; decisions: PublicationDecision[] }>();
  records.forEach((r, i) => {
    const k = pairKey(r);
    const e = byPair.get(k) ?? { rules: [], decisions: [] };
    e.rules.push(r);
    e.decisions.push(decisions[i]);
    byPair.set(k, e);
  });
  const out = new Map<string, { status: PairStatus; rules: AccessRule[]; published: AccessRule[] }>();
  for (const [k, { rules, decisions: ds }] of byPair) {
    const published = rules.filter((_, i) => ds[i].eligible);
    let status: PairStatus;
    const eligible = ds.filter((d) => d.eligible);
    if (eligible.length) status = eligible.every((d) => d.reviewDue) ? "review-due" : "verified";
    else if (ds.some((d) => d.reasons.includes("unresolved-conflict") || d.status === "disputed")) status = "disputed";
    else if (ds.some((d) => d.status === "discovered" || d.status === "pending-verification")) status = "pending";
    else status = "unknown";
    out.set(k, { status, rules, published });
  }
  return out;
}

export function buildCoverageReport(records: AccessRule[], sources: Source[], dataset: { version: string; asOf: string; methodology: string }, m: MethodologyVersion = currentMethodology): CoverageReport {
  const decisions = publicationDecisions(records, sources, dataset.asOf, m);
  const published = records.filter((_, i) => decisions[i].eligible);
  const statuses = pairStatuses(records, decisions);
  const codes = jurisdictions.map((j) => j.code);
  const universePairs = codes.length * (codes.length - 1);

  const totals = { ...tally(), published: published.length, records: records.length };
  const pTally = new Map(codes.map((c) => [c, tally()]));
  const dTally = new Map(codes.map((c) => [c, tally()]));
  for (const p of codes) for (const d of codes) {
    if (p === d) continue;
    const s = statuses.get(`${p}>${d}`)?.status ?? "unknown";
    totals[s]++;
    pTally.get(p)![s]++;
    dTally.get(d)![s]++;
  }

  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const pairs: CoverageReport["pairs"] = [...statuses.entries()]
    .filter(([, v]) => v.status !== "unknown")
    .map(([k, v]) => {
      const [passport, destination] = k.split(">");
      const best = v.published[0];
      const src = best ? sourceMap.get(best.sourceId) : undefined;
      return {
        passport,
        destination,
        status: v.status as Exclude<PairStatus, "unknown">,
        category: v.published.length === 1 || new Set(v.published.map((r) => r.category)).size === 1 ? (best?.category ?? null) : null,
        ruleIds: v.rules.map((r) => `${r.passport}-${r.destination}-${r.sourceId}`).sort(),
        sourceIds: [...new Set(v.rules.map((r) => r.sourceId))].sort(),
        reviewDueOn: src ? dueOn(src, m) : null,
      };
    })
    .sort((a, b) => (a.passport + a.destination).localeCompare(b.passport + b.destination));

  const count = (f: (r: AccessRule) => string) => published.reduce<Record<string, number>>((acc, r) => ({ ...acc, [f(r)]: (acc[f(r)] ?? 0) + 1 }), {});
  const scored = codes.map((c) => scorePassport(c, published, m));
  const rank = rankingStatus(published, m);
  const share = (totals.verified + totals["review-due"]) / universePairs;
  const cands = records.filter((r) => PUBLISHABLE_STATUSES.includes(r.verification) && inEffect(r, dataset.asOf));

  return {
    dataset: { ...dataset },
    universe: { jurisdictions: codes.length, pairs: universePairs, note: "Every ordered passport–destination pair among the 199 jurisdictions, excluding a passport's own jurisdiction." },
    totals,
    coverageShare: Math.round(share * 1e6) / 1e6,
    claims: {
      completeWorldwideCoverage: totals.unknown === 0 && totals.pending === 0 && totals.disputed === 0,
      statement: `${totals.verified + totals["review-due"]} of ${universePairs} passport–destination pairs are verified (${(share * 100).toFixed(2)}%). The rest are unknown, not restricted.`,
    },
    ranking: { published: rank.published, scoredPassports: rank.scoredPassports, required: rank.required, totalPassports: rank.totalPassports },
    evidenceBasis: count((r) => r.evidenceBasis ?? "listed"),
    confidence: count((r) => r.confidence),
    conflicts: detectConflicts(cands),
    passports: codes.map((c, i) => ({ code: c, ...pTally.get(c)!, coverage: Math.round(scored[i].coverage * 1e6) / 1e6, scored: scored[i].scored })),
    destinations: codes.map((c) => ({ code: c, ...dTally.get(c)! })),
    pairs,
    sources: sources.map((s) => ({
      id: s.id,
      tier: SOURCE_TIER[s.type],
      authorityJurisdiction: s.authorityJurisdiction ?? null,
      rules: records.filter((r) => r.sourceId === s.id).length,
      publishedRules: published.filter((r) => r.sourceId === s.id).length,
      checked: s.checked,
      sourceUpdated: s.sourceUpdated ?? null,
      reviewDueOn: dueOn(s, m),
    })),
    nextReviewDue: sources.length ? sources.map((s) => dueOn(s, m)).sort()[0] : null,
  };
}
