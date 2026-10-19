# Phase 4C.5 — Staging readiness and release gates

Status: **NOT APPROVED FOR PRODUCTION**. Research-only, draft PR #18. No merging, publishing, database mutations or production deployment is authorized.

## Integrated implementation
- Research-admin preview from Phase 4C.2/4C.3 (role checked server-side; preview is read-only).
- Published dataset evidence audit, reviewed baseline and verification backlog from Phase 4C.4.
- Independent proposal-quality checks from PR #16 under `proposal-quality.ts`; no overlapping module paths.
- Kenya guide references official sources.
- Georgia guide insurance copy updated to reference Georgian Government Resolution No. 602, including exemptions; content validation must be rerun.

## Automated verification
- Preservation harness run **39157528010** passed at commit **549242b9f0b61e31eb7f69973befc0b4bb9123c7**, including Georgia guide and security-test changes. Rerun after further code changes.
- New fail-closed regression tests cover denied/failed profile lookup, duplicate profiles, inactive accounts, and researcher/reviewer inability to prepare release.
- CI browser tests run sequentially after nine timeouts in an earlier parallel run; keep monitoring performance rather than treating this as a proven application fix.

## Security gates — owner-reported results and deferrals (19 October 2026)
- Owner reported PASS for admin, reviewer and researcher read-only dashboard access, logout redirect and session expiry (five checks; independent artifacts not collected).
- Read-only Supabase inspection: all eight passport tables have RLS enabled; seven evidence/release tables are default-deny; research profile SELECT policy limits authenticated users to their own active profile.
- Leaked-password protection remains disabled due to current plan limitations, as accepted by owner.
- Live revocation/deactivation, rate-limit review, and log privacy checks were deferred at owner's request. No Supabase settings, accounts or policies were modified.

## Previously identified live test scope
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
