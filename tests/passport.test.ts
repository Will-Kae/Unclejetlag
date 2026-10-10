import { describe, expect, it } from "vitest";
import { accessFor, bestRule, comparePassports, competitionRank, rankingStatus, scorePassport } from "@/lib/passport/engine";
import { getJurisdictionBySlug, jurisdictions } from "@/lib/passport/jurisdictions";
import { rules, sources } from "@/lib/passport/data";
import type { AccessRule } from "@/lib/passport/types";

const r = (passport: string, destination: string, category: AccessRule["category"], extra: Partial<AccessRule> = {}): AccessRule => ({ passport, destination, category, evidence: "x", sourceId: "s", verification: "verified", confidence: "high", ...extra });

describe("registry", () => {
  it("has 199 jurisdictions with unique codes and slugs", () => {
    expect(jurisdictions).toHaveLength(199);
    expect(new Set(jurisdictions.map((j) => j.code)).size).toBe(199);
    expect(new Set(jurisdictions.map((j) => j.slug)).size).toBe(199);
  });
  it("puts every African country in exactly one AU subregion", () => {
    const af = jurisdictions.filter((j) => j.region === "africa");
    expect(af).toHaveLength(54);
    expect(af.every((j) => j.africaSubregion)).toBe(true);
  });
  it("resolves slugs", () => {
    expect(getJurisdictionBySlug("zimbabwe")?.code).toBe("ZW");
    expect(getJurisdictionBySlug("south-africa")?.code).toBe("ZA");
  });
});

describe("data integrity", () => {
  const ids = new Set(sources.map((s) => s.id));
  const codes = new Set(jurisdictions.map((j) => j.code));
  it("every rule cites a registered source and valid jurisdictions", () => {
    for (const x of rules) {
      expect(ids.has(x.sourceId), x.sourceId).toBe(true);
      expect(codes.has(x.passport), x.passport).toBe(true);
      expect(codes.has(x.destination), x.destination).toBe(true);
      expect(x.passport).not.toBe(x.destination);
      expect(x.evidence.length).toBeGreaterThan(5);
    }
  });
  it("has no duplicate rule for the same pair, category and source", () => {
    const keys = rules.map((x) => `${x.passport}>${x.destination}>${x.category}>${x.sourceId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("cites no third-party index or encyclopedia", () => {
    for (const s of sources) expect(s.url).not.toMatch(/wikipedia|henley|passportindex|visahq|ivisa|visaguide/i);
  });
});

describe("scoring", () => {
  it("never counts unknown destinations as zero and withholds scores below coverage", () => {
    const s = scorePassport("ZW", [r("ZW", "ZA", "visa-free")]);
    expect(s.counts.unknown).toBe(197);
    expect(s.mobilityScore).toBeNull();
    expect(s.powerScore).toBeNull();
    expect(s.scored).toBe(false);
  });
  it("counts each destination once, choosing the best verified rule", () => {
    const a = accessFor("ZW", [r("ZW", "ZA", "evisa"), r("ZW", "ZA", "visa-free")]);
    expect(a.find((x) => x.destination === "ZA")?.category).toBe("visa-free");
    expect(a.filter((x) => x.destination === "ZA")).toHaveLength(1);
  });
  it("lets a restriction override other rules for the same pair", () => {
    expect(bestRule([r("ZW", "US", "visa-required"), r("ZW", "US", "restricted")])?.category).toBe("restricted");
  });
  it("excludes the passport's own country", () => {
    expect(accessFor("ZA").some((x) => x.destination === "ZA")).toBe(false);
    expect(accessFor("ZA")).toHaveLength(198);
  });
  it("scores a fully covered passport and keeps power within 0-100", () => {
    const full = jurisdictions.filter((j) => j.code !== "ZW").map((j, i) => r("ZW", j.code, i % 2 ? "visa-free" : "visa-required", { maxStayDays: 90 }));
    const s = scorePassport("ZW", full);
    expect(s.scored).toBe(true);
    expect(s.mobilityScore).toBe(99);
    expect(s.powerScore).toBeGreaterThan(0);
    expect(s.powerScore).toBeLessThanOrEqual(100);
  });
});

describe("ranking", () => {
  it("uses competition ranking for ties", () => {
    const ranked = competitionRank([{ v: 10 }, { v: 12 }, { v: 12 }, { v: 9 }], (x) => x.v).map((x) => x.rank);
    expect(ranked).toEqual([1, 1, 3, 4]);
  });
  it("is not published with current coverage", () => {
    expect(rankingStatus().published).toBe(false);
  });
});

describe("comparison", () => {
  it("splits verified destinations into both / only A / only B and keeps unknowns apart", () => {
    const rs = [r("ZA", "GB", "visa-required"), r("ZW", "GB", "visa-required"), r("ZW", "ZA", "visa-free"), r("ZA", "BW", "visa-free"), r("ZW", "BW", "visa-free")];
    const c = comparePassports("ZA", "ZW", "visa-free", rs);
    expect(c.both).toEqual(["BW"]);
    expect(c.onlyA).toEqual([]);
    expect(c.onlyB).toEqual([]);
    expect(c.unverified).toContain("FR");
  });
});
