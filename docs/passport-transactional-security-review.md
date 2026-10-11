# Phase 2B-B deployment gate: transactional verification RPCs

## Verified state
- Supabase project: `higmlrqrgxdhvkmrdpru` (dedicated Uncle Jetlag project).
- Applied migrations: foundation, release candidate guard, release freeze, review revision guard.
- Transactional workflow migration `20261011040000_passport_transactional_workflow.sql` is **not applied**.
- No private workspace route is enabled and no passport data is published.

## Security review blockers

1. The proposed `SECURITY DEFINER` RPCs reside in the exposed `public` schema. This requires explicit scrutiny of ownership, EXECUTE grants, role checks, and a strictly fixed `search_path`. Prefer a private, unexposed schema with a carefully authenticated server-only entry point.
2. `auth.uid()` must be derived from a real authenticated Supabase session; no client-supplied actor ID is allowed.
3. Existing `passport_verification_reviews` has `unique(submission_id, reviewer_id)`; this prevents the same reviewer from reviewing a later revision. Decide whether to scope uniqueness to revision and define how prior reviews remain immutable.
4. `changes_requested` has no implemented resubmission transition or revision increment. The review workflow must be complete before release.
5. The current review trigger checks the reviewer's role and the submission state; test ordering of triggers, status updates and audit insertion under concurrent requests.
6. A release candidate's review can be invalidated if reviewer activation changes. Define whether release eligibility is checked at association, at publication, or both.
7. The initial smoke SQL script cannot run until the migration exists. Run on a disposable development project and create real test users using supported Supabase Auth APIs; never seed `auth.users` directly.
8. `passport_evidence_submissions` allows changing fields outside the release freeze. Add an auditable revision/state machine and forbid edits to already approved evidence unless explicitly reopened.
9. Verify all sensitive functions are non-executable by `anon` and `PUBLIC`. Do not expose service-role or secret credentials to browsers.

## Required acceptance tests

- Unauthenticated user cannot submit, review, list, or prepare a release.
- Researcher can submit evidence but cannot review it.
- Reviewer can approve a different user's submitted evidence but not their own.
- Disabled reviewer cannot approve; stale revisions cannot be approved.
- Missing rationale, malformed source URLs, duplicate review and concurrent review attempts fail without partial audit entries.
- Approval and audit event commit together; rollback on audit failure.
- Open conflict and stale approval block release; release-linked evidence cannot be mutated.
- Preservation harness, Next.js typecheck, and CI pass.

**Do not merge or deploy PR #8 until these gates are satisfied.**
