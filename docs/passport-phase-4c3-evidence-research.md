# Phase 4C.3: passport evidence research and data audit

**Branch:** `phase-4c/passport-evidence-expansion`, from `main` at `98da8d4`. It doesn't touch the Phase 4C.2 branch (`phase-4c/evidence-review-automation`).

**Research date:** 14 October 2026.

**Status:** research proposals only. Nothing here is approved, published or written to any database.

## Summary

- **The index is nowhere near ranking thresholds, and this phase doesn't change that.** 640 verified records cover 1.6% of the 39,402 passport–destination pairs. The best-covered passport (Ghana) has 44 of the 189 destinations it needs for the 95% threshold. Even if every proposal here were approved, each sprint passport would gain at most two destinations. Rankings stay unpublished, which is correct.
- **Three published records have new conflicting evidence** that a reviewer should look at before the next release:
  - Ghana → Tanzania.
  - Ghana → Namibia.
  - The undated sources behind Tanzania.
- **28 evidence proposals**, all for human review:

  | Kind | Count | What it means |
  |---|---|---|
  | New pairs | 14 | Pairs with no record in `data.ts` |
  | Corroborations | 13 | A primary or second source for an existing record |
  | Re-verification | 1 | New evidence that disagrees with a published record |

  Four of the 28 are `disputed`; the rest are `pending-verification`.
- **Many official sources we needed couldn't be read.** Ghana, Lesotho, Eswatini, Mauritius, Nigeria and the SADC part of Mozambique's rules either have no country lists on their official pages or the lists didn't render. These are reported below, not guessed.

## 1. Coverage gap report

Figures are from `buildCoverageReport` at dataset `2026.10-s2` (as of 2026-10-10).

| Measure | Value |
|---|---|
| Verified and published records | 640 (0 review-due, 0 disputed, 0 pending) |
| Pairs not yet verified | 38,762 of 39,402 |
| Passports with any data | 15 (the sprint passports) |
| Passports scored for ranking | 0 of 199; 180 required to publish |
| Detected conflicts in `data.ts` | 0 |

**By passport:** each sprint passport has 42–44 verified destinations, about 21–22%.

- Ghana has 44 and needs 145 more to reach the 189 that the 95% threshold requires.
- Lesotho, Malawi, Mozambique, Namibia, Nigeria, Rwanda, Eswatini and Uganda have 43 and need 146.
- Botswana, Kenya, Tanzania, South Africa, Zambia and Zimbabwe have 42 and need 147.

**By destination:** 46 destinations have any record.

- **Most covered:**
  - The 28 states on the EU common visa list.
  - GB, IE, US, CA.
  - ZA, ZM, ZW, KE, RW, UG, BW, SC (14–15 sprint passports each).
- **Tanzania:** 12 of 14 (missing Zimbabwe and Nigeria).
- **Namibia:** 3 of 14.
- **Georgia and the UAE:** 1 each.

**Africa:** 44 of the 54 African destinations have no record:

- **Southern:** AO, LS, MG, MW, MU, MZ, SZ, KM
- **East:** BI, DJ, ER, ET, SO, SS
- **Central:** CM, CF, TD, CG, CD, GQ, GA, ST
- **West:** BJ, BF, CV, CI, GM, GH, GN, GW, LR, ML, MR, NE, NG, SN, SL, TG
- **North:** DZ, EG, LY, MA, SD, TN

Six of the sprint countries are themselves uncovered as destinations (Ghana, Lesotho, Eswatini, Malawi, Mozambique and Nigeria), and Namibia is mostly uncovered. So intra-sprint gaps are the fastest coverage gains.

## 2. Prioritised audit findings

