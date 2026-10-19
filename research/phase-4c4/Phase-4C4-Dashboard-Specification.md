# Evidence-quality dashboard: specification

**Status:** specification only.

- No page, route, component, API or authentication change is part of Phase 4C.4.
- Building it is a separate, approved task.
- It belongs inside the existing reviewer area from Phase 4C.2 (PR #13), behind the same researcher, reviewer and admin roles.
- It is never a public page.

## 1. Purpose and users

**Purpose:** show reviewers where the World Passport Index evidence is strong, weak, stale or contested, and what to research next. It must make one thing hard to miss: unverified is not the same as visa-required, and ranking stays unpublished until the thresholds are met.

| User | Main question |
|---|---|
| Reviewer | What needs my decision today (disputes, review-due records, pending proposals)? |
| Researcher | Which pairs should I research next, and where do I start? |
| Admin or founder | How far are we from publishing rankings, and is quality getting better or worse? |

## 2. Data sources (read-only)

| Data | Where it comes from | Refresh |
|---|---|---|
| Records, sources, dataset version | `ruleRecords`, `sources`, `DATASET` in `src/lib/passport/data.ts` | Per deployment |
| Publication decisions | `publicationDecisions()` in `verification.ts` | Per deployment |
| Coverage and readiness | `buildCoverageReport()`, `passportReadiness()` | Per deployment |
| Quality issues | `auditEvidenceQuality()`, `auditPublishedSet()` in `evidence-quality.ts` | Per deployment |
| Proposals and review state | Phase 4C.2 review queue (Supabase `passport_evidence_submissions` and reviews), read through the existing server bridge | Live; read-only for this dashboard |
| Backlog | `research/phase-4c4/Phase-4C4-Verification-Backlog.csv`, later a table | Per deployment |

The dashboard never writes. Every action button links to the existing review workflow.

## 3. Layout

On desktop, a single page in three bands; at 375 px everything stacks into one column.

```
┌ Header: dataset version · as-of date · methodology · "Rankings unpublished: 0 / 180 passports scored" ┐
├ Band A: headline tiles (6) ─────────────────────────────────────────────────────────────────────────┤
├ Band B: Disputed records │ Needs review                                                              ┤
├ Band C: Country progress (table + matrix) │ Source freshness & confidence │ Research priorities     ┤
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Panels

### 4.1 Headline tiles (Band A)

| Tile | Value | Definition | Shown alongside |
|---|---|---|---|
| Verified coverage | `published / (jurisdictions × (jurisdictions − 1))` as a % | Only `verified` and `review-due` records that pass the gate | Count, e.g. 640 / 39,402 |
| Disputed | Number of pairs | Records with status `disputed`, plus pairs with an open conflict | Link to Panel 4.2 |
| Needs review | Number of records | `review-due` plus pending proposals plus quality errors | Link to Panel 4.3 |
| Stale sources | Number of sources | `evidence-review-due` plus `evidence-expired` | Oldest check date |
| Ranking readiness | `scoredPassports / required` | `passportReadiness()` at the methodology threshold | Text says "Rankings stay unpublished until 180 passports reach 95%" |
| Quality errors | Number | `auditEvidenceQuality` errors | Must be 0 for a release; red when above 0 |

Rules for the tiles:

- No tile combines unverified and verified counts.
- "Unknown" is never shown as "visa required".

### 4.2 Disputed records

One row per pair:

- passport → destination;
- the published category (if any);
- the competing categories with their source ids and tiers;
- the date each source was checked;
- how long the dispute has been open;
- the assigned reviewer.

Sort by: published records first, then pairs touching sprint passports, then age.

A row opens the existing review screen. **No resolve button.** Resolution happens in the review workflow, with two people, as today.

### 4.3 Evidence requiring review

A tabbed table:

1. **Review-due:** records past the 180-day freshness window, grouped by source, so one re-check clears many records.
2. **Pending proposals:** from the 4C.2 queue, with status (`draft`, `submitted`, `changes_requested`) and age.
3. **Quality issues:** `auditEvidenceQuality` output grouped by code. Errors come first, and the baseline warnings are flagged as "known".

### 4.4 Source freshness and confidence

**Scatter plot:**

- Horizontal axis: days since `checked`.
- Vertical axis: source tier (legislation 1, government or portal 2, embassy 3).
- Point size: number of records relying on the source.
- Colour: record confidence, high or medium.
- A vertical line marks the 180-day window.

**Table view** (an accessible alternative to the chart):

| Column | Meaning |
|---|---|
| Source id, publisher, type | What the source is |
| `sourceUpdated` | Shown as "not shown" when the source has no date; never estimated |
| `checked` | Date we read it |
| Review due | Date re-verification falls due |
| Records | How many records rely on it |
| Absent-from-list records | How many rest on the source's silence |
| Hosted by | Present when a third party hosts the source |

**Flags:**

- third-party hosted, such as `na-mha-2025` hosted by the Embassy of Japan;
- unusual host, such as `us-suspension-2026` on adoption.state.gov;
- older than 3 years.

### 4.5 Country-by-country verification progress

1. **Passport table:** one row per passport, showing:
   - verified count and % of 198;
   - remaining to the 95% threshold;
   - disputed and pending counts;
   - a "ready for scoring" badge.

   Defaults:
   - **Filter:** region = Africa, with sprint passports pinned.
   - **Sort:** % ascending.
2. **Destination table:** the same columns from the destination's side. It shows which destinations have zero records.
3. **Matrix:** sprint passports against African destinations.

   | Cell state | Colour | Glyph |
   |---|---|---|
   | Verified | Category colour (from `categoryMeta`) | — |
   | Disputed | Hatched | — |
   | Pending | Outline | — |
   | Not verified | Grey | "?" |

   Never fill a not-verified cell with a category colour.

### 4.6 Outstanding research priorities

The backlog sorted by priority (P1 conflicts with published records, P2 sprint destinations, P3 the rest). Columns:

| Column | Notes |
|---|---|
| Rank | — |
| Pair | — |
| Status | — |
| Reason | — |
| Official research lead (link) | — |
| Known blocker | — |
| Assignee | Added when the backlog moves into the database |

## 5. Behaviour and accessibility

- **Access:** behind existing reviewer authentication. No public route, no sitemap entry, `noindex`.
- **Read-only:** the dashboard makes no direct writes. Links go to existing workflow screens.
- **Colour:** reuse the category colours from `categoryMeta`, which already meet WCAG AA against white text. Every status also has a text label and a glyph.
- **Charts:** each chart has a table view. No information is carried by colour alone.
- **Empty states:** say "Not yet verified", never "No visa access".
- **Freshness of the page itself:** show the dataset version and the time it was generated.

## 6. Acceptance criteria (for the future build)

1. With the current dataset, the tiles show the following:

   | Tile | Value |
   |---|---|
   | Verified coverage | 1.6% (640 / 39,402) |
   | Ranking readiness | 0 / 180 |
   | Quality errors | 0 |
   | Disputed | 0 |

2. Adding a `disputed` record makes it appear in Panel 4.2, and it doesn't count towards verified coverage.
3. A source older than 180 days appears in Panel 4.3, tab 1, and in the freshness chart beyond the line.
4. No panel renders a category for a pair without a published record.
5. An unauthenticated request to the dashboard route is redirected or refused, as with other reviewer routes.
6. The page passes the existing axe accessibility checks at 375 px and at desktop width.

## 7. Out of scope

- Editing, approving or publishing evidence.
- Changing roles or authentication.
- Public coverage pages beyond what already exists.
- Any ranking display.
