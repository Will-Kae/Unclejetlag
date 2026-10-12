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


## 2026-10-12 hardening progress (not deployed)

- Staged migration `20261012090000_passport_review_permissions_hardening.sql` changes review uniqueness to `(submission_id, reviewer_id, reviewed_revision)` and revokes direct client EXECUTE on two trigger functions.
- This migration is **not a complete transactional workflow fix**. It must be applied and verified in a disposable database before any deployment.
- Do **not** deploy `20261011040000_passport_transactional_workflow.sql` as written: its `public` SECURITY DEFINER RPCs grant EXECUTE to every authenticated Supabase user. Even with profile checks, use a private schema and a trusted server-only entry point where possible.
- Required resubmission state machine: `submitted -> changes_requested -> submitted` increments revision exactly once; only the original active researcher or explicitly authorized admin may resubmit; lock the submission row; preserve old review history; log actor, prior/new revision and changed fields atomically. Approved/rejected evidence is immutable unless a separately audited administrative reopening mechanism is designed and approved.
- Validate every `p_decision` explicitly; reject NULL or unexpected enum values rather than defaulting to `changes_requested`.
- Use strict source URL parsing/allowlisting for any server-side fetching; do not fetch user-supplied URLs from the database without SSRF controls.
- Release eligibility must be rechecked in the same transaction as final publication, including active independent approval for the current revision, no open conflicts, and immutable dataset hash.
- Acceptance tests still outstanding: revision resubmission, immutable approved evidence, audit rollback, concurrent reviews, stale revision rejection, disabled reviewer, release race, negative privilege checks, and Next.js/CI checks.
