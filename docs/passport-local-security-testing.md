# Uncle Jetlag Passport Verification — Isolated Security Test Record

**Updated 12 October 2026.** All tests described below run on the feature branch `phase-2b/verification-workflow` (draft PR #8). This document is not authorization to deploy.

## Verified in GitHub Actions

- Disposable PostgreSQL 17: staged migrations, schema permissions, row-level security, submission/review/resubmission state transitions, self-review rejection, stale revisions, finalized evidence immutability, atomic audit rollback, concurrent approval contention, and rate limiting.
- Disposable Supabase CLI stack: real local Auth accounts, authenticated-client denial of privileged RPCs and protected tables, PostgREST submit → request changes → resubmit → approve, stale-review rejection, audit assertions, and 11th-call rate limiting.
- Preservation harness: TypeScript, unit and contract tests, local website build, browser checks, and isolated database tests.
- Next.js write handler: feature-flag gates, origin restrictions, authenticated role checks, strict payload validation, rate-limit fail-closed behavior, verified actor ID forwarding, and sanitized RPC errors (unit-tested with mocks).

**Confirmed successful runs:** [preservation harness #125](https://github.com/Will-Kae/Unclejetlag/actions/runs/38276260793), [isolated database #32](https://github.com/Will-Kae/Unclejetlag/actions/runs/38276260883), [local Supabase integration #11](https://github.com/Will-Kae/Unclejetlag/actions/runs/38276260776).

## Release blockers / unverified assumptions

1. No real hosted **staging** deployment has been tested with its actual Vercel environment, HTTPS origin allowlist, Supabase secrets and private verification accounts. Local Supabase API tests do not establish hosted configuration correctness.
2. The full Next.js HTTP handler → Supabase Auth → role lookup → rate limiter → RPC chain has not been exercised end-to-end against the disposable Supabase instance with both release gates enabled. Handler tests use mocks; local RPC tests call PostgREST directly.
3. Security and operations review is still needed for abuse resistance, maximum request body bytes (do not trust Content-Length alone), monitoring, credential rotation, rollback and database backups.
4. The existing hosted production Supabase project must not be used for tests or migrations without explicit authorization and a reviewed deployment plan.

## Release controls

- `PASSPORT_TRANSACTIONAL_WRITES_ENABLED` must remain unset/false.
- `PASSPORT_WRITE_RPC_BRIDGE_ENABLED` must remain unset/false.
- `PASSPORT_VERIFICATION_WORKSPACE_ENABLED` must not be enabled in production without approval.
- Keep PR #8 in **draft**. Do not merge or deploy staged migrations.
- Never expose `passport_internal`, Supabase service-role secrets or private verification tables to browser clients.

## Local reproduction

CI runs automatically on PR changes. Optional local reproduction requires Docker and Supabase CLI. Use `supabase start` against the disposable local stack only. Never run `supabase link`, `supabase db push`, or remote SQL against the hosted project during testing.