| # | Priority | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| A1 | **High** | **Ghana → Tanzania (published `visa-free`) is contradicted by Tanzania's own guidelines.** Section 7 of the Immigration Services Department's *Tanzania Visa Guidelines* names Ghana among countries that get a visa on arrival. Section 6 exempts Commonwealth countries, Ghana included, and three High Commission lists name Ghana as visa-free. | `tz-isd-visa-guidelines-2026` §6, §7; `tz-hc-namibia`, `tz-hc-kigali`, `tz-hc-kualalumpur` | Reviewer contacts the department. Keep the published record until resolved; if section 7 is confirmed, move it to `disputed` and then supersede it. Proposal `p4c3-gh-tz-isd`. |
| A2 | **High** | **Ghana → Namibia (published `visa-on-arrival`, `na-mha-2025`) isn't supported by the London High Commission.** That page lists Ghana as exempt for diplomatic and official passports only, and doesn't put it on the visa-on-arrival list. | `na-hc-london-fees` | The London page is partly out of date (it still lists the UK and US as exempt), so don't change the record on its strength. Re-read the 2025 ministry fact sheet and find a ministry source. |
| A3 | **High** | **Tanzania's published records rest on an undated embassy page** (`tz-hc-namibia`, medium confidence). A primary department document now exists. | `tz-isd-visa-guidelines-2026` §6 | Review the 11 corroboration proposals. If approved, cite the department guidelines as the primary source and keep the embassy page as additional. |
| A4 | Medium | **Absent-from-list records are weaker evidence.** There are 17: UG, RW, NG → ZA; 10 passports → US; ZA, NA, NG → UG; ZW → GE. They depend on the list being complete. | `data.ts` | Look for positive statements (a visa-required list, or a portal eligibility result) at the next review. |
| A5 | Medium | **Undated or unclear sources:** `ug-exempt` (no date or stay period), `bw-embassy-us`, `tz-hc-namibia`, `za-dirco-exempt` (embassy, dated 2024-03-11). `na-mha-2025` is a ministry fact sheet re-hosted by the Embassy of Japan. | `data.ts` | Replace each with a department or portal source when one is readable. |
| A6 | Medium | **`us-suspension-2026` points to `adoption.state.gov`.** The page sits under the `/content/travel/` path, which State Department subdomains share. A search also returns the same page on `childabduction.state.gov`. | Web search, 14 Oct 2026 | Confirm the same path on `travel.state.gov`, then switch the URL in a reviewed change. The category is unaffected. |
| A7 | Medium | **`eu-2018-1806` cites the 2018 adopted text**, not the consolidated regulation. | `data.ts` note | Re-check Annex I against the consolidated text on EUR-Lex. |
| A8 | Low | **All 23 sources are due for review on 2027-04-08**, except the three Georgia and UAE sources (2027-03-23). Nothing is overdue yet. | `reviewDueOn` | Spread the re-checks over the next two months so they don't all fall due together. |
| A9 | Low | **Source monitoring is switched off for every source.** No terms or robots review has been recorded. | `monitor/config.ts` | Complete the terms reviews for the Tanzania, Malawi and Zambia sources first: their documents change without notice. |

## 3. Official immigration source registry

All sources were opened on **2026-10-14**. The full records, including notes and relevant pairs, are in `research/phase-4c3/sources.json`.

- **Access:** "read" means the relevant statement or list was read in full; "partial" means the page was read but had no usable country list; "blocked" means the page couldn't be read.
- **Date shown:** a date only appears where the source itself displays one to readers.

