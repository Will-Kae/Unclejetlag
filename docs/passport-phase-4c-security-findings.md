# Phase 4C.2 — Live Supabase Security Findings

Read-only inspection of project `higmlrqrgxdhvkmrdpru` on 2026-10-14.

## Verified

All eight `public.passport_*` tables have row-level security enabled, but **pg_policies returned zero policies**. This is default-deny for ordinary `anon` and `authenticated` PostgREST access (assuming no privileged grants or bypass roles). Do not interpret RLS-enabled as an operational authorisation system.

Existing database trigger functions:

- `passport_enforce_independent_review`
- `passport_enforce_review_revision`
- `passport_check_release_candidate`
- `passport_audit_immutable`
- `passport_protect_linked_conflicts`
- `passport_protect_linked_evidence`

These functions exist; their implementation, trigger attachments, ownership, and grants have **not** yet been validated. Do not claim the safeguards are operational until verified.

## Next security gate

1. Inspect `pg_trigger`, `pg_proc` definitions, role grants, and `auth.users` membership counts (never expose email addresses or secrets).
2. Define narrowly scoped RLS policies for active researchers (own drafts), independent reviewers (assigned submissions, review insert only), and administrators (audit/release management).
3. Implement role checks that cannot be changed by the end user; avoid recursive RLS lookups. Use carefully reviewed security-definer helpers only if necessary, with locked `search_path` and restricted EXECUTE grants.
4. Use Supabase Auth and session-bound server-side API calls; never expose service-role credentials.
5. Validate independent review and revision consistency with transaction-level tests before allowing writes.
6. Require explicit authorisation before altering the live Supabase database. Until then, make no migrations or policy changes.

**Production site and Supabase database unchanged by this inspection.**
