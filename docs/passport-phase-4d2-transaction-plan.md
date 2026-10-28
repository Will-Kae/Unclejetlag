# Phase 4D.2 — Transactional editorial review migration plan (DRAFT ONLY)

No SQL in this document is authorized for execution. Production must remain read-only.

## Confirmed production facts (read-only inspection, 19 October 2026)
- Eight public passport tables have RLS enabled. Seven have no authenticated-user policies.
- Only authenticated SELECT on active own research profile is granted.
- Submission statuses: draft, submitted, changes_requested, approved, rejected.
- Review decisions: approve, reject, request_changes. Disputes use a separate conflict table, not a review decision enum.
- Existing triggers enforce review independence, reviewed revision, linked-evidence safeguards, release-candidate safeguards and immutable audit updates/deletes.
- Current preflight in src/lib/passport/editorial-review.ts does not persist or publish anything.

## Proposed transaction boundary
A dedicated SQL function should accept submission UUID, expected revision, enum decision, rationale, verified evidence reference and a request correlation identifier. The function MUST:
1. Derive reviewer from auth.uid() and verify an active reviewer/admin profile inside the transaction.
2. SELECT target submission FOR UPDATE; verify submitted state and exact revision.
3. Reject submitter == reviewer even if the caller is admin.
4. Verify evidence provenance, date, allowed official source and absence of unresolved conflict for approvals using database state, not client booleans.
5. Insert review with reviewer_id, reviewed_revision, decision and rationale.
6. Update submission status and increment revision atomically.
7. Insert immutable audit record in the same transaction; failure of any step rolls back all.
8. Return only non-sensitive outcome and updated revision; never update public dataset or release candidates.

## Critical migration review items
- Inspect full trigger/function definitions and indexes, not merely trigger names.
- Check whether existing review-revision trigger expects pre- or post-update revision; align operation ordering.
- Check audit INSERT permissions and SECURITY DEFINER owner privileges. Fix search_path and schema-qualify all objects.
- Prefer a narrow, audited function with EXECUTE granted only to authenticated; revoke EXECUTE from PUBLIC and anon.
- Do not grant direct client writes to review, audit or release tables.
- Protect against duplicate review and idempotency collisions using a database uniqueness constraint or durable request token.
- Keep disputes as separate conflict lifecycle; do not add unsupported enum values casually.
- Test rollback with representative synthetic data in an isolated staging database.
- Record migration down-plan; preserve append-only audit history.

## Required staging tests
- Authorized independent approval, reject and request_changes.
- Inactive researcher, inactive reviewer, role spoof, anonymous, self-review and cross-tenant access denied.
- Concurrent reviewer race, stale revision, duplicate submission, invalid state, blank rationale denied.
- Missing official source, outdated source, conflicting evidence, unsafe URLs denied.
- Review + submission update + audit insertion atomicity on forced failure.
- Direct SQL authenticated INSERT/UPDATE/DELETE remains denied for protected tables.
- Public passport dataset and rankings byte-for-byte unchanged.

## Gate
Do not apply migration, activate UI writes, merge PR or deploy until independent security review, passing CI and explicit production authorization.