| Source id | Authority | Jurisdiction | Type | Date shown | Access |
|---|---|---|---|---|---|
| `tz-isd-visa-guidelines-2026` | Immigration Services Department | TZ | government | none shown (PDF metadata: created 2026-09-05) | read |
| `tz-hc-kualalumpur` | Tanzania High Commission, Kuala Lumpur | TZ | embassy | none | read |
| `tz-hc-kigali` | Tanzania High Commission, Kigali | TZ | embassy | none | read |
| `na-embassy-us-exempt` | Namibian Embassy, Washington | NA | embassy | none | read |
| `na-hc-london-fees` | Namibian High Commission, London | NA | embassy | none (text cites 2016 and 2019 rules) | read |
| `mw-evisa-category-one` | Dept. of Immigration and Citizenship Services, e-Visa portal | MW | official portal | none | read |
| `mw-evisa-category-two` | same | MW | official portal | none | read |
| `mw-evisa-notice-2026` | same | MW | official portal | none (effective 24 Feb 2026) | read |
| `mw-immigration-visa-fees` | Department of Immigration | MW | government | none | read |
| `mz-hc-uk-visa` | Mozambique High Commission, London | MZ | embassy | none (mentions platform launch 11 Feb 2026) | read |
| `gh-gis-evisa-launch-2026` | Ghana Immigration Service | GH | government | 2026-05-28 | partial |
| `gh-gis-permits-visas` | Ghana Immigration Service | GH | government | none | partial |
| `gh-isd-free-visas-2026` | Information Services Department | GH | government | none | partial |
| `gh-evisa-portal` | GIS and Ministry of Foreign Affairs | GH | official portal | none | partial |
| `gh-mission-pretoria` | Ghana High Commission, Pretoria | GH | embassy | none | **blocked** (placeholder page) |
| `ls-mha-do-i-need-a-visa` | Ministry of Home Affairs | LS | government | none | partial |
| `sz-gov-visa` | Government of Eswatini | SZ | government | none | partial |
| `sz-evisa-guidelines` | Eswatini e-Visa portal | SZ | official portal | none | partial |
| `mu-pio-visa-requirements` | Passport and Immigration Office | MU | government | none | partial |
| `ng-mission-libreville` | Nigerian Embassy, Libreville | NG | embassy | none | partial |
| `mw-immigration-visa` | Department of Immigration | MW | government | none | partial |

**Not used as evidence (leads only):**

- **Wikipedia, legit.ng, visasnews, passportindex and tourism-trade press:** commercial or secondary sources.
- **Graphic Online's 3 December 2025 report of a Ghana Ministry of Foreign Affairs visa-waiver list:** a newspaper. The ministry's own notice wasn't found.

## 4. Prioritised verification backlog

| Rank | Work item | Why first | Blocker |
|---|---|---|---|
| 1 | Resolve A1 (Ghana → Tanzania) and the three disputed Tanzania/Namibia proposals | They affect published records | Needs a reply from the Tanzanian department, or a dated notice |
| 2 | Review the 13 corroborations and 10 pending new pairs in this package | Ready now; they raise source tiers and fill Namibia | Reviewer time |
| 3 | **Ghana** as a destination (14 pairs) | It's a sprint country; the 2026 free-entry policy is announced but its form is unclear | The GIS news item says "visa-free"; the ISD article and the portal suggest a fee-free e-visa or ETA. Need the portal FAQ answer or a GIS notice |
| 4 | **Malawi** for the 13 sprint passports not on either category list | Malawi is a sprint country | The `immigration.gov.mw` lists of visa-required and non-visa-required nationals aren't on the page. Need a readable non-visa-required list |
| 5 | **Mozambique** for SADC passports | It's a sprint country | The official exemption list covers only the 2023 unilateral exemptions; the SADC bilateral exemptions need a SENAMI source |
| 6 | **Lesotho, Eswatini** (14 pairs each) | They're sprint countries | Official pages name no countries. Try the high commissions in Pretoria, London and Washington |
| 7 | **Nigeria** for non-ECOWAS sprint passports | It's a sprint country | Need the Nigeria Immigration Service e-visa eligibility list |
| 8 | **Mauritius**, then **Egypt, Ethiopia, Morocco, Senegal** | They have destination guides on the site with no index data | The Mauritius country-wise table didn't render; others not started |
| 9 | Remaining 34 African destinations | Africa-first rule | Not started |
| 10 | Other regions: the Gulf (AE, QA), Asia (IN, TH, SG, JP), the Americas (BR, MX), Oceania (AU, NZ) | They have site guides | Not started |
| 11 | Replace absent-from-list and undated sources (A4, A5); fix the A6 and A7 URLs | Evidence quality | None |

