# Local Passport Phase 2B Database Tests

**Status: preparation only. No migration has been validated yet.**

## Requirements

On your Mac, install and start Docker Desktop, install the Supabase CLI and PostgreSQL client `psql`, and check out `phase-2b/verification-workflow` in your private Uncle Jetlag repository.

**Never run `supabase db push`, `supabase link`, or remote SQL scripts for these tests.** Do not paste secrets or database passwords into ChatGPT.

## First pass

```bash
git switch phase-2b/verification-workflow
git pull --ff-only
bash scripts/passport/run-local-security.sh
```

This script checks for Docker/CLI/psql, refuses database URLs in `DATABASE_URL`, `SUPABASE_DB_URL`, or `PGHOST`, and requires the DB URL reported by the local Supabase CLI to point to localhost. It then runs `tests/passport/sql/structural-security.sql`.

**Caution:** The local Supabase CLI applies all tracked migrations. Inspect migration ordering and check for conflicts before running. The current staged migrations have not yet been tested together; the script may fail. If it does, save only the error message (redact credentials) and do not modify your remote project.

## Acceptance criteria

1. All staged migrations apply successfully on a disposable local instance.
2. Structural security SQL passes.
3. Submission/review/resubmission fixture tests pass (still to be authored).
4. Self-review, stale revision, unauthorized actor, and mutation of finalized evidence all fail.
5. Audit insertion failure rolls back the associated transaction.
6. Two concurrent reviews cannot both finalize the same revision.
7. Eleven rate-limit calls in the same minute produce 10 allowed, then 1 denied.
8. TypeScript, unit, build and browser tests all pass in CI.

Until every criterion is satisfied, leave `PASSPORT_TRANSACTIONAL_WRITES_ENABLED` unset/false and PR #8 in draft.
