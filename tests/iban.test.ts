import { describe, expect, it } from "vitest";
import { checkIban, mod97Valid, normalizeIban, formatIban, ibanCountryUsage, looksLikeIban } from "../src/lib/banking/iban";

const ok = (r: ReturnType<typeof checkIban>, label: string) => r.checks.find((c) => c.label === label)?.ok;

describe("IBAN validation", () => {
  it("validates the documented UK example and extracts parts", () => {
    const r = checkIban("GB82 WEST 1234 5698 7654 32");
    expect(r.valid).toBe(true);
    expect(r.country).toBe("GB");
    expect(r.countryName).toBe("United Kingdom");
    expect(r.bankIdentifier).toBe("WEST");
    expect(r.branchIdentifier).toBe("123456");
    expect(r.formatted).toBe("GB82 WEST 1234 5698 7654 32");
  });
  it("validates other documented examples", () => {
    for (const i of ["DE89370400440532013000", "CH9300762011623852957", "FR1420041010050500013M02606", "AE070331234567890123456"]) {
      expect(checkIban(i).valid, i).toBe(true);
    }
  });
  it("detects a wrong checksum", () => {
    const r = checkIban("GB83WEST12345698765432");
    expect(r.valid).toBe(false);
    expect(ok(r, "Checksum (MOD-97)")).toBe(false);
    expect(ok(r, "Length")).toBe(true);
  });
  it("detects swapped digits", () => {
    expect(checkIban("GB82WEST12345698765423").valid).toBe(false);
  });
  it("detects the wrong length for the country", () => {
    const r = checkIban("GB82WEST1234569876543");
    expect(ok(r, "Length")).toBe(false);
    expect(r.checks.find((c) => c.label === "Length")?.detail).toMatch(/22 characters/);
  });
  it("rejects invalid characters", () => {
    expect(ok(checkIban("GB82WEST1234569876543!"), "Characters")).toBe(false);
  });
  it("explains countries that don't use IBANs", () => {
    const r = checkIban("ZA12345678901234");
    expect(r.valid).toBe(false);
    expect(r.checks.find((c) => c.label === "Country")?.detail).toMatch(/doesn't use IBANs/);
  });
  it("rejects unknown country codes", () => {
    expect(checkIban("QQ82WEST12345698765432").checks.find((c) => c.label === "Country")?.ok).toBe(false);
  });
  it("normalises whitespace, dashes and case", () => {
    expect(normalizeIban(" gb82-west 1234 5698 7654 32 ")).toBe("GB82WEST12345698765432");
    expect(formatIban("GB82WEST12345698765432")).toBe("GB82 WEST 1234 5698 7654 32");
  });
  it("computes MOD-97 independently", () => {
    expect(mod97Valid("GB82WEST12345698765432")).toBe(true);
    expect(mod97Valid("GB00WEST12345698765432")).toBe(false);
  });
  it("reports country usage from registry data", () => {
    expect(ibanCountryUsage("GB")).toEqual({ usesIban: true, inRegistry: true, length: 22 });
    expect(ibanCountryUsage("ZA").usesIban).toBe(false);
    expect(ibanCountryUsage("US").usesIban).toBe(false);
  });
  it("routes IBAN-like input", () => {
    expect(looksLikeIban("GB82 WEST 1234 5698 7654 32")).toBe(true);
    expect(looksLikeIban("ABSAZAJJ")).toBe(false);
  });
});
