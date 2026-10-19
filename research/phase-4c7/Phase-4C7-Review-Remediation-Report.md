# Phase 4C.7: review remediation report

**Branch:** `phase-4c7/evidence-review-workspace` (Draft PR #19), base `phase-4c5/integrated-quality-staging`.

**Date:** 19 October 2026.

**Scope:** a targeted remediation of the Evidence Review Workspace.

- It doesn't change authentication code, cookies, middleware, Supabase settings, RLS or roles.
- It doesn't change published classifications or ranking calculations.
- Nothing is deployed.

## 1. Review findings

1. **Wrong status.** A case was labelled "Blocked: evidence unavailable" merely because it appeared in the Phase 4C.6 resolution plan or the 4C.4 backlog. That implied official evidence was missing when the real problem was conflicting, incomplete or unresolved evidence.
2. **Missing test coverage.** Tests didn't cover these cases: no evidence, partly readable evidence, conflicting official sources, valid evidence awaiting review, published records under re-verification, destination-wide topics, and consistency between status, counts and filters.
3. **Redirect behaviour.** Unauthenticated research-admin requests receive HTTP 200 with an in-page redirect rather than an HTTP 307.
4. **No signed-in tests.** No browser test runs with a real research session.

## 2. Root causes

**Status (finding 1):**
- In `buildWorkspaceCases`, the rule `else if (planEntry || backlogRow?.knownBlocker) status = "blocked"` used *being on a list* as the status. All four topic cases were hardcoded to `"blocked"`.
- Sources already read in Phases 4C.3 and 4C.4 were never attached to backlog pairs or topics, so the model couldn't tell "nothing read" from "read but not enough".

**Redirect (finding 3):**
- `src/app/loading.tsx` is a root loading boundary. Next.js wraps every page in a Suspense boundary and streams the layout shell (with HTTP 200) before the page runs.
- `redirect()` therefore arrives inside the stream as a meta refresh plus a router instruction, not as a status code.
- This affects every research-admin page, including the existing `/passport-index/research-admin`.

## 3. Code changes

| File | Change |
|---|---|
| `src/lib/passport/review-workspace.ts` | New six-status model with labels, descriptions and display order. A pure `deriveStatus()` contains the rules. Sources can now be attached to a case in a **context** role (read, but neither supporting nor contradicting a classification), with the reason for the link. Topics take their status from linked sources. Records with category `unknown` are never treated as published, and the labels show "Not verified" for them. The overview has new counts: `evidenceUnavailable`, `evidenceInsufficient`, `pendingHumanVerification`, `awaitingReverification`. Questions shown per case now depend on status |
| `research/phase-4c7/evidence-links.ts` (new) | Evidence-link register. It restates four sources already documented in the Phase 4C.4 report (Tanzania NIC insurance portal, Zanzibar insurance notice, and the Malawi embassy fee pages in Brussels and Berlin), and links existing sources to cases, each with a reason taken from the source's own note. **No new evidence and no classification.** |
| `src/lib/passport/review-workspace-data.ts` | Passes the register into the workspace |
| `src/components/passport/workspace/WorkspaceView.tsx` | Overview tiles for all six statuses; a "How evidence statuses are assigned" legend; the status filter in status order; no hardcoded counts |
| `src/components/passport/workspace/CaseDetail.tsx` | Evidence-status explanation; "Other official sources read" (context) section; "Why linked" reasons; correct empty-state text per status |
| `src/components/passport/workspace/badges.tsx` | Badges for the new statuses, each with a glyph and description; the notice uses the new "Verified, published" label |
| `tests/passport-review-workspace.test.ts` | 13 new tests (50 in total) |
| `research/phase-4c7/Phase-4C7-Evidence-Data-Integrity-Report.md`, `Phase-4C7-Technical-Implementation-Report.md` | Status sections and topic-source statements brought up to date |

**Not changed:**
- authentication code (`admin-auth.server.ts`, `admin-session.server.ts`, `admin-permissions.ts`, `workspace-access.ts`);
- the page gates;
- `data.ts`, the research package, the plan and the backlog;
- Supabase;
- middleware;
- `next.config`.

## 4. Evidence-status logic, before and after

**Before** (first matching rule wins):

1. published and (disputed or in the plan) → "Published, under re-verification"
2. published → "Published (verified)"
3. disputed proposal → "Disputed"
4. proposal with a fully read source → "Pending verification"
5. **in the plan, or the backlog has a blocker → "Blocked: evidence unavailable"**
6. otherwise → "Not verified"

All four topics were hardcoded to "Blocked".

**After** (`deriveStatus`, first matching rule wins):

1. published and (disputed proposal, conflicting source or plan entry) → **Published, awaiting re-verification**
2. published → **Verified, published**
3. disputed proposal or any conflicting source → **Disputed: contradictory evidence**
4. proposal citing a source read in full (or a published-register source) → **Pending human verification**
5. any non-published source read in full or in part → **Evidence available but insufficient**
6. otherwise (no source, or only unreadable sources) → **Evidence unavailable**

Plan and backlog membership now sets priority only. A test rebuilds the workspace without the plan and confirms no unpublished case changes status.

## 5. Updated dashboard statistics (calculated, 78 cases)

| Status | Before | After |
|---|---|---|
| Verified, published | 13 | 13 |
| Published, awaiting re-verification | 2 (Ghana → Tanzania, Ghana → Namibia) | 2 (same) |
| Pending human verification | 11 | 11 |
| Disputed: contradictory evidence | 3 | **5**: Zimbabwe → Tanzania, Nigeria → Tanzania, Eswatini → Namibia, **Malawi visa fee**, **Ghana entry policy** |
| Evidence available but insufficient | (did not exist) | **47** |
| Evidence unavailable | 49 (as "Blocked") | **0** |
| Not verified (old status) | 0 | removed |

**The 47 "insufficient" cases:**

| Group | Count | Source(s) read |
|---|---|---|
| Ghana as destination | 14 | The Ghana Immigration Service launch notice, partly read |
| Malawi as destination | 13 | Both Malawi category lists, read in full but naming none of these passports |
| Mozambique as destination | 9 | The London High Commission list, which omits SADC exemptions |
| Lesotho as destination | 9 | The Home Affairs page, which names no countries |
| Tanzania insurance topic | 1 | Portal read; no date or exemptions |
| Malawi exemption-list topic | 1 | Category lists and notice |

**Other overview figures (unchanged):**
- 28 proposals (24 pending, 4 disputed);
- 640 verified published records;
- 0 evidence-quality errors and 98 warnings;
- ranking not published (0 of 180).

**"Evidence unavailable" is 0** because every case in the backlog and plan now has at least one official source that was actually read. That outcome comes from the data, not from a fixed number. The status is tested with synthetic cases.

## 6. Test results (all run on 19 October 2026)

| Command | Result |
|---|---|
| `npm run typecheck` | **Pass** |
| `npm test` (`vitest run`) | **420 passed, 4 skipped, 0 failed**, 24 files (407 before this remediation) |
| `tests/passport-review-workspace.test.ts` | **50 passed** (37 before) |
| `npm run build` | **Pass**; both workspace routes are dynamic |
| `CI=1 npm run test:e2e` (serial, one worker, as the harness config sets for CI) | **108 passed, 1 skipped, 0 failed**. The skip is `baseline.spec.ts › write tests/fixtures/noindex-paths.json`, which only runs with `UPDATE_BASELINE` |

**Not run:**
- `npm run test:e2e` with 4 workers; in the previous run it had 8 known consent-test timeouts under parallel load.
- No signed-in browser test exists (see section 8).

**New tests cover:**
1. **No official evidence:** a backlog blocker, a plan entry or an unreadable source alone gives "Evidence unavailable", never "Blocked".
2. **Partly readable evidence:** gives "insufficient", both through a proposal and through a linked source.
3. **Conflicting sources:** gives "disputed", both through a proposal and through a link; five real cases are checked.
4. **Valid evidence awaiting review:** gives "pending"; real Nigeria → Malawi and Ghana → Mozambique cases are checked.
5. **Published under re-verification:** the value is unchanged; real Ghana → Tanzania and Ghana → Namibia cases are checked.
6. **Topics:** the four real topic statuses and their linked sources; Malawi fee conflicts are named.
7. **Consistency:** status counts, filter results, parsed filter values, rendered labels and the "no blocked label" check all agree.
8. **Published data:** no published classification changes, and published pairs are only "published" or "re-verification".
9. **Source dates:** missing dates show "Not shown on source" and are never fabricated (checked across every case).
10. **Unknown categories:** a category of `unknown` is never treated as published.
11. **Register checks:** the evidence-link register only restates sources found in the 4C.4 report with the same access date, and links only existing sources to existing cases.

**Mutation checks:** I broke each new rule deliberately and confirmed the tests catch it.

| Rule broken | Failing tests |
|---|---|
| Plan entries force "unavailable" | 2 |
| Partly read sources ignored | 2 |
| Conflicting links ignored | 2 |

**Accessibility:** axe-core (WCAG 2.0/2.1 A and AA) found no violations on static renders of the workspace and case pages at 1280 px and 390 px, with no horizontal overflow.

## 7. Authentication redirect assessment

**Method:** I ran a production build locally with no Supabase configuration, so every request is unauthenticated, and requested each route with `curl`.

| Request | Status | Body |
|---|---|---|
| `/passport-index/research-admin` (existing page) | 200 | Site shell, meta refresh plus `NEXT_REDIRECT;replace;/passport-index/research-admin/login;307` |
| `/passport-index/research-admin/workspace` (with or without query) | 200 | Same |
| `/passport-index/research-admin/workspace/cases/pair-gh-tz` | 200 | Same |
| `/passport-index/research-admin/workspace/cases/does-not-exist` | 200 | **Byte-identical** to the real case, apart from the echoed URL |
| Workspace with a forged `uj_passport_research_session` cookie | 200 | Same redirect; no data |
| Workspace requested as a client navigation (`RSC: 1`) | **307** | Empty body |

**Findings:**

1. **No protected research data was delivered.** None of these strings appeared in any response:
   - "Evidence review workspace" (as page content) and "Research overview";
   - proposal IDs (`p4c3-…`) and source IDs;
   - case titles such as "Ghana → Tanzania";
   - "Draft evidence import";
   - `passport_research_profiles` and Supabase hosts.

   The page code checks access before loading data, and a unit test with a spy confirms the data loader is never called for unauthenticated or inactive identities.
2. **Metadata exposed:**
   - Each protected route's static `<title>` is visible, such as "Evidence Review Workspace | Passport Research Admin" and "Research case". This reveals that the routes exist and what they're for, but no data.
   - The responses carry `Cache-Control: private, no-cache, no-store` and `noindex, nofollow`, and the routes aren't in the sitemap.
   - Case pages don't reveal whether a case ID exists.
   - Severity: **low**.
3. **Does it meet the access-control requirement?** Yes for confidentiality: only authenticated, active research profiles receive research data.
   - It falls short of a conventional HTTP contract. Clients that don't follow meta refresh or client redirects see a 200 page with the public site shell.
   - Monitoring may count these requests as successes.
4. **Can a conventional 307 be added safely without changing the authentication architecture?** Yes, as a separate, approved change. Two options:
   - **(a) Edge redirect on cookie presence:** a `redirects()` rule in `next.config` (`missing: [{ type: "cookie", key: "uj_passport_research_session" }]`) or a minimal proxy/middleware. Requests with no session cookie get a real 307 to sign-in. The page-level `currentResearchIdentity()` check stays the authoritative gate, because a forged cookie would pass the presence check.
   - **(b) Move research-admin outside the root loading boundary** (a route group with its own root layout). This is a larger structural change.

   I recommend (a). Also consider generic titles such as "Passport research" for protected routes to remove the route-purpose metadata. Neither was implemented here, as instructed.

## 8. Signed-in testing proposal (recommendation only)

**Environment:**
- A dedicated **non-production** Supabase project, for example `uj-passport-staging`. It must be separate from production project `higmlrqrgxdhvkmrdpru`.
- Migrations come from PR #8 or the 4C.2 branch, applied only there.
- Credentials are stored as CI secrets (`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_PUBLISHABLE_KEY`) and per-role test passwords. They are never in the repository or in chat.

**Accounts:** created by the owner in staging only.

| Account | Profile |
|---|---|
| `admin` | Active admin profile |
| `reviewer` | Active reviewer profile |
| `researcher` | Active researcher profile |
| `inactive` | `active = false` |
| `noprofile` | Valid Supabase user with no `passport_research_profiles` row |

**Harness:**
- A Playwright project `research-auth` that runs against a preview or local build pointed at staging.
- A `globalSetup` signs in through the real `/passport-index/research-admin/login` form and saves each role's `storageState`. No token is ever handled by the test code.
- It runs serially.

**Cases:**

| Area | What to check |
|---|---|
| Role access | admin, reviewer and researcher can open the workspace and a case page. Only admin sees "Administrators only" (import dry run) |
| Refused identities | `inactive` and `noprofile` are redirected to sign-in and receive no research data |
| Unauthorised access | No cookie, a forged cookie, a cookie from another project, a tampered JWT, and a deleted profile are all refused |
| Session expiry | A short-lived token, or a server-side session revocation followed by a reload, ends on sign-in with no data rendered. Sign-out clears the cookie and later requests are refused |
| Read-only guarantee | Every role's page contains no POST forms, server actions or mutating controls. The test intercepts network traffic and asserts no non-GET request to the app or Supabase REST during a session, other than authentication |
| Role restrictions | Direct navigation to admin-only areas as researcher or reviewer is refused, mirroring `mayPerform` |

**Gate:** the workflow runs only on draft branches with staging secrets, never against production. Results are attached to the PR.

**Owner actions needed:**
- create the staging project and the five accounts;
- add the CI secrets;
- approve the workflow.

## 9. Remaining limitations

1. The redirect is still delivered as a 200 with an in-page redirect (section 7). Fixing it needs a separately approved change.
2. There are no signed-in browser tests until the section 8 environment exists.
3. Workspace data comes from repository files, not from database submissions.
4. The evidence history is reconstructed from dates; it isn't an audit log.
5. "Evidence unavailable" is currently 0. That's correct for today's data, but the status depends on the register being kept current as research is added.
6. The plan uses P0–P2 and the backlog uses P1–P3, so the two priority scales still differ.
7. Key primary documents are still unread: Tanzania GN 256/2026, the Malawi fee schedule and Ghana's legal instrument.
8. Screenshots are static renders, not the live signed-in page.

## 10. Release recommendation

**Ready for review as a draft; not ready to merge into a release branch until two things happen:**

1. the owner accepts the redirect assessment, either choosing to add the cookie-presence 307 or explicitly accepting the current behaviour;
2. a reviewer confirms the six-status terminology.

**Approved for review:** the code is read-only and preserves published data, and every test I ran passed (section 6).

**Not authorised:** no merge, deployment, database change or ranking publication.
