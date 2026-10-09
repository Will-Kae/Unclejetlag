import { describe, expect, it } from "vitest";
import { checkBic, parseBic, looksLikeBic } from "../src/lib/banking/bic";

describe("BIC structure", () => {
  it("accepts a valid 8-character BIC and decodes it", () => {
    const r = checkBic("CHASUS33");
    expect(r.formatValid).toBe(true);
    expect(r.parts).toMatchObject({ institution: "CHAS", country: "US", countryName: "United States", location: "33", branch: null });
  });
  it("accepts a valid 11-character BIC with a branch", () => {
    const r = checkBic("TDOMCATTTOR");
    expect(r.formatValid).toBe(true);
    expect(r.parts?.branch).toBe("TOR");
  });
  it("normalises spaces and lowercase", () => {
    const r = checkBic(" absa za jj ");
    expect(r.normalized).toBe("ABSAZAJJ");
    expect(r.formatValid).toBe(true);
    expect(r.issues.some((i) => i.level === "info")).toBe(true);
  });
  it("rejects wrong lengths", () => {
    for (const c of ["ABSAZAJ", "ABSAZAJJX", "ABSAZAJJXXXX", ""]) expect(checkBic(c).status).toBe("invalid");
  });
  it("rejects invalid characters", () => {
    expect(checkBic("ABSA-ZA_JJ").status).toBe("invalid");
    expect(checkBic("ABSÅZAJJ").status).toBe("invalid");
  });
  it("rejects a country code that isn't ISO 3166", () => {
    const r = checkBic("ABCDQQ22");
    expect(r.status).toBe("invalid");
    expect(r.issues.find((i) => i.level === "error")?.message).toMatch(/isn't an ISO country code/);
  });
  it("rejects digits in the country position", () => {
    expect(checkBic("ABCD1A22").status).toBe("invalid");
  });
  it("accepts XK (Kosovo)", () => {
    expect(checkBic("ABCDXKPR").formatValid).toBe(true);
  });
  it("rejects reserved branch codes starting with X other than XXX", () => {
    expect(checkBic("ABSAZAJJXAB").status).toBe("invalid");
  });
  it("flags test BICs and passive participants", () => {
    expect(parseBic("ABCDGB20").issues.some((i) => i.level === "warning" && /test/.test(i.message))).toBe(true);
    expect(parseBic("ABCDGB21").issues.some((i) => /passive participant/.test(i.message))).toBe(true);
  });
  it("never claims a format-valid unknown code is verified", () => {
    const r = checkBic("ZZZZGB2L");
    expect(r.formatValid).toBe(true);
    expect(r.status).toBe("unverified");
    expect(r.match).toBeNull();
  });
  it("routes BIC-like input", () => {
    expect(looksLikeBic("nedszajj")).toBe(true);
    expect(looksLikeBic("Standard Bank")).toBe(false);
  });
});

describe("BIC directory matching", () => {
  it("matches an 8-character head-office code", () => {
    const r = checkBic("ABSAZAJJ");
    expect(r.status).toBe("directory-match");
    expect(r.match?.institution.name).toBe("Absa Bank");
    expect(r.match?.level).toBe("exact");
  });
  it("treats XXX as the head office", () => {
    expect(checkBic("ABSAZAJJXXX").match?.level).toBe("exact");
    expect(checkBic("SBICZWHX").match?.institution.slug).toBe("stanbic-bank-zimbabwe");
  });
  it("reports an institution-level match for an unknown branch", () => {
    const r = checkBic("ABSAZAJJ123");
    expect(r.status).toBe("directory-match");
    expect(r.match?.level).toBe("institution");
    expect(r.issues.some((i) => /not branch 123/.test(i.message))).toBe(true);
  });
  it("matches the right code when a bank has several", () => {
    expect(checkBic("BOFAUS6S").match?.identifier.scope).toMatch(/foreign currency/);
    expect(checkBic("BOFAUS3N").match?.identifier.scope).toMatch(/US dollars/);
  });
});
