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
const C2 = "2026-10-10";

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
  { id: "zm-no-visa", title: "Nationals who do not require visa", publisher: "Department of Immigration (Zambia)", url: "https://www.zambiaimmigration.gov.zm/nationals-who-dont-require-visa/", type: "government", checked: C2, note: "Reflects Statutory Instrument No. 78 of 2024, in force from 1 January 2025." },
  { id: "zm-voa", title: "Nationals requiring visas on arrival or from Zambian missions abroad", publisher: "Department of Immigration (Zambia)", url: "https://www.zambiaimmigration.gov.zm/nationals-who-require-visa/", type: "government", checked: C2 },
  { id: "zm-prior", title: "Nationals requiring visa prior to travel", publisher: "Department of Immigration (Zambia)", url: "https://www.zambiaimmigration.gov.zm/nationals-requiring-visa-prior-to-travel/", type: "government", checked: C2 },
  { id: "zw-cat-a", title: "Visa regime: Category A countries", publisher: "Department of Immigration Zimbabwe", url: "https://www.zimimmigration.gov.zw/?p=7176", type: "government", sourceUpdated: "2025-06-10", checked: C2 },
  { id: "zw-cat-b", title: "Visa regime: Category B countries", publisher: "Department of Immigration Zimbabwe", url: "https://www.zimimmigration.gov.zw/?p=7186", type: "government", sourceUpdated: "2025-06-10", checked: C2 },
  { id: "zw-cat-c", title: "Visa regime: Category C countries", publisher: "Department of Immigration Zimbabwe", url: "https://www.zimimmigration.gov.zw/?p=7196", type: "government", sourceUpdated: "2025-06-10", checked: C2 },
  { id: "ke-eta-exempt", title: "Kenya eTA: general information and exemptions (Kenya Citizenship and Immigration (Amendment) Rules, 2025)", publisher: "Directorate of Immigration Services (Kenya)", url: "https://etakenya.go.ke/general-information", type: "official-portal", checked: C2 },
  { id: "rw-visa-general", title: "Visa: general information", publisher: "Directorate General of Immigration and Emigration (Rwanda)", url: "https://www.migration.gov.rw/our-services/visa-issued-under-special-arrangement", type: "government", checked: C2 },
  { id: "ug-exempt", title: "Visa exempt countries or regions", publisher: "Directorate of Citizenship and Immigration Control (Uganda)", url: "https://immigration.go.ug/node/194", type: "government", checked: C2, note: "Lists countries with which Uganda has visa abolition agreements. No stay period or date is shown." },
  { id: "bw-embassy-us", title: "Guidelines for completing a visa application (visa-exempt and visa-required countries)", publisher: "Embassy of the Republic of Botswana, Washington DC", url: "https://botswanaembassy.org/node/1682", type: "embassy", checked: C2, note: "No date shown on the lists." },
  { id: "tz-hc-namibia", title: "Visa information", publisher: "High Commission of the United Republic of Tanzania, Windhoek", url: "https://www.na.tzembassy.go.tz/services/category/visa-information", type: "embassy", checked: C2, note: "No date shown on the lists." },
  { id: "na-mha-2025", title: "Fact sheet: operationalisation of visa reciprocity (visa on arrival), from 1 April 2025", publisher: "Ministry of Home Affairs, Immigration, Safety and Security (Namibia)", url: "https://www.na.emb-japan.go.jp/files/100807710.pdf", type: "government", sourceUpdated: "2025-04-01", checked: C2, note: "Ministry fact sheet republished by the Embassy of Japan in Namibia." },
  { id: "sc-ics", title: "Visiting Seychelles", publisher: "Immigration and Civil Status (Seychelles)", url: "https://ics.gov.sc/visa-and-travel/visiting-seychelles", type: "government", checked: C2 },
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
  // ── Sprint 2: African destinations ──
  // Zambia
  ...group(["ZM"], "zm-no-visa", Object.fromEntries(["ZA","ZW","BW","NA","MW","MZ","LS","SZ","KE","TZ","UG"].map((p) => [p, { cat: "visa-free" as const, ev: "\"Nationals of the countries listed below do not require visas to enter Zambia\"" }]))),
  ...group(["ZM"], "zm-voa", { RW: { cat: "visa-on-arrival", ev: "Listed: visas \"on arrival, at any port of entry or from selected Zambian Missions Abroad\"" }, GH: { cat: "visa-on-arrival", ev: "Listed: visas \"on arrival, at any port of entry or from selected Zambian Missions Abroad\"" } }),
  ...group(["ZM"], "zm-prior", { NG: { cat: "evisa", cond: "Advance clearance required: apply online through the Zambia eServices portal and receive an approval letter before travel.", ev: "Listed: \"require advance clearance by the Zambian Authorities\"" } }),
  // Zimbabwe
  ...group(["ZW"], "zw-cat-a", Object.fromEntries(["ZA","BW","NA","ZM","MW","MZ","LS","SZ","KE","TZ","UG","GH"].map((p) => [p, { cat: "visa-free" as const, ev: "Category A: \"do not require a visa to enter the country\"" }]))),
  ...group(["ZW"], "zw-cat-b", { RW: { cat: "visa-on-arrival", cond: "Can also be applied for online at evisa.gov.zw.", ev: "Category B: visa \"may also be obtained at the port of entry\"" } }),
  ...group(["ZW"], "zw-cat-c", { NG: { cat: "evisa", ev: "Category C: \"apply, make payment online and obtain a visa prior to travelling\"" } }),
  // Kenya (ETA-exempt)
  ...group(["KE"], "ke-eta-exempt", {
    ...Object.fromEntries(["RW","TZ","UG"].map((p) => [p, { cat: "visa-free" as const, days: 180, cond: "East African Community citizens: no eTA needed.", ev: "eTA exempt: EAC citizens \"for a period not exceeding 180 days\"" }])),
    ...Object.fromEntries(["ZA","ZW","BW","NA","ZM","MW","MZ","LS","SZ","GH"].map((p) => [p, { cat: "visa-free" as const, days: 90, cond: "No eTA needed.", ev: "eTA exempt \"for a period not exceeding ninety (90) days\"" }])),
    NG: { cat: "visa-free", days: 60, cond: "No eTA needed.", ev: "eTA exempt \"for a period not exceeding sixty (60) days\"" },
  }),
  // Rwanda
  ...group(["RW"], "rw-visa-general", {
    ...Object.fromEntries(["ZA","ZW","BW","NA","ZM","MW","MZ","LS","SZ","NG"].map((p) => [p, { cat: "visa-on-arrival" as const, days: 30, cond: "African Union and Commonwealth citizens: visa issued on arrival with the fee waived.", ev: "\"get visa upon arrival and are waived visa fees for a visit of 30 days\"" }])),
    ...Object.fromEntries(["KE","TZ","UG"].map((p) => [p, { cat: "visa-on-arrival" as const, days: 180, cond: "East African Community citizens: free entry pass on arrival.", ev: "EAC: \"pass/entry visa free of charge upon arrival to stay for the period of six months\"" }])),
    GH: { cat: "visa-on-arrival", days: 90, cond: "Visa issued free of charge on arrival.", ev: "\"90 days valid visa free of charge upon arrival\"" },
  }),
  // Uganda
  ...group(["UG"], "ug-exempt", {
    ...Object.fromEntries(["ZW","BW","ZM","MW","MZ","LS","SZ","KE","TZ","RW","GH"].map((p) => [p, { cat: "visa-free" as const, ev: "Listed under \"Visa Exempt Countries or Regions\"", conf: "medium" as const }])),
    ...Object.fromEntries(["ZA","NA","NG"].map((p) => [p, { cat: "visa-required" as const, cond: "Not on Uganda's visa-exempt list for ordinary passports. Uganda issues visas online.", ev: "Not listed under \"Visa Exempt Countries or Regions\"", conf: "medium" as const }])),
  }),
  // Botswana
  ...group(["BW"], "bw-embassy-us", {
    ...Object.fromEntries(["ZA","ZW","NA","ZM","MW","MZ","LS","SZ","KE","TZ","UG"].map((p) => [p, { cat: "visa-free" as const, ev: "\"Countries Whose Citizens Do NOT Require a Visa to Enter Botswana\"", conf: "medium" as const }])),
    ...Object.fromEntries(["RW","NG","GH"].map((p) => [p, { cat: "visa-required" as const, ev: "\"Countries Which Require a Visa to Enter Botswana\"", conf: "medium" as const }])),
  }),
  // Tanzania
  ...group(["TZ"], "tz-hc-namibia", {
    ...Object.fromEntries(["ZA","BW","NA","ZM","MW","MZ","LS","SZ","GH"].map((p) => [p, { cat: "visa-free" as const, days: 90, ev: "\"Countries which their nationals do not require visa\"; visitor's pass up to three months", conf: "medium" as const }])),
    ...Object.fromEntries(["KE","UG","RW"].map((p) => [p, { cat: "visa-free" as const, days: 180, cond: "East African Community citizens: visitor's pass up to six months.", ev: "\"Countries which their nationals do not require visa\"", conf: "medium" as const }])),
  }),
  // Namibia: only the three named in the 2025 fact sheet
  ...group(["NA"], "na-mha-2025", Object.fromEntries(["UG","RW","GH"].map((p) => [p, { cat: "visa-on-arrival" as const, from: "2025-04-01", ev: "Named for visa on arrival from 1 April 2025", conf: "medium" as const }]))),
  // Seychelles
  ...group(["SC"], "sc-ics", all({ cat: "eta", cond: "No visa needed. Complete the online travel authorisation at seychelles.govtas.com before travel; a visitor's permit is issued on arrival. Return ticket and funds required.", ev: "\"a visa is not required to enter Seychelles\"; online portal before arrival" })),
  // Individual briefs (see /visas)
  { passport: "ZW", destination: "GE", category: "evisa", maxStayDays: 30, conditions: "Holders of a valid visa or residence permit from a country on Georgia's official list can enter visa-free for 90 days in any 180.", evidence: "Zimbabwe is not on Georgia's visa-free list; e-visa via evisa.gov.ge", sourceId: "ge-evisa", verification: "verified", confidence: "high" },
  { passport: "NG", destination: "AE", category: "visa-required", conditions: "Visit visa issued before travel through a UAE sponsor (hotel, licensed tourism company, airline or resident relative).", evidence: "Single-entry tourist visa issued through a UAE sponsor", sourceId: "ae-gdrfa-tourist", verification: "verified", confidence: "medium" },
];

export const policyChanges: PolicyChange[] = [
  { id: "us-2026-suspension", headline: "United States partially suspends visitor visas for five Southern, East and West African passports", passports: ["MW", "NG", "TZ", "ZM", "ZW"], destination: "US", previous: "Visa required", next: "Visitor (B-1/B-2) visa issuance partially suspended", effective: "2026-01-01", sourceId: "us-suspension-2026", verified: C },
];