## 5. Structured evidence proposals

The 28 proposals are in `research/phase-4c3/package.ts`; generated copies are in `proposals.json`.

| Destination | Proposals | Proposed category | Status |
|---|---|---|---|
| Tanzania | ZW (new) | visa-free (SADC) | **disputed**: Windhoek and Kigali lists omit Zimbabwe; Kuala Lumpur lists it |
| Tanzania | NG (new) | visa-on-arrival (§7 names Nigeria) | **disputed**: §6 Commonwealth exemption |
| Tanzania | GH (re-verification) | visa-on-arrival | **disputed**: published as visa-free; see A1 |
| Tanzania | ZA, BW, NA, ZM, MW, MZ, LS, SZ (SADC); KE, UG, RW (EAC) | visa-free (corroboration) | pending; the department source supports the existing records |
| Namibia | ZA, ZW, BW, ZM, MW, MZ, LS, KE, TZ (new) | visa-free | pending; two missions agree; medium confidence |
| Namibia | SZ (new) | visa-free | **disputed**: London lists Eswatini; Washington omits it |
| Namibia | UG, RW (corroboration) | visa-on-arrival | pending |
| Malawi | NG (new) | evisa (Category One: visa or prior authorisation before departure) | pending; high confidence |
| Mozambique | GH (new) | eta, 30 days | pending; embassy source |

Each proposal records the following:

- the category, conditions and evidence as read;
- the evidence basis: listed, absent from a list, or group membership (SADC, EAC or Commonwealth rules, which a reviewer must map to the passport);
- the supporting and conflicting sources;
- the confidence;
- the existing record it touches;
- reviewer notes.

## 6. Data-quality findings and recommended corrections

| # | Type | Finding | Recommended correction |
|---|---|---|---|
| D1 | Duplicates | `data.ts` has none: the validator found no duplicate (passport, destination, source) and no conflicting pairs. The Tanzania embassy lists name Malawi twice. That doesn't matter for our data. | None |
| D2 | Inconsistency between a page and the data | `/destinations/tanzania` says Zimbabwean citizens are on the visa-exempt list, but the index has no Zimbabwe → Tanzania record. Sources disagree (proposal `p4c3-zw-tz-isd`). | Soften the page wording to "listed by some official sources" until resolved, or add the record once it's approved |
| D3 | Inconsistency between a page and the data | `/destinations/tanzania` says Ghanaian citizens are visa-exempt. The department's §7 lists Ghana for visa on arrival. | Same as A1 |
| D4 | Inconsistency between a page and the data | `/destinations/namibia` names South African, Zimbabwean, Zambian and Kenyan passports as visa-exempt, but the index has no record for them. | Approve the Namibia proposals, or link the page to "not yet verified" |
| D5 | Unverified page claim | `/destinations/tanzania` states a mainland inbound-insurance requirement from 1 October 2026. I didn't find or read a source for it in this phase, and the index's Tanzania conditions don't mention it. | Verify against an official Tanzanian notice before the next content review |
| D6 | Stale figure | `/destinations/malawi` gives a USD 50 single-entry visa (UK government advice). The Malawi Department of Immigration fees page lists USD 75 for a single-entry visa paid online. | Show both, or cite the department page; check whether the on-arrival fee differs |
| D7 | Weak source on a page | `/destinations/kenya` cites a law firm's client alert (Cliffe Dekker Hofmeyr) for the eTA exemptions. | Cite `etakenya.go.ke` (`ke-eta-exempt`) only |
| D8 | Weak source on a page | `/destinations/zambia` cites the Zambia Tourism Agency for visa information. | Cite the Department of Immigration pages already used in the index (`zm-no-visa`, `zm-voa`, `zm-prior`) |
| D9 | Outdated source on a page | `/destinations/ghana` cites the GIS visas page (`gis.gov.gh/visas/`). The GIS "Permits and visas" page we read (`gis.gov.gh/?p=2142`) still describes visa on arrival with fees for AU nationals, which predates the May 2026 policy. | Keep the GIS launch item (28 May 2026) as the primary source |
| D10 | Inconsistent source | Malawi's Category One and Category Two lists both include Burkina Faso, Cameroon and Sri Lanka. | No index impact; report to the Malawi department if a contact route exists |
| D11 | Inconsistent source | Tanzania's guidelines put Burkina Faso in both §7 (visa on arrival) and §8 (no visa on arrival), and list Commonwealth members in §7 despite the §6 exemption. | Treat §6 group rules as needing confirmation for Commonwealth members |
| D12 | Source host | `us-suspension-2026` is on `adoption.state.gov` (A6). | Switch to `travel.state.gov` after confirming the same path |
| D13 | Outdated legal text | `eu-2018-1806` cites the adopted 2018 text (A7). | Cite the consolidated text |

