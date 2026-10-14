import { describe, expect, it } from "vitest";
import { comparisonCoverage } from "../src/lib/passport/comparison-coverage";
import type { AccessRule } from "../src/lib/passport/types";

const rule = (passport: string, destination: string, category: AccessRule["category"]): AccessRule => ({
  passport, destination, category, evidence: "Test-only synthetic rule",
  sourceId: "test-only", verification: "verified", confidence: "high",
});

describe("passport comparison coverage", () => {
  it("keeps missing evidence unknown rather than inaccessible", () => {
    const result = comparisonCoverage("ZW", "ZA", "visa-free", [
      rule("ZW", "GB", "visa-free"), rule("ZA", "GB", "visa-required"),
      rule("ZW", "FR", "visa-free"),
    ]);
    expect(result.onlyA).toContain("GB");
    expect(result.unverified).toContain("FR");
    expect(result.neither).not.toContain("FR");
    expect(result.total).toBe(result.verifiedForBoth + result.unverified.length);
  });

  it("classifies verified access symmetrically and excludes domestic passports", () => {
    const result = comparisonCoverage("ZW", "ZA", "visa-free", [
      rule("ZW", "GB", "visa-free"), rule("ZA", "GB", "visa-free"),
      rule("ZW", "FR", "visa-required"), rule("ZA", "FR", "visa-free"),
      rule("ZW", "DE", "visa-required"), rule("ZA", "DE", "visa-required"),
    ]);
    expect(result.both).toContain("GB");
    expect(result.onlyB).toContain("FR");
    expect(result.neither).toContain("DE");
    expect(result.total).toBe(197);
    expect(result.both).not.toContain("ZW");
    expect(result.both).not.toContain("ZA");
  });

  it("rejects identical or unknown passports", () => {
    expect(() => comparisonCoverage("ZA", "ZA", "visa-free", [])).toThrow();
    expect(() => comparisonCoverage("ZZ", "ZA", "visa-free", [])).toThrow();
  });
});
