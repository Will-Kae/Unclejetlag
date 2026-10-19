/**
 * Phase 4C.7 remediation: evidence-link register.
 *
 * Links EXISTING official sources to workspace cases so a case's evidence status reflects what was
 * actually read, rather than whether the case appears in the resolution plan. Nothing here is new
 * evidence:
 *  - `supplementarySources` restates sources already read and documented in
 *    research/phase-4c4/Phase-4C4-Evidence-Quality-Report.md (URL and access date checked by tests);
 *  - every link names an existing source and gives the reason, taken from that source's own note.
 * No link sets a visa classification, and none touches published data.
 */
import type { ResearchSource } from "../../src/lib/passport/evidence-research";
import type { EvidenceLink } from "../../src/lib/passport/review-workspace";
import { verificationBacklog } from "../phase-4c4/backlog";

export const supplementarySources: ResearchSource[] = [
  {
    id: "tz-nic-inbound-insurance-portal",
    title: "Mandatory Inbound Travel Insurance Portal",
    publisher: "National Insurance Corporation of Tanzania (state-owned)",
    url: "https://inbound.nicinsurance.co.tz/",
    type: "official-portal",
    authorityJurisdiction: "TZ",
    publicationDate: null,
    checked: "2026-10-15",
    access: "partial",
    note: "Phase 4C.4 report: headed \"The United Republic of Tanzania\"; states \"Mandatory inbound travel insurance\" and \"Valid across all of Tanzania — Mainland & Zanzibar\". No effective date, price or exemptions on the page.",
    relevantPairs: [],
  },
  {
    id: "tz-zanzibar-insurance-notice-2024",
    title: "All foreigners (excluding residents) entering Zanzibar: mandatory inbound travel insurance",
    publisher: "President's Office, Finance and Planning, Zanzibar (published by the Embassy of Tanzania, Beijing)",
    url: "https://cn.tzembassy.go.tz/resources/view/all-foreigners-excluding-residents-entering-zanzibarsubject-mandatory-inbound-travel-insurance",
    type: "embassy",
    authorityJurisdiction: "TZ",
    publicationDate: "2024-08-05",
    checked: "2026-10-15",
    access: "read",
    note: "Phase 4C.4 report: mandatory for all foreigners except residents entering Zanzibar, effective 1 October 2024. Zanzibar only.",
    relevantPairs: [],
  },
  {
    id: "mw-embassy-brussels-visa-fees",
    title: "Visa application process",
    publisher: "Embassy of the Republic of Malawi, Brussels",
    url: "https://embassymalawi.be/ova_dep/malawi-visa-application-process/",
    type: "embassy",
    authorityJurisdiction: "MW",
    publicationDate: null,
    metadataDate: { date: "2026-02-25", from: "page modified date reported when read; recorded as \"Modified 25 Feb 2026\" in the Phase 4C.4 report" },
    checked: "2026-10-15",
    access: "read",
    note: "Phase 4C.4 report: single-entry visa USD 50. The 12-month row repeats the 6-month validity and price, an apparent error on the page.",
    relevantPairs: [],
  },
  {
    id: "mw-embassy-berlin-visa-fees",
    title: "Online visa service",
    publisher: "Embassy of the Republic of Malawi, Berlin",
    url: "https://malawiembassy.de/CONSULAR/Malawi-Online-Visa-Service",
    type: "embassy",
    authorityJurisdiction: "MW",
    publicationDate: null,
    checked: "2026-10-15",
    access: "read",
    note: "Phase 4C.4 report: single-entry visa USD 50; 12-month multiple entry USD 250.",
    relevantPairs: [],
  },
];

const backlogCases = (destination: string) =>
  verificationBacklog.filter((b) => b.destination === destination).map((b) => `pair-${b.passport.toLowerCase()}-${b.destination.toLowerCase()}`);

export const evidenceLinks: EvidenceLink[] = [
  // Tanzania inbound travel insurance (Phase 4C.6 plan, P1)
  { caseIds: ["topic-tz-insurance"], sourceId: "tz-nic-inbound-insurance-portal", role: "supporting", reason: "The state insurer's portal states the insurance is mandatory, but gives no effective date, price or exemptions." },
  { caseIds: ["topic-tz-insurance"], sourceId: "tz-zanzibar-insurance-notice-2024", role: "context", reason: "Zanzibar's own 2024 scheme; it does not cover mainland Tanzania." },
  // Malawi single-entry visa fee (P1): official figures disagree
  { caseIds: ["topic-mw-visa-fee"], sourceId: "mw-immigration-visa-fees", role: "supporting", reason: "The Department of Immigration lists USD 75 for a single-entry visa paid online." },
  { caseIds: ["topic-mw-visa-fee"], sourceId: "mw-embassy-brussels-visa-fees", role: "conflicting", reason: "Lists USD 50 for a single-entry visa." },
  { caseIds: ["topic-mw-visa-fee"], sourceId: "mw-embassy-berlin-visa-fees", role: "conflicting", reason: "Lists USD 50 for a single-entry visa." },
  // Ghana entry policy for African passports (P2)
  { caseIds: ["topic-gh-african-entry-policy"], sourceId: "gh-gis-evisa-launch-2026", role: "supporting", reason: "GIS announces \"visa-free entry for all African passport holders\" with an e-visa system; it does not say whether an application is still required." },
  { caseIds: ["topic-gh-african-entry-policy"], sourceId: "gh-isd-free-visas-2026", role: "context", reason: "Describes free e-visas for Africans from 25 May 2026; names no countries." },
  { caseIds: ["topic-gh-african-entry-policy"], sourceId: "gh-evisa-portal", role: "context", reason: "The portal's FAQ on African passport holders did not render when read." },
  { caseIds: ["topic-gh-african-entry-policy"], sourceId: "gh-gis-permits-visas", role: "conflicting", reason: "The source note records that its visa-on-arrival-with-fees statement conflicts with the 2026 free-entry announcement." },
  // Malawi visa-exemption list (P2) and the Malawi backlog pairs
  { caseIds: ["topic-mw-exemption-list", ...backlogCases("MW")], sourceId: "mw-evisa-category-one", role: "context", reason: "Category One list read in full; it names Nigeria but none of the other sprint passports." },
  { caseIds: ["topic-mw-exemption-list", ...backlogCases("MW")], sourceId: "mw-evisa-category-two", role: "context", reason: "Category Two list read in full; none of the 15 sprint passports is on it, so the list does not settle their status." },
  { caseIds: ["topic-mw-exemption-list"], sourceId: "mw-evisa-notice-2026", role: "context", reason: "Explains the two categories (effective 24 February 2026); names no countries." },
  { caseIds: ["topic-mw-exemption-list"], sourceId: "mw-immigration-visa", role: "context", reason: "Refers to visa-required and non-visa-required lists that are not on the page." },
  // Mozambique backlog pairs (SADC passports)
  { caseIds: backlogCases("MZ"), sourceId: "mz-hc-uk-visa", role: "context", reason: "The exemption list covers only the 2023 unilateral exemptions; SADC bilateral exemptions are not listed, so absence proves nothing." },
  // Lesotho backlog pairs
  { caseIds: backlogCases("LS"), sourceId: "ls-mha-do-i-need-a-visa", role: "context", reason: "Says visa-abolition and some Commonwealth countries are exempt but names none." },
];
