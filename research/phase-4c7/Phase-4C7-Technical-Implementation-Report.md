# Phase 4C.7: Passport Evidence Review Workspace, technical implementation report

**Branch:** `phase-4c7/evidence-review-workspace`. It is based on `phase-4c5/integrated-quality-staging` (PR #18) at `127d74e`.

**Status:** draft, for review only.

- Nothing is merged or deployed.
- No database or authentication change was made.

## 1. What was built

The workspace is a read-only area inside the existing authenticated research administration.

| Route | Purpose |
|---|---|
| `/passport-index/research-admin/workspace` | Research overview, research priorities, search and filters, evidence review table, country coverage. Administrators also see the existing draft-import dry run |
| `/passport-index/research-admin/workspace/cases/[caseId]` | Case detail, in this order: published record, proposed classification, supporting and conflicting official sources with dates, outstanding questions, researcher notes, reviewer recommendations, automated validation findings, evidence history |

The existing `/passport-index/research-admin` page gains one link to the workspace. Nothing else on that page changed.

### Files

| File | Role |
|---|---|
| `src/lib/passport/review-workspace.ts` | Pure data model: cases, statuses, quality levels, overview metrics, query parsing, filtering, pagination, display labels |
| `src/lib/passport/review-workspace-data.ts` | Assembles the workspace from repository data and the existing quality utilities |
| `src/lib/passport/workspace-access.ts` | Access decision from the server-verified identity |
| `src/components/passport/workspace/WorkspaceView.tsx` | Overview, priorities, GET filter form, table (desktop) and cards (mobile), country table |
| `src/components/passport/workspace/CaseDetail.tsx` | Case detail |
| `src/components/passport/workspace/badges.tsx` | Badges and the "not travel advice" notice |
| `src/app/passport-index/research-admin/workspace/page.tsx` | Gated page |
| `src/app/passport-index/research-admin/workspace/cases/[caseId]/page.tsx` | Gated page |
| `research/phase-4c4/backlog.ts` | Typed mirror of the backlog CSV, test-verified |
| `research/phase-4c5/resolution-plan.ts` | Typed mirror of the Phase 4C.6 plan table, test-verified |
| `tests/passport-review-workspace.test.ts` | 37 unit tests |
| `e2e/research-workspace.spec.ts` | 6 browser tests |
| `research/phase-4c7/*.md` | The two reports |

**How it renders:** all components are server components. There is no client JavaScript, no `"use client"`, no server actions and no route handlers.

**Search and filters:** these use an ordinary GET form, so they work without JavaScript and the URL can be shared. They cover:
- a text search across names, codes, proposal IDs, categories and source publishers, ignoring accents;
- country (matches either the passport or the destination);
- status;
- priority (P0–P3 or unranked);
- evidence quality.

**Large datasets:**
- The table shows 25 cases per page, with previous and next links.
- Query values are parsed against allow-lists. Unknown values are dropped, the search is limited to 80 characters, and the page number is clamped.
- With 78 cases, building the workspace takes milliseconds.

## 2. Security

**Authentication and roles:**
- **Authentication is reused as it is.** Both pages call the existing `currentResearchIdentity()`. That reads the existing HTTP-only session cookie and runs `verifyResearchSession()`: Supabase Auth user check, then a `passport_research_profiles` lookup.
- **Roles come only from that lookup.** `workspaceAccess()` allows active admin, reviewer and researcher profiles and refuses everything else.
- **Administrator-only diagnostics** use the existing `mayPerform(identity, "prepare-release")` rule.

**Order of checks:**
- The access check runs before any research data is loaded and before a case ID is looked up.
- So an unauthenticated visitor can't tell whether a case exists. Tests check this with a spy on the data loader.

**What was not added:**
- No public API.
- No route handler.
- No server action.
- No `fetch`.
- No database client.
- No service-role key.
- No writes.

A source-scan test fails if any of these appear in the workspace files.

**Search engines:** both pages are `noindex, nofollow`, and the end-to-end tests confirm they're absent from the sitemap.

**Not changed:** RLS policies, roles, authentication configuration, environment variables and Supabase projects.

**Redirect behaviour (applies to the existing admin page too):**
- Next.js streams the root layout before the page runs, so `redirect()` reaches an unauthenticated visitor as HTTP 200. The page carries a meta refresh and a router redirect to sign-in, not a 307 status.
- The existing `/passport-index/research-admin` page behaves the same way.
- The end-to-end tests check the raw HTML contains the redirect and **no research data**, and that the browser lands on sign-in.
- A true 307 would need middleware, which is an authentication-configuration change, so it's left as a recommendation.

## 3. Test results (actually run, 19 October 2026)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | **Pass** |
| Unit tests (full suite) | `npx vitest run` | **407 passed**, 4 skipped. The branch baseline before this work was 370 passed |
| New workspace unit tests | `tests/passport-review-workspace.test.ts` | **37 passed** |
| Production build | `npm run build` | **Pass**. Both workspace routes are listed as dynamic (ƒ) |
| Workspace browser tests | `npx playwright test e2e/research-workspace.spec.ts` | **6 passed** |
| Full preservation harness, serial (`CI=1`, one worker, as CI runs it) | `CI=1 npx playwright test` | **108 passed**, 1 skipped, 0 failed |
| Full preservation harness, 4 workers (local default) | `npx playwright test` | 96 passed, 1 skipped, **12 failed** (details below) |

**Why the 4-worker run failed:**
- **8 of the 12 failures** were consent and AdSense tests that timed out after 2.1 minutes. They passed in the serial run. The harness configuration already explains this: it runs one worker in CI because "long consent navigation sweeps can compete for the same Next.js server".
- **The other 4** were the first version of my workspace browser tests. They read the URL before the in-document redirect completed. I corrected the tests to wait for the sign-in URL and to inspect the raw HTML; the corrected tests pass in both runs.

**Mutation checks:** I broke the code deliberately and confirmed the tests fail each time.

| Change made | Failing tests |
|---|---|
| Removed the page's access check | 2 |
| Showed administrator diagnostics to everyone | 2 |
| Allowed inactive profiles | 2 |
| Removed the re-verification status | 1 |
| Restricted the country filter to destinations only | 1 (the test was strengthened after this was first missed) |

**What the unit tests cover:**

| Area | Tests |
|---|---|
| Dashboard calculations | 7 |
| Published versus proposed | 2 |
| Filtering, search and pagination | 5 |
| Rendering (case detail, backlog-only case, full workspace with no write controls) | 3 |
| Missing and contradictory evidence | 5 |
| Access decisions | 2 |
| Routes (unauthenticated, inactive, researcher, admin, unknown or malformed case IDs) | 5 |
| Mutation protection (frozen inputs, published data unchanged, source scan, no route handlers, gate order) | 5 |
| Repository mirrors | 2 |
| Status labels | 1 |

**Accessibility:** axe-core (WCAG 2.0/2.1 A and AA) found **no violations** on static renders of the workspace and two case pages, at 1280 px and 390 px. Neither width scrolls horizontally.

**Limit of these checks:** they cover the workspace components rendered with the site's built CSS, not the live authenticated page, because the harness has no research login.

## 4. Screenshots

There is no live staging URL for the authenticated pages. These screenshots are **static renders** of the same server components with real repository data and the site's built CSS. Each image carries a banner saying so.

| Screenshot | Width |
|---|---|
| `workspace-1280.png` (full page) | Desktop |
| `workspace-filtered-1280.png` | Desktop |
| `case-gh-tz-1280.png` (full page) | Desktop |
| `case-bw-gh-1280.png` | Desktop |
| `workspace-390.png` | Mobile |
| `case-gh-tz-390.png` | Mobile |

## 5. Outstanding limitations and recommended next steps

1. **No authenticated end-to-end test.** The harness has no Supabase test project or research login. Next step: a staging Supabase project with a seeded, non-production researcher account, then an end-to-end test that signs in and checks each role. This needs your approval and test credentials handled outside chat.
2. **Unauthenticated access returns 200 with a redirect, not 307.** This also applies to the existing admin page. Next step: middleware that redirects research-admin routes without a session cookie to sign-in. It's a small authentication-configuration change that needs approval.
3. **The data comes from the repository, not from submissions in the database.** Next step, once the Phase 4C.2 policies are verified on staging: a read-only, server-side query of `passport_evidence_submissions` using the user's own session (never a service-role key).
4. **Evidence history isn't an audit log.** It shows only dates that exist in the files. A real audit trail depends on the staged `passport_verification_audit` table.
5. **Priority scales differ** between the plan (P0–P2) and the backlog (P1–P3). Next step: adopt one scale in the next plan revision.
6. **Topic cases have no sources yet.** Next step: add the Tanzania Gazette Notice 256/2026, the Malawi fee schedule and others to a research package once they've been read.
7. **No pull request was opened from here**, because the GitHub API refused it. You open it as a draft that targets `phase-4c5/integrated-quality-staging`.