**Broken links:** I didn't probe every published source URL in this phase. These are the ones I opened on 14 October 2026:

| Source | Result |
|---|---|
| `tz-hc-namibia` | Read; loads |
| Ghana Pretoria mission page | Placeholder, no content |
| Lesotho e-visa link | Path says applications are suspended |

## 7. Import-ready research files

All files are in `research/phase-4c3/`.

| File | Contents |
|---|---|
| `package.ts` | The source of truth: sources and proposals, typed |
| `sources.json`, `proposals.json` | Generated copies |
| `submissions.import.json`, `submissions.import.csv` | 28 rows for `passport_evidence_submissions` |

**How the rows match the staged schema** (PR #8 migrations; read-only reference, never applied):

- `passport_code` and `destination_code` are ISO **alpha-3**, as `submit_evidence` requires. The site uses alpha-2; codes are converted through the jurisdiction registry.
- `rule_id` uses the site's existing `${passport}-${destination}-${sourceId}` format (alpha-2).
- `source_url` is https.
- `observed_at` is the date the source was read.
- `source_document_date` is only set where the source shows a date.
- `rationale` is at least 20 characters and begins with "Research proposal … Not approved."
- `ai_assisted` is `true`.

**How the files mark themselves as unapproved:**

- Every row carries `status: "draft"`, `research_status: "RESEARCH_PROPOSAL_NOT_APPROVED"` and `proposed_verification` (`pending-verification` or `disputed`).
- Each file has a header with the same marker.

**Columns that aren't in the table:** `research_proposal_id`, `research_status`, `proposed_verification` and `confidence` are for the reviewer and must be dropped or mapped on import.

**Importing is a separate, authorised step:**

1. It goes through the `submit_evidence` RPC in the Phase 4C.2 workflow (that RPC sets `status` to `submitted`).
2. A named researcher account submits the rows.
3. A different reviewer reviews them.

Nothing in this branch connects to Supabase.

**Regenerate the files:**

```bash
npm run passport:research-export
```

## 8. Safeguards and tests

`src/lib/passport/evidence-research.ts` validates the package. It rejects:

- a proposal marked `verified`;
- the `unknown` category;
- a cited source that was blocked or only partly read;
- a source that isn't from the destination's own authority;
- a commercial index (the `LEAD_ONLY_DOMAINS` list);
- a check date later than the package date;
- a disputed proposal that doesn't name its conflict;
- a "new pair" that already exists in `data.ts`;
- a re-verification that isn't marked disputed;
- duplicate proposals;
- rows the RPC would refuse.

`tests/passport-evidence-research.test.ts` (17 tests) also checks:

- `data.ts` is unchanged: 640 records, version `2026.10-s2`;
- no research source id collides with a published source;
- the committed export files match the generator.

**What stays unchanged:**

- `data.ts`;
- published pages and scores;
- the ranking gate;
- Supabase policies and production data;
- the Phase 4C.2 branch.
