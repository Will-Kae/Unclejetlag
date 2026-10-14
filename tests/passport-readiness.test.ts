import { describe, expect, it } from "vitest";
import { passportReadiness } from "../src/lib/passport/readiness";
import type { CoverageReport } from "../src/lib/passport/coverage";

const report = {
  universe: { jurisdictions: 5, pairs: 20, note: "" },
  passports: [
    { code: "ZW", verified: 2, "review-due": 0, disputed: 0, pending: 1, unknown: 1, coverage: 0.5, scored: false },
    { code: "ZA", verified: 3, "review-due": 1, disputed: 0, pending: 0, unknown: 0, coverage: 1, scored: true },
    { code: "AU", verified: 3, "review-due": 0, disputed: 1, pending: 0, unknown: 0, coverage: 0.75, scored: false },
  ],
} satisfies Pick<CoverageReport, "universe" | "passports">;

describe("passportReadiness", () => {
  it("treats unknown and pending as evidence gaps, not restrictions", () => {
    const result = passportReadiness(report);
    expect(result.find((p) => p.code === "ZW")).toMatchObject({
      verified: 2, pending: 1, unknown: 1, remainingToThreshold: 2, readyForScoring: false,
    });
  });
  it("counts review-due evidence separately while preserving its coverage contribution", () => {
    expect(passportReadiness(report)[0]).toMatchObject({
      code: "ZA", verified: 3, reviewDue: 1, coveragePercent: 100, readyForScoring: true,
    });
  });
  it("does not call disputed evidence ready", () => {
    expect(passportReadiness(report, 0.75).find((p) => p.code === "AU")?.readyForScoring).toBe(false);
  });
  it("rejects invalid thresholds and inconsistent data", () => {
    expect(() => passportReadiness(report, 1.2)).toThrow(RangeError);
    expect(() => passportReadiness({ ...report, passports: [{ ...report.passports[0], unknown: 0 }] })).toThrow(/Invalid coverage tally/);
  });
});
