# World Passport Index: data provenance and verification (Phase 2A)

This is how passport data is identified, sourced, verified, published and audited.

Phase 2A changed **no visa rule, score, ranking, methodology value, URL or page**. The published output
for dataset `2026.10-s2` under methodology `0.1` is byte-for-byte reproducible from
`tests/fixtures/passport-index-snapshot.json`.

## Modules

| File | Role |
|---|---|
| `src/lib/passport/jurisdictions.ts` | Canonical jurisdiction registry: one frozen table of the 199 jurisdictions |
| `src/lib/passport/types.ts` | `Source`, `AccessRule`, `VerificationStatus`, `EvidenceBasis`, `RuleRevision`, source tiers |
| `src/lib/passport/data.ts` | Sources, `ruleRecords` (every record), `rules` (publishable subset), `DATASET` manifest |
| `src/lib/passport/verification.ts` | Lifecycle, transitions, freshness, conflicts, publication gate |
| `src/lib/passport/provenance.ts` | Verification processes, source ledger (git commits), full `RuleRecord` view |
| `src/lib/passport/validation.ts` | Registry and dataset integrity checks |
| `src/lib/passport/coverage.ts` | Machine-readable coverage report |
| `src/lib/passport/monitoring.ts` | Source-monitoring decision logic. It is design only, with no fetching (see `passport-source-monitoring.md`) |
| `reports/passport-coverage.json` | Committed coverage report. Regenerate it with `npm run passport:coverage` |

## Canonical jurisdiction registry

- **One table.** It lists code, ISO alpha-3, ISO numeric, name, slug, region, AU subregion and type for all 199 jurisdictions.
  - Before Phase 2A, names came from `Intl.DisplayNames` at runtime, and slugs were derived from those names.
  - That meant a Node/ICU update could rename a country and move its public URL (for example `turkiye` or `trinidad-tobago`).
  - Names and slugs are now written out explicitly, frozen from the Phase 1A snapshot.
- **Identifiers:**
  - `code` is the ISO 3166-1 alpha-2 code.
  - Kosovo is the exception: `XK`, `identifierScheme: "user-assigned"`, with no alpha-3 or numeric code. It is not invented: ISO 3166-1 doesn't include Kosovo.
  - Alpha-3 and numeric codes were cross-checked against Debian iso-codes (pycountry 26.2.16).
- **Special cases:**

  | Jurisdiction | Treatment |
  |---|---|
  | Hong Kong, Macao | `type: "sar"`, `sovereign: "CN"`. Not sovereign states. Each issues its own passports and runs its own immigration control. |
  | Taiwan | ISO TW/TWN/158, `partially-recognised` |
  | Holy See, Palestine | UN observer states |

  Every non-UN-member has a status note.
- **Special-entry pairs:** CN↔HK, CN↔MO, CN↔TW.
  - Travel on these routes uses permits, not a passport and visa.
  - A rule for one of these pairs must explain the permit in `conditions`. The validator and the publication gate enforce this.
  - No such rules exist yet.
- **Validation (`validateRegistry`) rejects:**
  - duplicate codes, slugs, alpha-3 or numeric codes;
  - ISO-labelled codes that aren't ISO, and user-assigned codes that are undocumented;
  - slugs that don't match the name;
  - SARs without a sovereign;
  - African jurisdictions without an AU subregion.

## Provenance schema

The existing `Source` and `AccessRule` types were extended with **optional** fields only, so existing consumers are unchanged.

| Requirement | Where |
|---|---|
| Passport and destination jurisdiction | `AccessRule.passport` / `destination` (registry codes) |
| Access category | `AccessRule.category` |
| Source id and official URL | `AccessRule.sourceId` → `Source.url`; supporting sources in `additionalSourceIds` |
| Issuing authority / publisher | `Source.publisher`, `Source.authorityJurisdiction`, `Source.hostedBy` |
| Evidence | `AccessRule.evidence` (quote or list heading) and `evidenceBasis` (`listed` / `absent-from-list`) |
| Date checked | `Source.checked`: the date we read it. A reachable URL never updates it. |
| Source publication or update date | `Source.sourceUpdated`, only when the source shows one. 13 of 23 sources show none; those stay empty. |
| Effective date | `AccessRule.effectiveFrom`, `effectiveTo` |
| Verification status and confidence | `AccessRule.verification` (`VerificationStatus`), `confidence` |
| Conditions, stay, limitations | `conditions`, `maxStayDays` |
| Reviewer / process | `RuleRevision.process` → `verificationProcesses` |
| Revision history | `sourceLedger` (creation commit per source), `ruleRevisions` (later changes); combined in `toRuleRecord()` |

**Honest gaps**

- Every current rule was created by an AI-assisted single-researcher process in commit `5860cd4` (sprint 1) or `15e3c1b` (sprint 2).
- No rule has had an independent second review. `independentReview` is `false` throughout.

## The four states readers must never confuse

| State | Meaning | Counted in scores? |
|---|---|---|
| **Unknown** | No record for the pair | Never. It is shown as "Not yet verified". |
| **Missing evidence** | A record exists but is `discovered` or `pending-verification` | No |
| **Stale evidence** | Verified, but the check is older than the freshness window (`review-due`) | Yes, flagged, as methodology v0.1 defines freshness as a flag |
| **Verified restriction** | `visa-required` or `restricted`, verified on an official source | Yes. `absent-from-list` marks the 17 rules inferred from an exhaustive list. |

