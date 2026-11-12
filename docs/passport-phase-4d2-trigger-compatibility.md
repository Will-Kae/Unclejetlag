# Phase 4D.2 — Trigger compatibility review (19 October 2026)

**Read-only findings. No production writes authorized.**

## Confirmed trigger behavior
- passport_enforce_independent_review: locks submission row; rejects self-review; requires active reviewer/admin profile.
- passport_enforce_review_revision: locks submission row; requires status submitted and review.reviewed_revision equal to submission.revision at INSERT time.
- passport_check_release_candidate: requires approved evidence, no open conflicts and independent approval review with reviewed_revision equal to evidence.revision at release-link time.
- passport_protect_linked_evidence: prevents updates of release-linked submissions.
- passport_protect_linked_conflicts: blocks opening conflicts on release-linked evidence.
- passport_audit_immutable: rejects UPDATE and DELETE.

## Blocking revision-semantics mismatch
If an editorial review is inserted while submission.revision=N (as required by review trigger), and the submission is then approved with revision=N+1, the existing release-candidate trigger seeks an approval review for revision=N+1. That review was recorded for N, so release candidate linking fails. Reversing operations also fails: inserting review after status update violates the submitted-only trigger. Do NOT work around this by falsifying reviewed_revision or skipping revision increments.

## Required resolution before migration
Choose and document one consistent invariant, preferably **reviewed_revision = the submitted revision N** and **approved evidence revision = N+1**; adapt the release-candidate guard to check the approved revision's immediately preceding reviewed revision and verify no intervening mutations, with robust integer/overflow checks. Alternatively redesign revision semantics globally with explicit migration and regression testing. Security/DBA sign-off required.

## Other checks before SQL
- Inspect table constraints, indexes, grants, existing rows, trigger execution ordering, function ownership and security invoker/definer boundary.
- Verify source provenance and unresolved conflicts from database records; never trust browser booleans.
- Ensure approval, submission transition and immutable audit are one transaction and retry/idempotency-safe.
- Do not add direct authenticated DML grants or any production service-role key.
- Staging tests must cover release-link after approval, stale review, race, open conflict, replay, audit rollback and zero public ranking changes.

## Gate
No executable migration or deployment until mismatch is resolved in reviewed SQL and tested on an isolated database.
