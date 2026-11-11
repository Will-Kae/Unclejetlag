# Phase 2B-B Supabase migration review checklist

**Status:** SQL foundation committed but **not deployed or validated against a live/local Supabase instance**. Draft PR only.

## Decisions
- Supabase Postgres and Supabase Auth are approved as the target technologies.
- Project creation, credentials, billing, authentication configuration and applying migrations still require a separate, explicit operational step.
- Never commit secrets or expose the Supabase service-role key to browser code.

## Before applying the initial migration

1. Run it against a disposable local Supabase/Postgres environment with the `auth.users` schema available.
2. Review compatibility with any existing `public` schema objects. The migration uses targeted revokes on **only its new tables**; it does not revoke unrelated website tables.
3. Verify the trigger rejects self-review, inactive reviewers and unauthorized reviewer roles.
4. Verify both `anon` and `authenticated` have no access to the new tables. A service-role connection is powerful and must never be exposed to the client.
5. Verify the audit UPDATE/DELETE trigger and all foreign keys/check constraints.
6. Verify applying and rolling back the migration in a clean test environment.
7. Implement authenticated, role-checked server workflows and complete RLS policies before any browser-facing interface is introduced.
8. Add transactional state transitions and database-enforced release-candidate eligibility. The initial schema **does not yet guarantee** that a release candidate contains only independently approved, conflict-free submissions.
9. Make evidence artifacts private, add signed access controls, type/size checks and upload malware handling before accepting documents.
10. Ensure any new server code preserves the published passport data and existing preservation harness.

## Known limitations of this first commit

- Schema only: no connected Supabase project, auth configuration, policies granting scoped access, persistence adapter, evidence UI, or production migration.
- Reviewer != submitter is enforced on review insert/update, but complete immutable submission ownership, submission revisioning, review workflow and admin permissions are future implementation tasks.
- Audit table is append-only for UPDATE/DELETE, but hash-chain integrity and transactional event insertion are not yet implemented.
- Release-candidate gating remains to be implemented and tested before use.
- Database migration tests and preservation CI for this commit have not yet been verified.

**Do not merge or deploy this migration as a finished verification system.**
