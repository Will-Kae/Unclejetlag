import type { CoverageReport } from "./coverage";

/**
 * Prioritise independent verification work without making claims about visa access.
 * A missing pair is an evidence gap, never a visa restriction.
 */
export type PassportReadiness = {
  code: string;
  verified: number;
  reviewDue: number;
  disputed: number;
  pending: number;
  unknown: number;
  universe: number;
  coveragePercent: number;
  remainingToThreshold: number;
  readyForScoring: boolean;
};

export function passportReadiness(
  report: Pick<CoverageReport, "passports" | "universe">,
  minimumCoverage = 0.95,
): PassportReadiness[] {
  if (!Number.isFinite(minimumCoverage) || minimumCoverage < 0 || minimumCoverage > 1) {
    throw new RangeError("minimumCoverage must be between 0 and 1");
  }
  const universe = report.universe.jurisdictions - 1;
  if (!Number.isInteger(universe) || universe < 1) {
    throw new RangeError("at least two jurisdictions are required");
  }
  const required = Math.ceil(universe * minimumCoverage);
  return report.passports.map((p) => {
    const verified = p.verified + p["review-due"];
    const total = verified + p.disputed + p.pending + p.unknown;
    if (total !== universe) throw new Error(`Invalid coverage tally for ${p.code}: ${total} != ${universe}`);
    return {
      code: p.code,
      verified: p.verified,
      reviewDue: p["review-due"],
      disputed: p.disputed,
      pending: p.pending,
      unknown: p.unknown,
      universe,
      coveragePercent: Math.round((verified / universe) * 10000) / 100,
      remainingToThreshold: Math.max(0, required - verified),
      readyForScoring: verified >= required && p.disputed === 0,
    };
  }).sort((a, b) => a.remainingToThreshold - b.remainingToThreshold || a.code.localeCompare(b.code));
}
