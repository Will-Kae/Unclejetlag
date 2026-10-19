# Phase 4C.7: evidence-data integrity report

**What this report covers:** the data shown by the Passport Evidence Review Workspace.

**Scope:**
- Read-only presentation of existing repository data.
- **No published classification, research proposal, Supabase table, policy, role or deployment was changed.**

## 1. Where every figure comes from

| Shown in the workspace | Source in the repository | How it is checked |
|---|---|---|
| Verified published records (640) | `rules` in `src/lib/passport/data.ts` (the publication gate's output) | Test: equals `rules.length`; dataset version and 640 records unchanged |
| Coverage (1.62% of 39,402 pairs), ranking status (not published; 0 of 180 needed) | `buildCoverageReport()` | Test: equals the coverage report |
| Research proposals (28: 24 pending, 4 disputed) | `research/phase-4c3/package.ts` | Test: counted from the package; pending plus disputed equals the total |
| Proposal checks (8 blocking findings, 1 review finding) | `assessEvidenceQuality()` in `proposal-quality.ts` | Test: equals the utility's output |
| Evidence-quality errors (0) and warnings (98) | `auditEvidenceQuality()` in `evidence-quality.ts` over the published dataset and its sources | Test: equals the utility's output |
| Resolution-plan priorities (P0–P2) | `research/phase-4c5/Phase-4C6-Evidence-Resolution-Plan.md` | Typed mirror `resolution-plan.ts`; a test compares every field with the Markdown table and the plan date |
| Backlog priorities (P1–P3), reasons, leads, blockers | `research/phase-4c4/Phase-4C4-Verification-Backlog.csv` | Typed mirror `backlog.ts`; a test compares all 50 rows with the CSV |

The mirrors exist because Next.js doesn't bundle Markdown or CSV files for server rendering. If anyone edits the plan or the CSV without regenerating its mirror, the tests fail.

## 2. Cases (78)

A **case** is either a passport–destination pair, or a destination-wide topic from the resolution plan.

| Kind | Count | Where they come from |
|---|---|---|
| Pair cases | 74 | Every pair named by a proposal, a backlog row or a plan entry |
| Topic cases | 4 | Tanzania insurance, Malawi fee, Ghana entry policy for African passports, Malawi exemption list |

**Tests check that:**
- every proposal appears in exactly one case;
- every backlog row appears in exactly one case;
- every plan entry appears in exactly one case;
- case IDs are unique.

### Statuses, with the rule used for each

| Status | Count | Rule |
|---|---|---|
| Published (verified) | 13 | The pair has a published record and no plan entry or disputed proposal |
| Published, under re-verification | 2 | A published record exists **and** a disputed proposal or a plan entry questions it: Ghana → Tanzania and Ghana → Namibia. The published value is shown unchanged |
| Pending verification | 11 | No published record; a proposal cites a source that was read in full; nothing disputed |
| Disputed | 3 | No published record; a proposal is disputed or lists conflicting sources: Zimbabwe → Tanzania, Nigeria → Tanzania, Eswatini → Namibia |
| Blocked: evidence unavailable | 49 | No published record; no proposal citing a readable source; a documented blocker exists (a plan entry or a backlog blocker) |
| Not verified | 0 | No evidence and no documented blocker. None currently |

"Disputed cases" on the overview counts both the disputed and the under-re-verification statuses, which comes to 5.

### Evidence quality per case

| Level | Rule |
|---|---|
| Blocker | Any proposal-quality blocker, or an evidence-quality or research-validation error, on the case |
| Needs review | Other findings exist |
| No automated findings | Records or proposals exist and no check flags them. Human review is still required |
| Not assessed | Nothing to check: no proposal and no published record |

## 3. Safeguards against misleading data

**Published versus proposed:**
- The published classification always comes from `rules`, and a test enforces this for every case.
- A proposal is labelled "proposed, not approved".
- Where proposals disagree, the case shows "Multiple proposals"; a test proves it never picks one.

**Missing values:**

| Situation | Shown as |
|---|---|
| No published record | "Not verified" |
| No readable evidence | "Evidence unavailable" |
| A source shows no date | "Not shown on source" |

- Dates found only in a file's metadata are labelled "File metadata date (not shown to readers)".

**Evidence history:**
- Built only from dates present in the repository: when each source was read, the date each source shows, the research package date, and the plan date.
- Backlog rows have no date, so they show "Date not recorded".
- The page states it is **not an immutable audit log** and that no review decisions have been recorded.

**Reviewer recommendations:**
- Taken from existing reviewer notes on proposals and the plan's "current defensible position" and "release gate" columns.
- Labelled with their origin, and marked read-only.

**No automatic resolution:**
- Priorities come from the plan first, then the backlog.
- Nothing in the code chooses between conflicting sources.

**Rankings:** shown as "Not published". The workspace never computes or shows a ranking.

## 4. Known data caveats (not fixed here, by design)

1. **Two priority scales.** The plan uses P0–P2 and the backlog uses P1–P3. When both exist for a case, the workspace uses the plan's priority and always shows the origin. A backlog "P1" isn't directly comparable to a plan "P1".
2. **98 evidence-quality warnings.** These are the current branch's reviewed baseline (`tests/fixtures/passport-evidence-quality-baseline.json`), up from 83 in Phase 4C.4 after later commits on this branch. The workspace shows the live count; it doesn't re-baseline anything.
3. **Corroboration proposals on published pairs.** These are the 11 Tanzania proposals backed by the immigration department's guidelines. Their pairs show as "Published (verified)", with the pending proposal listed. Approving them would change only the source, not the category.
4. **Topic cases have no sources attached.** The plan names the evidence needed, but the research package holds no sources for those topics yet, so they show "Evidence unavailable".
5. **Data is from the repository, not Supabase.** The workspace doesn't read the `passport_evidence_submissions` tables, so submissions made in the database wouldn't appear. That is intentional for this read-only phase.

## 5. Confirmed unchanged

| Item | State |
|---|---|
| Dataset version | `2026.10-s2` |
| Records and published rules | 640 each |
| Ranking | Unpublished |
| `data.ts`, research package, plan, backlog CSV | No edits |
| Supabase | No migrations, RLS or role changes; no database client added |
| Authentication | Existing session cookie, `verifyResearchSession` and profile lookup reused unchanged |
