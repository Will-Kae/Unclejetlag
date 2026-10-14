# Passport Verification Workspace — authentication rollout

## Status

The private sign-in page is mounted behind `PASSPORT_VERIFICATION_WORKSPACE_ENABLED=true`. It is **disabled by default**. The login component uses Supabase Auth password grant and verifies an active researcher/reviewer/admin profile via the private `/api/passport-verification/me` endpoint. The dashboards are read-only; transactional submission/review RPCs have not been deployed. This document does **not** authorize public deployment.

## Environment (server-side)

- `PASSPORT_VERIFICATION_WORKSPACE_ENABLED=false` until all gates pass.
- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SECRET_KEY` — server runtime only; never use a `NEXT_PUBLIC_` prefix or print the value.
- `SUPABASE_PUBLISHABLE_KEY` — server RPC adapter, when activated.

## Environment (browser-exposed, non-secret)

- `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public client key, not a secret.

The Supabase project URL and publishable key must belong to the same project. Configure these through protected environment settings; do not commit real keys. Production credentials must not be used in local test logs.

## Invite-only test users

Provision **separate** Supabase Auth users for researcher, reviewer, and admin through authorized administration. Do not use real personal accounts or shared credentials. Insert matching `passport_research_profiles` rows with active roles through a controlled administrative process. Do not create self-service registration.

## Test matrix (staging only)

1. Flag unset or false: `/passport-verification` and all private APIs return 404.
2. Flag true, browser public configuration absent: sign-in displays a configuration warning and no login request.
3. Wrong password, missing bearer, expired bearer: no private data; no role leakage.
4. Authenticated account without an active profile: rejected.
5. Researcher: researcher endpoint allowed; reviewer/admin endpoints forbidden.
6. Reviewer: reviewer endpoint allowed; researcher/admin endpoints forbidden.
7. Admin: all permitted read endpoints allowed; admin dashboard selected.
8. Reviewer queue excludes the reviewer's own submissions; researcher view excludes other researchers' submissions.
9. Refresh, sign-out and expiry: session is discarded and private UI is cleared.
10. Verify response cache headers, browser history, logs and error payloads do not expose access tokens.
11. Confirm database RLS and no direct `anon` or `authenticated` table grants.
12. Confirm transactional RPC migration is reviewed, applied, and tested before enabling any evidence writes or review actions.

## Release gate

Do not enable the feature flag until all tests pass and a security reviewer approves the session model. Password-grant sign-in is a first iteration; assess MFA, rate limits, CSRF boundaries, account recovery, and production session rotation before wider access. Do not merge PR #8 or deploy without explicit approval.
