/**
 * Scoring and ranking. Pure functions over rule arrays, so they are easy to test and can run against
 * a database later without change.
 *
 * Key rules:
 * - Each destination counts at most once per passport (the most favourable verified rule wins, and
 *   only if it applies without extra conditions; conditional routes never upgrade a category).
 * - A passport's own country is excluded from its universe.
 * - Unverified destinations are "unknown": they never count as zero. Scores are null until coverage
 *   reaches the methodology threshold.
 * - Ties share a rank (standard competition ranking: 1, 1, 3).
 */
import { jurisdictions, type Region } from "./jurisdictions";
import { currentMethodology, type MethodologyVersion } from "./methodology";
import { categoryMeta, type AccessCategory, type AccessRule } from "./types";
import { rules as allRules } from "./data";

/** Lower is better. Used only to pick one rule when several verified rules exist for a pair. */
const ORDER: AccessCategory[] = ["visa-free", "visa-on-arrival", "eta", "evisa", "conditional", "visa-required", "restricted", "unknown"];

export function bestRule(rs: AccessRule[]): AccessRule | undefined {
  // A restriction overrides any other rule for the same pair.
  const restricted = rs.find((r) => r.category === "restricted");
  if (restricted) return restricted;
  return [...rs].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))[0];
}

export type DestinationAccess = { destination: string; category: AccessCategory; rule?: AccessRule };

export function destinationUniverse(passport: string): string[] {
  return jurisdictions.map((j) => j.code).filter((c) => c !== passport);
}

export function accessFor(passport: string, rules: AccessRule[] = allRules): DestinationAccess[] {
  const byDest = new Map<string, AccessRule[]>();
  for (const r of rules) if (r.passport === passport) byDest.set(r.destination, [...(byDest.get(r.destination) ?? []), r]);
  return destinationUniverse(passport).map((d) => {
    const rule = bestRule(byDest.get(d) ?? []);
    return { destination: d, category: rule?.category ?? "unknown", rule };
  });
}

export type Counts = Record<AccessCategory, number>;
export const emptyCounts = (): Counts => ({ "visa-free": 0, "visa-on-arrival": 0, eta: 0, evisa: 0, "visa-required": 0, conditional: 0, restricted: 0, unknown: 0 });

export function countCategories(access: DestinationAccess[]): Counts {
  const c = emptyCounts();
  for (const a of access) c[a.category]++;
  return c;
}

export type PassportScore = {
  passport: string;
  methodology: string;
  universe: number;
  verified: number;
  coverage: number;
  counts: Counts;
  /** Destinations reachable without a visa obtained in advance, among verified destinations. */
  noAdvanceVisaVerified: number;
  /** Null until coverage reaches the threshold. */
  mobilityScore: number | null;
  powerScore: number | null;
  scored: boolean;
};

export function scorePassport(passport: string, rules: AccessRule[] = allRules, m: MethodologyVersion = currentMethodology): PassportScore {
  const access = accessFor(passport, rules);
  const counts = countCategories(access);
  const universe = access.length;
  const verified = universe - counts.unknown;
  const coverage = universe ? verified / universe : 0;
  const scored = coverage >= m.passportCoverageThreshold;
  const mobility = access.filter((a) => m.mobilityCategories.includes(a.category)).length;
  const noAdvance = access.filter((a) => categoryMeta[a.category].noAdvanceVisa).length;

  let power: number | null = null;
  if (scored) {
    const w = m.powerWeights;
    const share = (n: number) => (verified ? n / verified : 0);
    // Entry convenience: share of verified destinations reachable with no advance visa AND a stated stay of at least 30 days.
    const convenient = access.filter((a) => categoryMeta[a.category].noAdvanceVisa && (a.rule?.maxStayDays ?? 0) >= 30).length;
    // Regional: share of the passport's own region reachable with no advance visa.
    const region = jurisdictions.find((j) => j.code === passport)?.region as Region | undefined;
    const regional = access.filter((a) => a.category !== "unknown" && jurisdictions.find((j) => j.code === a.destination)?.region === region);
    const regionalShare = regional.length ? regional.filter((a) => categoryMeta[a.category].noAdvanceVisa).length / regional.length : 0;
    const raw = w.visaFree * share(counts["visa-free"]) + w.visaOnArrival * share(counts["visa-on-arrival"]) + w.eta * share(counts.eta) + w.entryConvenience * share(convenient) + w.regional * regionalShare;
    power = Math.round(raw * 10) / 10;
  }

  return { passport, methodology: m.id, universe, verified, coverage, counts, noAdvanceVisaVerified: noAdvance, mobilityScore: scored ? mobility : null, powerScore: power, scored };
}

/** Standard competition ranking ("1224"). Equal values share a rank; order within a tie is not a ranking. */
export function competitionRank<T>(items: T[], value: (t: T) => number): { item: T; rank: number }[] {
  const sorted = [...items].sort((a, b) => value(b) - value(a));
  let lastValue: number | null = null;
  let lastRank = 0;
  return sorted.map((item, i) => {
    const v = value(item);
    if (v !== lastValue) { lastRank = i + 1; lastValue = v; }
    return { item, rank: lastRank };
  });
}

export type RankingStatus = { published: boolean; scoredPassports: number; totalPassports: number; required: number };

export function rankingStatus(rules: AccessRule[] = allRules, m: MethodologyVersion = currentMethodology): RankingStatus {
  const total = jurisdictions.length;
  const scored = jurisdictions.filter((j) => scorePassport(j.code, rules, m).scored).length;
  const required = Math.ceil(total * m.rankingPublicationThreshold);
  return { published: m.status === "published" && scored >= required, scoredPassports: scored, totalPassports: total, required };
}

export type ComparisonFilter = "visa-free" | "no-advance-visa" | "all-verified";

export function isAccessible(category: AccessCategory, filter: ComparisonFilter): boolean {
  if (filter === "visa-free") return category === "visa-free";
  if (filter === "no-advance-visa") return categoryMeta[category].noAdvanceVisa;
  return category !== "unknown" && category !== "visa-required" && category !== "restricted";
}

export function comparePassports(a: string, b: string, filter: ComparisonFilter, rules: AccessRule[] = allRules) {
  const A = new Map(accessFor(a, rules).map((x) => [x.destination, x]));
  const B = new Map(accessFor(b, rules).map((x) => [x.destination, x]));
  const both: string[] = [], onlyA: string[] = [], onlyB: string[] = [], unverified: string[] = [];
  for (const d of jurisdictions.map((j) => j.code)) {
    if (d === a || d === b) continue;
    const ca = A.get(d)!.category, cb = B.get(d)!.category;
    if (ca === "unknown" || cb === "unknown") { unverified.push(d); continue; }
    const ia = isAccessible(ca, filter), ib = isAccessible(cb, filter);
    if (ia && ib) both.push(d); else if (ia) onlyA.push(d); else if (ib) onlyB.push(d);
  }
  return { both, onlyA, onlyB, unverified, A, B };
}

export function lastVerified(rules: AccessRule[], passport: string, sourceChecked: (id: string) => string | undefined): string | undefined {
  return rules.filter((r) => r.passport === passport).map((r) => sourceChecked(r.sourceId)).filter(Boolean).sort().at(-1);
}
