# Phase 4C.4: evidence-quality audit

**Branch:** `phase-4c4/passport-evidence-quality`, from `main` at `98da8d4`. It doesn't touch the Phase 4C.2 or 4C.3 branches (PR #13 and PR #14).

**Research dates:** 14–15 October 2026.

**Status:** an audit and safeguards only.

- No visa classification in `src/lib/passport/data.ts` was changed.
- Nothing was approved, published or written to a database.

## Summary

**None of the six disputed questions can be closed from the official material available online.** Each one is narrowed below, and what's still contradictory is stated rather than settled by assumption.

| # | Question | Finding | Confidence |
|---|---|---|---|
| 1 | Ghana → Tanzania | Still contradictory. Tanzania's own 2026 guidelines say both visa-free (§6) and visa on arrival (§7). Three embassy lists and a 2017 Tanzanian list say visa-free. | Medium for visa-free; unresolved |
| 2 | Ghana → Namibia | The published visa-on-arrival record is supported by the 2025 ministry fact sheet. The "diplomatic only" entry comes from an out-of-date London page about **exemption**, not visa on arrival. No diplomatic exemption is misapplied. | Medium |
| 3 | Zimbabwe → Tanzania | Four sources say no visa (2026 guidelines §6, Kuala Lumpur list, the Harare mission's list, its 2017 PDF). Two undated embassy lists omit Zimbabwe. The weight of evidence favours visa-free, but there is no explicit, dated department statement naming Zimbabwe. | Medium; unresolved |
| 4 | Tanzania insurance | A mandatory scheme exists. The official NIC portal says it is "valid across all of Tanzania, Mainland & Zanzibar". The **1 October 2026 start date and the EAC/SADC exemption on our pages come only from secondary sources**, and they conflict on "residents" versus "citizens". Zanzibar has had its own scheme since 1 October 2024. | High that it exists; low on date and exemptions |
| 5 | Malawi fees | Two official figures conflict. The Department of Immigration lists USD 75 single entry "online". The Malawi embassies in Brussels (25 Feb 2026) and Berlin list USD 50. | High that the discrepancy exists |
| 6 | Kenya sources | Primary sources confirmed. The eTA portal and Legal Notice No. 93 of 2025 match all 14 Kenya records (EAC 180 days, 90-day list, Nigeria 60 days). The Kenya page's law-firm source is replaced with these two. | High |

**Safeguards added:**

- A new check module, `src/lib/passport/evidence-quality.ts`, with 31 tests.
- **The live dataset has 0 evidence-quality errors.**
- It has 83 warnings, all recorded in a reviewed baseline:

  | Warning | Count |
  |---|---|
  | Records with no stay period | 66 |
  | Seychelles conditions (return ticket and funds) not stated in the evidence | 15 |
  | Old EU legal text | 1 |
  | Zimbabwe → Georgia stay figures (one record) | 1 |

- **One content page has an unsupported insurance claim:** Georgia, which cites an insurer's article.

**Ranking:** still unpublished. 0 of 199 passports are scored, against 180 required.

## 1. Disputed evidence, item by item

Each source below is listed with its URL, issuing authority, the date the source itself shows, and the date I read it (the access date). "None shown" means the source displays no date.

### 1.1 Ghana → Tanzania (published: visa-free, source `tz-hc-namibia`)

| Source | URL | Authority | Date shown | Accessed | Evidence |
|---|---|---|---|---|---|
| Tanzania Visa Guidelines | https://www.immigration.go.tz/websiteportal/uploads/information_links/info_link_20260910_084204_a50ed70947.pdf | Immigration Services Department | None shown (PDF metadata: 5 Sep 2026) | 2026-10-14 | §6: EAC, SADC (except Comoros) and Commonwealth countries (except UK, CA, IN, PK, AU, NZ) don't need a visa. §7, "Countries whose nationals can obtain a visa upon arrival", names **Ghana** |
| List of countries and specific visa eligibility | https://www.zw.tzembassy.go.tz/uploads/List_of_Countries_with_VISA_Eligibility.pdf | Tanzania Immigration (hosted by the High Commission, Harare) | None shown (PDF metadata: 8 Nov 2017) | 2026-10-15 | "Ghana Republic: No Visa Requirements" |
| No-visa list | https://www.my.tzembassy.go.tz/services/list-of-countries-which-do-not-require-visa | High Commission, Kuala Lumpur | None | 2026-10-14 | Ghana listed |
| No-visa list | https://www.rw.tzembassy.go.tz/services/category/visa-information | High Commission, Kigali | None | 2026-10-14 | Ghana listed |
| No-visa list | https://www.na.tzembassy.go.tz/services/category/visa-information | High Commission, Windhoek (`tz-hc-namibia`) | None | 2026-10-14 | Ghana listed |

**Assessment:** four sources (one of them 2017) list Ghana as visa-free. The newest primary source contradicts itself: Ghana is a Commonwealth member, so §6 covers it, yet §7 names it.

**Recommendation:**

- Keep the published record.
- Ask the department to confirm in writing (info@immigration.go.tz).
- Don't change the record without that confirmation or a dated notice.

### 1.2 Ghana → Namibia (published: visa on arrival, source `na-mha-2025`)

| Source | URL | Authority | Date shown | Accessed | Evidence |
|---|---|---|---|---|---|
| Visa-on-arrival implementation fact sheet | https://www.na.emb-japan.go.jp/files/100807710.pdf | Ministry of Home Affairs, Immigration, Safety and Security (hosted by the Embassy of Japan) | Implementation 1 Apr 2025 | 2026-10-15 | Ghana appears in the African visa-on-arrival list and in the "currently benefiting" list. No passport type is mentioned anywhere. The document has three inconsistent lists |
| New visa requirements | https://namembassy.fi/index.php/consular-matters/do-i-need-visa/implementation-of-new-visa-requirements | Embassy of Namibia, Helsinki | Effective 1 Apr 2025 | 2026-10-15 | 33 newly visa-requiring countries; Ghana not among them |
| Fees and requirements | https://namibiahc.org.uk/fees-and-requirements.php | High Commission, London | Rules dated 2016 and 2019 | 2026-10-14 | "Ghana (Diplomatic and Official only)" on the **exemption** list; Ghana not on the visa-on-arrival list. The page still lists the UK and US as exempt, which ended 1 Apr 2025 |
| Foreign nationals | https://namibiaembassyusa.org/foreign-nationals/ | Embassy, Washington | None | 2026-10-14 | Ghana on the diplomatic/official-only exemption list |

**Assessment:** the London and Washington pages mean ordinary Ghanaian passports are *not exempt*. That is consistent with visa on arrival; it doesn't contradict it. The published record grants visa on arrival, not exemption, so it doesn't misapply a diplomatic exemption.

**Remaining weakness:** the only visa-on-arrival evidence is a fact sheet re-hosted by a foreign embassy, with internally inconsistent lists.

**Recommendation:** keep the record. Replace the source with a ministry-hosted copy when one can be read.

### 1.3 Zimbabwe → Tanzania (not in the dataset)

| Source | Evidence | Accessed |
|---|---|---|
| Tanzania Visa Guidelines §6 (above) | SADC member states exempt; Zimbabwe is not named | 2026-10-14 |
| Harare mission eligibility list (above, 2017) | "Zimbabwe: No Visa Requirement" | 2026-10-15 |
| Harare mission visa page, https://www.zw.tzembassy.go.tz/services/category/visa-information | Visa needed "unless their countries have visa abolition agreement with Tanzania"; visitor's pass up to three months. No country list on the page | 2026-10-15 |
| Kuala Lumpur list | Zimbabwe listed | 2026-10-14 |
| Windhoek and Kigali lists | Zimbabwe **not** listed | 2026-10-14 |

**Assessment:** the evidence favours visa-free, but the only explicit naming of Zimbabwe is the 2017 list and an undated embassy page.

**Recommendation:** leave it unverified. Approving the PR #14 proposal should wait for written confirmation from the department.

### 1.4 Tanzania insurance

| Source | URL | Authority | Date shown | Accessed | Evidence |
|---|---|---|---|---|---|
| Mandatory Inbound Travel Insurance Portal | https://inbound.nicinsurance.co.tz/ | National Insurance Corporation (state-owned), headed "The United Republic of Tanzania" | © 2026 | 2026-10-15 | "Mandatory inbound travel insurance"; "Valid across all of Tanzania — Mainland & Zanzibar". **No effective date, price or exemptions on the page** |
| Zanzibar notice | https://cn.tzembassy.go.tz/resources/view/all-foreigners-excluding-residents-entering-zanzibarsubject-mandatory-inbound-travel-insurance | President's Office, Finance and Planning, Zanzibar (hosted by the Embassy, Beijing) | 5 Aug 2024 | 2026-10-15 | Mandatory for all foreigners except residents entering Zanzibar, effective 1 Oct 2024 |
| Government Notice No. 256 of 2026 | **Not read.** Gazette copy not found; TIRA site not reachable from our tools | Government of Tanzania | 4 Sep 2026 (per secondary sources) | — | — |
| Secondary only: Clyde & Co (16 Sep 2026) and ATTA (24 Sep 2026) | clydeco.com, atta.travel | Law firm; trade association | — | 2026-10-15 | USD 44. Clyde & Co says the regulations state **no commencement date** and exempt EAC and SADC **residents**. ATTA says the start date is to be confirmed and exempts EAC and SADC **citizens** |

**What our site says that isn't officially supported:**

- `/destinations/tanzania` and the guide `tanzania-mandatory-inbound-travel-insurance` state **"from 1 October 2026"** and an EAC/SADC **residents** exemption. Neither is on any official page read.
- They also describe Zanzibar as a "separate" policy. The NIC portal says the NIC policy is valid in Zanzibar too.

**Recommendation:** an editor should change the pages to "reported start date; check the NIC portal" and drop the exemption wording until the Government Notice is read. **No index record carries an insurance condition**, and the new check stops one being added without a supporting source.

### 1.5 Malawi visa fees

| Source | URL | Authority | Date shown | Accessed | Single-entry fee |
|---|---|---|---|---|---|
| Visa fees | https://immigration.gov.mw/visa/visa-fees/ | Department of Immigration | None | 2026-10-14 | **USD 75** ("Fees payable online"); 6-month multiple USD 150; 12-month USD 250; transit USD 50 |
| Visa application process | https://embassymalawi.be/ova_dep/malawi-visa-application-process/ | Embassy of Malawi, Brussels | Modified 25 Feb 2026 | 2026-10-15 | **USD 50**. The 12-month row repeats the 6-month validity and price, an apparent error on the page |
| Online visa service | https://malawiembassy.de/CONSULAR/Malawi-Online-Visa-Service | Embassy of Malawi, Berlin | None | 2026-10-15 | **USD 50**; 12-month USD 250 |

**Assessment:** the department says USD 75 online; two embassies say USD 50. [Guessing] The online figure may include the portal's "convenience fee", which the e-visa portal mentions; nothing read confirms this.

**Recommendation:** `/destinations/malawi` (USD 50, from UK government advice) should say the department lists USD 75 for online applications. No index record carries a fee.

### 1.6 Kenya: primary sources

| Source | URL | Authority | Date shown | Accessed | Evidence |
|---|---|---|---|---|---|
| eTA general information | https://www.etakenya.go.ke/general-information | Directorate of Immigration Services | Cites "Kenya Citizenship and Immigration (Amendment) Rules, 2025" | 2026-10-15 | EAC citizens 180 days (TZ, UG, RW); 90-day list includes ZA, ZW, BW, NA, ZM, MW, MZ, LS, SZ, GH; 60-day African list includes NG |
| Legal Notice No. 93 of 2025 | https://www.embassyofkenya.it/wp-content/uploads/2025/07/Persons-Exempted-from-Electronic-Travel-Authorization.pdf | Cabinet Secretary for Interior (Kenya Gazette Supplement No. 75), published by the Embassy of Kenya, Rome | 30 May 2025 | 2026-10-15 | Same categories and stay limits; Nigeria 60 days |

**Assessment:** all 14 `ke-eta-exempt` records match both sources.

**Change made:** in `content/destinations/kenya.mdx`, the Cliffe Dekker Hofmeyr client alert was replaced with these two official sources. The Kenya Law page for Legal Notice No. 93 wasn't reachable. Legal Notice 121 of 2025, which a search returned, is an unrelated fee exemption.

## 2. Evidence-quality safeguards

The checks live in `src/lib/passport/evidence-quality.ts`. They are read-only: they report issues and never change data.

| Check | Code | Severity | Trigger |
|---|---|---|---|
| Conflicting classifications | `conflicting-classification` | error | Two publishable, in-effect records for a pair state different categories, and neither declares an override |
| Expired or outdated evidence | `evidence-review-due` | warning | Source checked longer ago than the 180-day freshness window |
| | `evidence-expired` | error | Twice the freshness window has passed |
| | `source-document-old` | warning | The source's own date is more than 3 years old |
| | `source-check-in-future` | error | Check date is after the dataset date |
| Missing official sources | `source-missing` | error | Unknown source or additional source |
| | `source-not-official` | error | A `LEAD_ONLY_DOMAINS` site or a non-official source type |
| | `source-not-https` | error | Source URL isn't https |
| Diplomatic exemptions on ordinary records | `diplomatic-exemption-on-ordinary-record` | error | Evidence or conditions mention diplomatic, official or service passports without "all passports" or "ordinary passports", and the category grants access |
| Stay durations | `stay-duration-contradiction` | error | `maxStayDays` contradicts a period stated in the evidence ("90 days", "ninety (90) days", "three months") |
| | `stay-duration-contradiction` | warning | Only the conditions mention another figure |
| | `stay-duration-missing` | warning | No stay recorded for a visa-free, visa-on-arrival or ETA record |
| Duplicates | `duplicate-record` | error | Same passport, destination and source twice |
| | `duplicate-pair` | warning | Two live records that agree |
| Unsupported entry-requirement claims | `unsupported-requirement-claim` | error | Insurance or vaccination in the conditions, but not in the evidence or a cited source's title or note |
| | `unsupported-requirement-claim` | warning | The same for fees, return or onward tickets, and funds |
| | (content) | test | A destination page states mandatory insurance without an official, insurance-specific source. A government domain counts, and so does a state portal confirmed by opening it (`OFFICIAL_PORTAL_HOSTS`) |
| Publishing disputed or unverified records | `unpublishable-record-published` | error | The published set contains anything the gate rejects: disputed, pending, discovered, rejected, superseded, expired, conflicting or missing |

**Tests:** `tests/passport-evidence-quality.test.ts`, 31 tests:

- **Live dataset:**
  - no errors;
  - warnings equal the reviewed baseline in `tests/fixtures/passport-evidence-quality-baseline.json` (new **and** resolved warnings both fail until the baseline is updated);
  - the published set passes the gate;
  - rankings stay unpublished.
- **Synthetic records** prove each check fires and doesn't over-fire.
- **Content:** the list of pages with unsupported insurance claims must equal `["georgia.mdx"]`.
- **Backlog:** the CSV has 50 distinct African pairs and assigns no classification to unverified pairs.
- **Mutation check:** I disabled the diplomatic, conflict, duplicate and requirement checks one at a time; each change made 1–3 tests fail.

**Warnings recorded in the baseline (83), for review rather than automatic fixes:**

- **66 `stay-duration-missing`:** visa-free, visa-on-arrival and ETA records whose source gives no stay period. By source: Seychelles 15, Zimbabwe Category A 12, Uganda 11, Zambia no-visa list 11, Botswana 11, Namibia 2025 fact sheet 3, Zambia visa on arrival 2, Zimbabwe Category B 1.
- **15 `unsupported-requirement-claim`:** Seychelles conditions mention a return ticket and funds, which the cited evidence quote doesn't contain. Add the supporting wording from `sc-ics` to the evidence, or drop it from the conditions.
- **1 `source-document-old`:** `eu-2018-1806`. Cite the consolidated text.
- **1 `stay-duration-contradiction`:** ZW → GE has `maxStayDays` 30 (e-visa), while the conditions cite 90 days for permit holders. These are probably two different routes; confirm.

## 3. Content consistency findings

| Page | Issue | Evidence | Recommended correction (editor) |
|---|---|---|---|
| `/destinations/tanzania`, guide `tanzania-mandatory-inbound-travel-insurance` | 1 October 2026 start date and EAC/SADC residents exemption not officially sourced; Zanzibar described as separate | §1.4 | Mark the date as reported; link the NIC portal; remove or qualify the exemption |
| `/destinations/tanzania` | Says Zimbabweans and Ghanaians are visa-exempt | §1.1, §1.3 | "Listed by Tanzanian missions; official guidelines are inconsistent" |
| `/destinations/malawi` | USD 50 single-entry fee | §1.5 | Add the department's USD 75 online figure |
| `/destinations/georgia` | Mandatory insurance sourced to an insurer (irao.ge) | Content test | Cite the Georgian law or a government page |
| `/destinations/kenya` | Law-firm source | §1.6 | **Done in this branch** |

## 4. Deliverables

All files are in `research/phase-4c4/`.

| File | Contents |
|---|---|
| `Phase-4C4-Evidence-Quality-Report.md` | This report |
| `Phase-4C4-Verification-Backlog.csv` | The next 50 pairs. The 5 P1 pairs are conflicts and disputes; the 27 P2 pairs are Ghana and Malawi as destinations; the 18 P3 pairs are Mozambique and Lesotho |
| `Phase-4C4-Dashboard-Specification.md` | Specification only |

**Code and test changes:**

- `src/lib/passport/evidence-quality.ts` (new)
- `tests/passport-evidence-quality.test.ts` (new)
- `tests/fixtures/passport-evidence-quality-baseline.json` (new)
- `content/destinations/kenya.mdx` (sources only)

## 5. Sources not reached

- **Tanzania Government Notice No. 256 of 2026:** no gazette copy found, and TIRA's site couldn't be reached from our tools.
- **Kenya Law, Legal Notice No. 93 of 2025:** not reachable from our tools.
- **Namibia Ministry of Home Affairs:** no ministry-hosted visa list was read.
