# Phase 4D.2 — Additional database constraint findings

Read-only Supabase inspection, 19 October 2026. No migration applied.

## Review uniqueness constraint
The current unique index `passport_verification_reviews_submission_id_reviewer_id_key` covers **(submission_id, reviewer_id)**. This means one reviewer cannot submit a second review for the same evidence submission even if the evidence was revised and resubmitted. A naive retry of the transactional workflow will also hit a uniqueness violation.

Before enabling editorial write actions, decide and test whether:
- Each submission permits one lifetime review per reviewer, with a new submission created for a new review cycle; OR
- Reviews are versioned by (submission_id, reviewed_revision, reviewer_id), with explicit migration and duplicate/idempotency handling.

The second option is more consistent with changes_requested -> resubmitted cycles, but requires a reviewed schema change, safe data migration, and independent security signoff. Do not drop the current unique index until the replacement uniqueness and idempotency controls are verified.

## Other confirmed checks
- Evidence submission revision has a CHECK constraint.
- Review rationale has a CHECK constraint.
- The release-link guard's review revision mismatch remains a blocker until reviewed.
- Existing reviewer and revision triggers lock submission rows before inserting review.

## Additional staging test requirements
1. Request changes -> edit -> resubmit -> same reviewer review: verify expected lifecycle.
2. Repeat identical review request: deterministic idempotent result, no duplicate audit rows.
3. Two reviewers racing on one submission: one transition wins, other gets stale revision.
4. Failed audit insert: entire review and submission transition rolls back.
5. Release-link accepts only an independent current approval, not an earlier stale approval.

Production and public passport data must remain unchanged.
