/** Snapshot of every country identifier the site's URLs and data depend on. */
import fs from "node:fs";
import path from "node:path";
import { countries, regions as destinationRegions } from "@/data/countries";
import { esimDestinations } from "@/data/esim";
import { jurisdictions } from "@/lib/passport/jurisdictions";
import { ISO_ALPHA2 } from "@/lib/banking/iso-countries";
import { countryGuides } from "@/lib/banking/countries";
import { institutions } from "@/lib/banking/directory";

const ROOT = path.join(__dirname, "../..");
const list = (dir: string) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, "")).sort();

export function registrySnapshot() {
  return {
    destinationRegistry: countries.map((c) => ({ slug: c.slug, iso2: c.iso2, region: c.region })).sort((a, b) => a.iso2.localeCompare(b.iso2)),
    destinationRegionKeys: destinationRegions.map((r) => r.key),
    passportJurisdictions: jurisdictions.map((j) => ({ code: j.code, slug: j.slug, region: j.region, africaSubregion: j.africaSubregion ?? null })).sort((a, b) => a.code.localeCompare(b.code)),
    bankingIsoCodes: [...ISO_ALPHA2].sort(),
    bankingCountryGuides: countryGuides.map((g) => ({ code: g.code, slug: g.slug })).sort((a, b) => a.code.localeCompare(b.code)),
    bankInstitutions: institutions.map((i) => `${i.country}/${i.slug}`).sort(),
    esimSlugs: esimDestinations.map((e) => e.slug).sort(),
    destinationFiles: list("content/destinations"),
    visaBriefFiles: list("content/visas"),
  };
}
