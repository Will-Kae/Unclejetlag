/**
 * Uncle Jetlag World Passport Index: jurisdiction registry.
 *
 * Published scope (methodology v0.1): the 193 UN member states, the two UN observer states
 * (Holy See, State of Palestine), Kosovo, Taiwan, and the Hong Kong and Macao SARs, which issue
 * their own passports and run their own border controls: 199 jurisdictions.
 * Each is both a passport issuer and a destination. Other territories are out of scope for v0.1.
 *
 * Regions are non-overlapping, so regional totals always add up. Africa uses the African Union's
 * five regions.
 */
export type Region = "africa" | "europe" | "asia" | "middle-east" | "americas" | "oceania";
export type AfricaSubregion = "southern" | "east" | "central" | "west" | "north";
export type JurisdictionType = "un-member" | "un-observer" | "partially-recognised" | "sar";

export const regions: { key: Region; label: string; slug: string }[] = [
  { key: "africa", label: "Africa", slug: "africa" },
  { key: "europe", label: "Europe", slug: "europe" },
  { key: "asia", label: "Asia", slug: "asia" },
  { key: "middle-east", label: "Middle East", slug: "middle-east" },
  { key: "americas", label: "Americas", slug: "americas" },
  { key: "oceania", label: "Oceania", slug: "oceania" },
];

const R: Record<Region, string> = {
  africa: "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW",
  europe: "AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH TR UA GB VA",
  asia: "AF AM AZ BD BT BN KH CN GE IN ID JP KZ KP KR KG LA MY MV MN MM NP PK PH SG LK TW TJ TH TL TM UZ VN HK MO",
  "middle-east": "AE BH IL IQ IR JO KW LB OM PS QA SA SY YE",
  americas: "AG AR BS BB BZ BO BR CA CL CO CR CU DM DO EC SV GD GT GY HT HN JM MX NI PA PY PE KN LC VC SR TT US UY VE",
  oceania: "AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU",
};

const AFRICA_SUB: Record<AfricaSubregion, string> = {
  southern: "AO BW LS MW MZ NA ZA SZ ZM ZW",
  east: "KM DJ ER ET KE MG MU RW SC SO SS SD TZ UG",
  central: "BI CM CF TD CG CD GQ GA ST",
  west: "BJ BF CV CI GM GH GN GW LR ML NE NG SN SL TG",
  north: "DZ EG LY MR MA TN",
};

export const africaSubregions: { key: AfricaSubregion; label: string }[] = [
  { key: "southern", label: "Southern Africa" },
  { key: "east", label: "East Africa" },
  { key: "west", label: "West Africa" },
  { key: "north", label: "North Africa" },
  { key: "central", label: "Central Africa" },
];

const SPECIAL: Record<string, { type: JurisdictionType; name?: string }> = {
  VA: { type: "un-observer", name: "Vatican City" },
  PS: { type: "un-observer", name: "Palestine" },
  XK: { type: "partially-recognised", name: "Kosovo" },
  TW: { type: "partially-recognised", name: "Taiwan" },
  HK: { type: "sar", name: "Hong Kong" },
  MO: { type: "sar", name: "Macao" },
};

/** Short display names where Intl's default is awkward. */
const NAME_OVERRIDES: Record<string, string> = {
  CD: "DR Congo", CG: "Congo", CI: "Côte d'Ivoire", KP: "North Korea", KR: "South Korea", FM: "Micronesia",
  MM: "Myanmar", MK: "North Macedonia", US: "United States", GB: "United Kingdom", AE: "United Arab Emirates",
  SZ: "Eswatini", CZ: "Czechia", TR: "Türkiye", LA: "Laos", ...Object.fromEntries(Object.entries(SPECIAL).map(([k, v]) => [k, v.name!])),
};

export type Jurisdiction = {
  code: string;
  name: string;
  slug: string;
  region: Region;
  africaSubregion?: AfricaSubregion;
  type: JurisdictionType;
  isPassportIssuer: true;
  isDestination: true;
};

const dn = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const jurisdictions: Jurisdiction[] = (Object.entries(R) as [Region, string][])
  .flatMap(([region, codes]) =>
    codes.split(" ").map((code) => {
      const name = NAME_OVERRIDES[code] ?? dn?.of(code) ?? code;
      const sub = region === "africa" ? (Object.entries(AFRICA_SUB) as [AfricaSubregion, string][]).find(([, c]) => c.split(" ").includes(code))?.[0] : undefined;
      return { code, name, slug: slugify(name), region, africaSubregion: sub, type: SPECIAL[code]?.type ?? "un-member", isPassportIssuer: true as const, isDestination: true as const };
    }),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

const byCode = new Map(jurisdictions.map((j) => [j.code, j]));
const bySlug = new Map(jurisdictions.map((j) => [j.slug, j]));
export const getJurisdiction = (code: string) => byCode.get(code.toUpperCase());
export const getJurisdictionBySlug = (slug: string) => bySlug.get(slug);
export const jName = (code: string) => byCode.get(code)?.name ?? code;
export const flagOf = (code: string) => (/^[A-Z]{2}$/.test(code) && code !== "XK" ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🏳️");
