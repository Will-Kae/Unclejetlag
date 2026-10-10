/**
 * Verified visa-access records. EVERY record must cite an official source (destination government,
 * its embassy, or legislation) that we opened and read. Never copy another index or Wikipedia.
 * A passport–destination pair with no record here is "Not yet verified" and never counts as zero.
 * See docs/passport-index.md.
 */
import type { AccessCategory, AccessRule, PolicyChange, Source } from "./types";

/** The 15 African passports in the first research sprint. */
export const SPRINT_1_PASSPORTS = ["ZA", "ZW", "BW", "NA", "ZM", "MW", "MZ", "LS", "SZ", "KE", "TZ", "UG", "RW", "NG", "GH"];

const C = "2026-10-10";

export const sources: Source[] = [
  { id: "za-dirco-exempt", title: "Passport holders exempt from South African visas", publisher: "Department of International Relations and Cooperation (South Africa)", url: "https://dirco.gov.za/uk/?p=1541", type: "embassy", sourceUpdated: "2024-03-11", checked: C, note: "Published by the South African High Commission in London. The page says the list is subject to change without notice." },
  { id: "eu-2018-1806", title: "Regulation (EU) 2018/1806: lists of third countries whose nationals must hold visas (Annex I) or are exempt (Annex II)", publisher: "Council of the European Union / European Parliament", url: "https://data.consilium.europa.eu/doc/document/PE-50-2018-REV-1/en/pdf", type: "legislation", sourceUpdated: "2018-11-14", checked: C, note: "Adopted text. Later amendments (consolidated to 30 December 2025) have not moved any of these countries out of Annex I as far as we could check; we re-read the consolidated text when it becomes readable to us." },
  { id: "gb-visa-nationals", title: "Immigration Rules Appendix Visitor: Visa national list", publisher: "UK Home Office (GOV.UK)", url: "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-visitor-visa-national-list", type: "legislation", sourceUpdated: "2026-10-08", checked: C },
  { id: "ie-visa-list", title: "List of visa required / non-visa required nationalities", publisher: "Department of Foreign Affairs / Immigration Service Delivery (Ireland)", url: "https://assets.ireland.ie/documents/List_of_Visa_Required_Non_Visa_Required_Nationalities_-_May_2025.pdf", type: "government", sourceUpdated: "2025-05-12", checked: C },
  { id: "us-vwp", title: "Visa Waiver Program", publisher: "U.S. Department of State", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html", type: "government", checked: C },
  { id: "us-suspension-2026", title: "Suspension of visa issuance to foreign nationals to protect the security of the United States", publisher: "U.S. Department of State", url: "https://adoption.state.gov/content/travel/en/News/visas-news/suspension-of-visa-issuance-to-foreign-nationals-to-protect-the-security-of-the-united-states.html", type: "government", sourceUpdated: "2026-02-02", checked: C },
  { id: "ca-entry", title: "What you need to enter Canada: entry requirements by country or territory", publisher: "Immigration, Refugees and Citizenship Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html", type: "government", sourceUpdated: "2026-07-31", checked: C },
  { id: "ge-visa-permit-list", title: "List of countries whose visa and/or residence permit holders may enter Georgia without a visa", publisher: "Legislative Herald of Georgia", url: "https://matsne.gov.ge/en/document/view/2867377", type: "legislation", checked: "2026-09-24" },
  { id: "ge-evisa", title: "Georgia e-Visa portal", publisher: "Ministry of Foreign Affairs of Georgia", url: "https://www.evisa.gov.ge/GeoVisa/", type: "official-portal", checked: "2026-09-24" },
  { id: "ae-gdrfa-tourist", title: "Issuance of a single-entry tourist visa", publisher: "General Directorate of Residency and Foreigners Affairs, Dubai", url: "https://www.gdrfad.gov.ae/en/services/f9e586fe-0642-11ec-0320-0050569629e8", type: "official-portal", checked: "2026-09-24" },
];

type Spec = { cat: AccessCategory; days?: number; cond?: string; ev: string; conf?: "high" | "medium"; from?: string };

function group(destinations: string[], sourceId: string, per: Record<string, Spec>): AccessRule[] {
  return destinations.flatMap((d) =>
    Object.entries(per)
      .filter(([p]) => p !== d)
      .map(([p, s]) => ({ passport: p, destination: d, category: s.cat, maxStayDays: s.days, conditions: s.cond, evidence: s.ev, sourceId, effectiveFrom: s.from, verification: "verified" as const, confidence: s.conf ?? "high" })),
  );
}
const all = (s: Spec, except: string[] = []) => Object.fromEntries(SPRINT_1_PASSPORTS.filter((p) => !except.includes(p)).map((p) => [p, s]));

/** Schengen states plus Bulgaria, Romania and Cyprus, which apply the EU common visa list. */
export const EU_VISA_LIST_STATES = "AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE CH".split(" ");

const za90: Spec = { cat: "visa-free", days: 90, ev: "Exempt \"for an intended stay of 90 days or less and when in transit\"", conf: "medium" };
const za30: Spec = { cat: "visa-free", days: 30, ev: "Exempt \"for an intended stay of 30 days or less and when in transit\"", conf: "medium" };
const zaVr: Spec = { cat: "visa-required", ev: "Not on the list of ordinary passports exempt from South African visas", conf: "medium" };

const euVr: Spec = { cat: "visa-required", days: 90, cond: "Short-stay (Schengen) visa: up to 90 days in any 180-day period.", ev: "Annex I: \"List of third countries whose nationals are required to be in possession of a visa\"" };

export const rules: AccessRule[] = [
  // South Africa (destination)
  ...group(["ZA"], "za-dirco-exempt", { ZW: za90, BW: za90, NA: { ...za90, cond: "90 days per year." }, ZM: { ...za90, cond: "90 days per year." }, KE: { ...za90, cond: "90 days per year." }, TZ: { ...za90, cond: "90 days per year." }, GH: { ...za90, cond: "90 days per year." }, MW: za30, MZ: za30, LS: za30, SZ: za30, UG: zaVr, RW: zaVr, NG: zaVr }),
  // EU common visa list
  ...group(EU_VISA_LIST_STATES, "eu-2018-1806", all(euVr)),
  // United Kingdom
  ...group(["GB"], "gb-visa-nationals", all({ cat: "visa-required", ev: "Listed in VN 1.1(a) of the visa national list" })),
  // Ireland
  ...group(["IE"], "ie-visa-list", all({ cat: "visa-required", ev: "Listed under \"Visa Required Nationalities\"" })),
  // United States: no African country is in the Visa Waiver Program; five are under the 2026 visitor-visa suspension
  ...group(["US"], "us-vwp", all({ cat: "visa-required", ev: "Not a Visa Waiver Program participating country" }, ["MW", "NG", "TZ", "ZM", "ZW"])),
  ...group(["US"], "us-suspension-2026", Object.fromEntries(["MW", "NG", "TZ", "ZM", "ZW"].map((p) => [p, { cat: "restricted" as const, cond: "Issuance of B-1/B-2 visitor visas is partially suspended under a presidential proclamation. Limited exceptions apply; check with the U.S. embassy.", ev: "Listed under partial suspension, effective 1 January 2026", from: "2026-01-01" }]))),
  // Canada
  ...group(["CA"], "ca-entry", all({ cat: "visa-required", ev: "Listed under \"Visa-required countries or territories\"" })),
  // Individual briefs (see /visas)
  { passport: "ZW", destination: "GE", category: "evisa", maxStayDays: 30, conditions: "Holders of a valid visa or residence permit from a country on Georgia's official list can enter visa-free for 90 days in any 180.", evidence: "Zimbabwe is not on Georgia's visa-free list; e-visa via evisa.gov.ge", sourceId: "ge-evisa", verification: "verified", confidence: "high" },
  { passport: "NG", destination: "AE", category: "visa-required", conditions: "Visit visa issued before travel through a UAE sponsor (hotel, licensed tourism company, airline or resident relative).", evidence: "Single-entry tourist visa issued through a UAE sponsor", sourceId: "ae-gdrfa-tourist", verification: "verified", confidence: "medium" },
];

export const policyChanges: PolicyChange[] = [
  { id: "us-2026-suspension", headline: "United States partially suspends visitor visas for five Southern, East and West African passports", passports: ["MW", "NG", "TZ", "ZM", "ZW"], destination: "US", previous: "Visa required", next: "Visitor (B-1/B-2) visa issuance partially suspended", effective: "2026-01-01", sourceId: "us-suspension-2026", verified: C },
];
