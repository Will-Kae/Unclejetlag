import { describe, expect, it } from "vitest";
import { institutions, searchInstitutions, findByBic, isDatedSource } from "../src/lib/banking/directory";
import { parseBic } from "../src/lib/banking/bic";
import { countryGuides } from "../src/lib/banking/countries";
import { ISO_ALPHA2 } from "../src/lib/banking/iso-countries";

describe("directory data quality", () => {
  it("has the full ISO list", () => {
    expect(ISO_ALPHA2.size).toBe(250);
  });
  it("every identifier is a structurally valid BIC in its institution's country", () => {
    for (const inst of institutions) for (const id of inst.identifiers) {
      const p = parseBic(id.value);
      expect(p.parts, `${inst.name} ${id.value}`).not.toBeNull();
      expect(p.parts?.country, `${inst.name} ${id.value}`).toBe(inst.country);
    }
  });
  it("every identifier has provenance", () => {
    for (const inst of institutions) for (const id of inst.identifiers) {
      expect(id.source.url, inst.name).toMatch(/^https:\/\//);
      expect(id.source.checked, inst.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(id.source.title.length, inst.name).toBeGreaterThan(3);
      expect(id.source.url, inst.name).not.toMatch(/wise\.com|theswiftcodes|bank\.codes|xe\.com|iban\.com/);
    }
  });
  it("has no duplicate ids, slugs per country or identifier values", () => {
    const ids = institutions.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const slugs = institutions.map((i) => `${i.country}/${i.slug}`);
    expect(new Set(slugs).size).toBe(slugs.length);
    const codes = institutions.flatMap((i) => i.identifiers.map((x) => x.value.slice(0, 8) + (x.value.length === 11 && !x.value.endsWith("XXX") ? x.value.slice(8) : "")));
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("labels dated sources", () => {
    const gcb = findByBic("GHCBGHAC");
    expect(gcb && isDatedSource(gcb.identifier.source)).toBe(true);
    const absa = findByBic("ABSAZAJJ");
    expect(absa && isDatedSource(absa.identifier.source)).toBe(false);
  });
  it("covers every priority country with a guide", () => {
    expect(countryGuides.map((c) => c.code).sort()).toEqual(["AE", "AU", "BW", "CA", "DE", "FR", "GB", "GH", "IN", "KE", "NG", "US", "ZA", "ZM", "ZW"]);
  });
});

describe("search", () => {
  it("finds a bank by name and country", () => {
    const r = searchInstitutions("Standard Bank South Africa");
    expect(r[0]?.institution.id).toBe("za-standard-bank");
  });
  it("ranks exact BIC matches first", () => {
    const r = searchInstitutions("nedszajj");
    expect(r[0]?.institution.id).toBe("za-nedbank");
    expect(r[0]?.reason).toBe("bic");
  });
  it("tolerates a typo", () => {
    expect(searchInstitutions("Nedbnak").map((h) => h.institution.id)).toContain("za-nedbank");
  });
  it("filters by country", () => {
    const r = searchInstitutions("stanbic", { country: "ZW" });
    expect(r.every((h) => h.institution.country === "ZW")).toBe(true);
    expect(r.length).toBe(1);
  });
  it("returns nothing for unknown banks rather than guessing", () => {
    expect(searchInstitutions("Bank of Atlantis")).toEqual([]);
  });
});
