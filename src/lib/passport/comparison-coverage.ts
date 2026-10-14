import { accessFor, isAccessible, type ComparisonFilter } from "./engine";
import { jurisdictions } from "./jurisdictions";
import type { AccessRule } from "./types";

/**
 * Evidence-aware passport comparison summary.
 *
 * The denominator excludes the two selected passports (each is a domestic
 * destination for one traveller), and an unknown rule on either side prevents
 * that destination from being classified as shared or exclusive access.
 * This intentionally does not extrapolate from partial coverage.
 */
export function comparisonCoverage(
  a: string,
  b: string,
  filter: ComparisonFilter,
  rules?: AccessRule[],
) {
  if (a === b) throw new Error("Choose two different passports.");
  const codes = new Set(jurisdictions.map((j) => j.code));
  if (!codes.has(a) || !codes.has(b)) throw new Error("Unknown passport code.");

  const left = new Map(accessFor(a, rules).map((x) => [x.destination, x.category]));
  const right = new Map(accessFor(b, rules).map((x) => [x.destination, x.category]));
  const both: string[] = [];
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  const neither: string[] = [];
  const unverified: string[] = [];

  for (const code of codes) {
    if (code === a || code === b) continue;
    const ca = left.get(code) ?? "unknown";
    const cb = right.get(code) ?? "unknown";
    if (ca === "unknown" || cb === "unknown") {
      unverified.push(code);
      continue;
    }
    const yesA = isAccessible(ca, filter);
    const yesB = isAccessible(cb, filter);
    if (yesA && yesB) both.push(code);
    else if (yesA) onlyA.push(code);
    else if (yesB) onlyB.push(code);
    else neither.push(code);
  }

  const total = codes.size - 2;
  const verifiedForBoth = total - unverified.length;
  return {
    a, b, filter, total, verifiedForBoth, unverified,
    coverage: total ? verifiedForBoth / total : 0,
    both, onlyA, onlyB, neither,
    /** A global winner cannot be inferred from this partial comparison. */
    comparableOnly: true as const,
  };
}