## Verification workflow

```
discovered → pending-verification → verified → review-due → superseded | rejected
                        ↘ disputed ↙          ↘ disputed
```

**Allowed transitions** (`TRANSITIONS`; `superseded` and `rejected` are terminal):

| From | To |
|---|---|
| `discovered` | `pending-verification`, `rejected` |
| `pending-verification` | `verified`, `disputed`, `rejected` |
| `verified` | `review-due`, `disputed`, `superseded` |
| `review-due` | `verified` (re-verified), `disputed`, `superseded`, `rejected` |
| `disputed` | `verified`, `superseded`, `rejected` |

**What `transition()` requires**

- **To `verified`:**
  - the rule's own source, at tier 1–3;
  - evidence;
  - a real check date on or before the decision.
- **To `superseded`:** the replacing rule's id.
- **To `rejected` or `disputed`:** a note.
- **Every transition:** a process id and a reference. It produces a `RuleRevision`.

### Source priority

| Tier | Type | Use |
|---|---|---|
| 1 | Legislation, official gazette | Evidence |
| 2 | Destination immigration authority, official e-visa/ETA portal, government ministry | Evidence |
| 3 | The destination's embassy or consulate | Evidence. Usually medium confidence, and often undated. |
| Leads | Commercial indexes, IATA Timatic, visa agencies, Wikipedia, press | Never stored as a `Source`. They may only point to an official page. `LEAD_ONLY_DOMAINS` blocks them. |

When a document is republished by a third party (for example Namibia's fact sheet hosted by the Embassy of Japan), `hostedBy` records that.

### Rules for hard cases

| Case | Rule |
|---|---|
| Conflicting evidence | Same pair, different categories, neither declaring `overrides` → **disputed**. Both records are held out of publication; the pair shows as not yet verified. We never pick the favourable answer, even when one source has a higher tier. A reviewer resolves it with `transition()`. |
| Corroboration | Same pair, same category from several sources → published; the destination still counts once. |
| Deliberate precedence | A temporary measure (e.g. a visa suspension) declares `overrides: [ruleId]`. The overridden rule is dropped, with no conflict. |
| Duplicate records | One source may state one category per pair. A second record with the same id fails validation. |
| Policy change | Add the new rule with `effectiveFrom`; mark the old one `superseded` with `supersededBy` and `effectiveTo`. Record a `PolicyChange` only with an official source. |
| Source unavailable | The rule stays at its last verified state and is flagged. It is never removed because a site is down. After the freshness window it becomes review-due. |
| Unverifiable claim | It stays `pending-verification` or is `rejected`. Never published. |

## Publication safeguards

`rules` = `publishableRules(ruleRecords, sources, DATASET.asOf)`. A record is published only if **all** of these hold:

- its effective status is `verified` or `review-due`;
- its source and any supporting sources are registered and official;
- it is in effect at `DATASET.asOf`;
- it is not in an unresolved conflict;
- it has not been overridden;
- it has evidence;
- if it is a special-entry pair, it explains the permit.

**Evaluated at a fixed date.** Eligibility uses the dataset date (`DATASET.asOf`), not the build clock, so a dataset version always produces the same scores.

**Unchanged engine rules:**

- each destination counts at most once;
- unknown never counts as zero;
- `conditional` is never a mobility category;
- scores stay null below 95% coverage;
- no ranking until 90% of passports are scored and the methodology is published.

**Effect today:** all 640 records are eligible, and the gate returns the same objects in the same order.

## Coverage (dataset 2026.10-s2, at 2026-10-10)

| Measure | Value |
|---|---|
| Pairs in the universe | 39,402 |
| Verified | 640 (1.62%) |
| Review-due, disputed, pending | 0 |
| Unknown | 38,762 |
| Passports with data | 15 (max coverage 22.2%) |
| Destinations with data | 46 |
| Passports scored | 0 |
| Ranking | Not published |
| Next review due | 23 March 2027 (Georgia and UAE sources); 8 April 2027 for the rest |

The report states that coverage is incomplete. `claims.completeWorldwideCoverage` can only become true when no pair is unknown, pending or disputed.

## Migration and rollback

There's no database, so the migration is in code.

**Deterministic transformation:**

- The registry table was generated once from the runtime registry's output (`registry-before.json`). The output is identical: the same order, names, slugs and regions.
- Optional provenance fields were added to sources (`authorityJurisdiction`, one `hostedBy`) and to 17 rules (`evidenceBasis`).
- One rule (`ZW-GE-ge-evisa`) gained `additionalSourceIds: ["ge-visa-permit-list"]`, so the previously orphaned Georgia list is cited for the conditions it supports.

**Equivalence is proved by tests:**

- `passport-index-snapshot.json` was generated before the change and matches after it.
- The registry matches the Phase 1A snapshot.
- The sitemap, noindex pages and rendered passport pages are unchanged (preservation harness).

**Rollback:**

1. `git revert <phase-2a commit>`. No data store, environment variable or URL needs touching.
2. The fixtures and the report added in Phase 2A are removed by the same revert.

**Forward data changes:**

1. Edit `data.ts`.
2. Bump `DATASET.version` and `asOf`.
3. Run `npm run passport:coverage`.
4. Regenerate `passport-index-snapshot.json` (`npm run harness:baseline`) only when the change is approved.
5. Review both diffs.
