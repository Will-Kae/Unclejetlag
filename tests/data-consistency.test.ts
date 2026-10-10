/**
 * Passport, visa and country consistency (Phase 1A). Read-only checks; nothing here merges or edits
 * the three registries (src/data/countries.ts, src/lib/passport/jurisdictions.ts, src/lib/banking/*).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { countries } from "@/data/countries";
import { jurisdictions } from "@/lib/passport/jurisdictions";
import { accessFor } from "@/lib/passport/engine";
import { rules, sources } from "@/lib/passport/data";
import { countryGuides } from "@/lib/banking/countries";
import { institutions } from "@/lib/banking/directory";
import { esimCompareHref, getEsimDestination } from "@/data/esim";
import { categoryMeta, type AccessCategory } from "@/lib/passport/types";
import { registrySnapshot } from "./harness/registry";

const ROOT = path.join(__dirname, "..");
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/registry-snapshot.json"), "utf8"));
const bySlug = new Map(countries.map((c) => [c.slug, c]));
const jur = new Map(jurisdictions.map((j) => [j.code, j]));

describe("registry compatibility (snapshot)", () => {
  const now = registrySnapshot();
  for (const key of Object.keys(now) as (keyof typeof now)[]) {
    it(`${key} is unchanged`, () => {
      expect(now[key], `${key} changed. Country slugs, regions and banking references back live URLs: change only with an approved migration and regenerate the baseline.`).toEqual(baseline[key]);
    });
  }
});

describe("identifiers", () => {
  it("every destination-registry country is a known jurisdiction", () => {
    for (const c of countries) expect(jur.has(c.iso2), `${c.slug} (${c.iso2})`).toBe(true);
  });
  it("every destination profile file resolves in the destination registry", () => {
    for (const s of baseline.destinationFiles) expect(bySlug.has(s), s).toBe(true);
  });
  it("every banking country guide matches the destination registry slug and ISO code", () => {
    for (const g of countryGuides) expect(bySlug.get(g.slug)?.iso2, g.slug).toBe(g.code);
  });
  it("every bank belongs to a banking country guide", () => {
    const codes = new Set(countryGuides.map((g) => g.code));
    for (const i of institutions) expect(codes.has(i.country), `${i.country}/${i.slug}`).toBe(true);
  });
  it("every Passport Index rule uses known jurisdictions and a registered source", () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const r of rules) {
      expect(jur.has(r.passport), r.passport).toBe(true);
      expect(jur.has(r.destination), r.destination).toBe(true);
      expect(ids.has(r.sourceId), r.sourceId).toBe(true);
      expect(r.evidence.trim().length).toBeGreaterThan(0);
    }
  });
  it("every destination guide's eSIM compare link points to a page that exists", () => {
    for (const s of baseline.destinationFiles as string[]) {
      const href = esimCompareHref(s);
      if (href === "/esim#compare") continue;
      const slug = href.replace(/^\/esim\//, "");
      expect(getEsimDestination(slug), `${s} -> ${href}`).toBeDefined();
    }
  });
  it("every source has an https URL, a publisher and a checked date", () => {
    for (const s of sources) {
      expect(s.url.startsWith("https://"), s.id).toBe(true);
      expect(s.publisher.length, s.id).toBeGreaterThan(0);
      expect(s.checked, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("visa briefs vs Passport Index", () => {
  const files = fs.readdirSync(path.join(ROOT, "content/visas")).filter((f) => f.endsWith(".mdx"));

  /** Classify the brief's own one-line requirement by how it opens ("Visa not required…", "Visa required…"). */
  function briefCategory(requirement: string): "no-advance-visa" | "evisa" | "visa-required" | "unclassified" {
    const t = requirement.trim().toLowerCase();
    if (/^(visa )?not required|^visa-free|^exempt/.test(t)) return "no-advance-visa";
    if (/^visa required/.test(t)) return /e-?visa/.test(t) ? "evisa" : "visa-required";
    return "unclassified";
  }
  const indexGroup = (c: AccessCategory) => (categoryMeta[c].noAdvanceVisa ? "no-advance-visa" : c === "evisa" ? "evisa" : c === "visa-required" || c === "restricted" ? "visa-required" : c);

  for (const f of files) {
    it(`${f}: identifiers resolve and the requirement agrees with the Index`, () => {
      const fm = matter(fs.readFileSync(path.join(ROOT, "content/visas", f), "utf8")).data as Record<string, string>;
      const [pSlug, dSlug] = f.replace(/\.mdx$/, "").split("--");
      expect(fm.passport, "frontmatter passport matches file name").toBe(pSlug);
      expect(fm.destination, "frontmatter destination matches file name").toBe(dSlug);
      const p = bySlug.get(pSlug), d = bySlug.get(dSlug);
      expect(p, `passport slug ${pSlug}`).toBeDefined();
      expect(d, `destination slug ${dSlug}`).toBeDefined();
      expect(fm.verifiedDate, "brief has a verifiedDate").toBeTruthy();
      const brief = briefCategory(String(fm.requirement ?? ""));
      expect(brief, `could not classify requirement: "${fm.requirement}"`).not.toBe("unclassified");
      const rule = accessFor(p!.iso2).find((a) => a.destination === d!.iso2);
      if (rule && rule.category !== "unknown") {
        expect(indexGroup(rule.category), `Brief says ${brief}, Passport Index says ${rule.category}`).toBe(brief);
      }
    });
  }
});
