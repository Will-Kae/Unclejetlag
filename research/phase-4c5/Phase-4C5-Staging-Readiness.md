# Phase 4C.5 — Staging readiness and release gates

Status: **NOT APPROVED FOR PRODUCTION**. Research-only, draft PR #18. No merging, publishing, database mutations or production deployment is authorized.

## Integrated implementation
- Research-admin preview from Phase 4C.2/4C.3 (role checked server-side; preview is read-only).
- Published dataset evidence audit, reviewed baseline and verification backlog from Phase 4C.4.
- Independent proposal-quality checks from PR #16 under `proposal-quality.ts`; no overlapping module paths.
- Kenya guide references official sources.
- Georgia guide insurance copy updated to reference Georgian Government Resolution No. 602, including exemptions; content validation must be rerun.

## Automated verification
- Preservation harness run 39130776424 passed at commit 45ba010 (unit/typecheck, local build, routes and browser tests).
- **That run predates Georgia guide changes and new security tests.** A fresh full harness run on the latest commit is mandatory before a release decision.
- New fail-closed regression tests cover denied/failed profile lookup, duplicate profiles, inactive accounts, and researcher/reviewer inability to prepare release.
- CI browser tests run sequentially after nine timeouts in an earlier parallel run; keep monitoring performance rather than treating this as a proven application fix.

## Security gates not yet verified live
- Test separate real Supabase Auth identities with active researcher, reviewer and admin roles.
- Verify unauthenticated redirects, inactive role denial, role downgrade/revocation, expired sessions, and logout across protected routes.
- Inspect active RLS policies in the linked Supabase project before permitting any privileged database operations.
- Review authentication protection and rate limiting configuration. No policy or auth-setting changes are authorized by this report.
- Confirm preview responses and logs never disclose session tokens or private proposal data.

## Evidence and content gates
- Six disputed research questions remain unclosed; do not change visa access classifications based on unreviewed proposals.
- Existing audit baseline: 83 warnings (66 missing stay periods; 15 Seychelles conditions; one old EU legal text; one Zimbabwe→Georgia stay mismatch).
- Review the official Georgia insurance regulation and rendered page after the latest update; check requirements and exceptions.
- The World Passport Index remains unpublished: 0 scored passports; no ranking release.

## Release decision
**Hold.** Obtain green CI at latest head, complete role-specific staging security tests, review remaining evidence/content issues, and seek explicit owner approval before merging or deploying to production.
