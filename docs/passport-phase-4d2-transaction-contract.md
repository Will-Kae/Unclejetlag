# Phase 4D.2 — Editorial transaction contract and migration order

Status: **Design approved for further staging implementation only. Not authorized for production.**
Checked against live schema using read-only queries on 19 October 2026.

## Decision 1: revision lifecycle
- Submission at revision N, status submitted.
- Insert review for reviewed_revision=N while row is locked and status is submitted.
- Transition status to approved/rejected/changes_requested and increment revision to N+1 in the **same transaction**.
- Release-candidate eligibility requires an independent approval for N where approved submission revision=N+1, no open conflict and no subsequent edit.
- Keep existing linked-release immutability and review triggers.
- Never automatically publish approved evidence.

## Decision 2: repeated review cycles
- Current unique index (submission_id, reviewer_id) prevents the same reviewer from reviewing a resubmission.
- Staging migration should replace it with unique (submission_id, reviewed_revision, reviewer_id), **after** verifying no existing duplicates and while holding appropriate DDL locks.
- One review per reviewer per revision is allowed; a second reviewer racing after first decision must fail status/revision checks.
- Repeated requests must use a durable idempotency key (proposed new request_id UUID, unique on reviews or separate requests table) and must return a prior result only when the same actor, submission, revision, decision and request fingerprint match.
- The idempotency key is distinct from the review UUID; it must be generated client-side per intentional action and validated server-side.

## Decision 3: trusted execution boundary
- An authenticated user can invoke only a narrowly scoped SECURITY DEFINER review function; revoke default PUBLIC execute, explicitly grant to authenticated.
- Function identity comes from auth.uid(); never accept reviewer_id or role from the request.
- Explicitly set search_path to pg_catalog and schema-qualify public/auth objects.
- Lock target submission row FOR UPDATE, then verify active reviewer/admin, independence, status and revision.
- Validate source evidence using trusted database records and official source allowlist; no client-supplied sourceVerified boolean may authorize approval.
- Check open conflicts under a concurrency-safe locking strategy; add constraints or trigger checks to prevent conflicts being opened concurrently with approval/release.
- Write review, update submission and insert immutable audit within one function call/transaction. Any exception rolls back all three.
- No direct authenticated DML grants on protected tables; no service-role credentials exposed to browser.

## Decision 4: audit and rollback
- Audit id is bigint GENERATED ALWAYS AS IDENTITY; omit id from inserts.
- Audit payload should include submission id, reviewed revision, resulting revision, decision, request id and review id, without raw private evidence.
- Rollback of schema/function changes must not delete historical audit or existing review records.
- If migration rollback would strand newer review histories, disable writes first and retain the expanded index/schema until reconciliation.

## Sequenced staging implementation
1. Clone sanitized schema and synthetic test identities into isolated staging.
2. Implement idempotency uniqueness and revised review uniqueness.
3. Implement transaction function with identity/role/revision/source/conflict validation.
4. Update release-candidate trigger to N -> N+1 rule atomically with migration; retain all other checks.
5. Test rollback on deliberately failed audit insert, two simultaneous reviews, stale retry and duplicate request id.
6. Test request_changes -> edit -> resubmit -> same reviewer.
7. Verify anon/authenticated direct table writes denied and no public passport dataset mutation.
8. Obtain independent security review and explicit production authorization before any apply/merge/deploy.

## Unresolved prerequisite
The authoritative official-source validation rules and trusted source registry must be specified before the function can safely permit approval. Do not substitute URL shape checks for source authenticity. An approval RPC should fail closed until this prerequisite is met.
