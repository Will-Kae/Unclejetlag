# Live staging authorization smoke tests

The read-only executable `scripts/passport-auth-smoke.mjs` verifies the 16 expected HTTP status outcomes for anonymous, researcher, reviewer and administrator requests to the four private APIs. It also checks no-store response headers and role identity responses.

**Prerequisites:** a separate HTTPS staging deployment with the private feature enabled, and three already-provisioned Supabase Auth users with active profiles. The existing Supabase project currently has no test users. Do not use production personal accounts or create users through raw inserts into `auth.users`.

Set `PASSPORT_STAGING_URL`, `PASSPORT_RESEARCHER_TOKEN`, `PASSPORT_REVIEWER_TOKEN`, and `PASSPORT_ADMIN_TOKEN` in a protected CI secret environment, then execute `node scripts/passport-auth-smoke.mjs`. Never print the tokens, commit them, or put them in command-line arguments.

This checks HTTP authorization behavior, **not** evidence submission/review transactions, browser login flows, account revocation, MFA, or data isolation between two researchers. Keep production disabled and PR #8 unmerged until those are tested and reviewed.
