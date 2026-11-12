# Phase 4D.2 — Transaction prototype audit: remaining blocking defects

Reviewed the unapplied five-argument RPC draft. Do not grant EXECUTE.

## Blocking issue: cross-submission idempotency races
The current RPC locks the target submission row, but two simultaneous requests using the same request_id against **different** submissions do not share a lock. The unique request_id index prevents duplicate persistence, but the loser may receive a database uniqueness error rather than the stable idempotent response. In the complete RPC, acquire a transaction-scoped advisory lock keyed to the request UUID **before** checking existing request state, or use a dedicated request ledger with unique constraint and transaction-safe retry handling. Preserve the submission row lock and a deterministic lock order. Never catch a uniqueness exception and commit partial writes.

## Blocking issue: submission-linked conflict serialization
Opening or resolving a conflict must lock the parent submission row before mutating the conflict table. The approval RPC must also lock the parent row before checking unresolved conflicts. The existing conflict guard is insufficient to enforce that shared locking protocol for all mutation paths. Add a reviewed trigger or revoke all direct writes and require locked RPCs. Test concurrent approval vs conflict creation.

## Blocking issue: approval-to-release revision
The release-candidate trigger currently requires an approval review matching the **resulting** revision, but review insertion occurs at the **submitted** revision. Coordinate the guard change with the atomic approval transaction. Do not change the guard before review-history and provenance tests.

## Blocking issue: current review-history cutover
The legacy unique index (submission_id, reviewer_id) must be replaced in a coordinated staging migration, not merely supplemented by the new per-revision index. Before dropping, confirm the index is a backing object for a UNIQUE constraint; use ALTER TABLE DROP CONSTRAINT if it is. Preserve historical review rows.

## Blocking issue: source verification and trust
The source registry draft is empty and inactive. A domain match is not proof that an official document supports the specific passport/destination/access claim. A human-verifiable authority attestation and evidence snapshot, plus server-side source and claim validation, are required before approval can be enabled.

## Additional checks
- Validate availability of sha256(bytea) in staging PostgreSQL version.
- Check review rationale database CHECK against RPC's length threshold.
- Verify SQL migration idempotence: ADD CONSTRAINT is not IF NOT EXISTS; rerunning the migration can fail.
- The 4-argument and 5-argument RPCs are separate overloads; remove the obsolete prototype before any grant.
- Restrict SECURITY DEFINER function ownership, EXECUTE grants and role impersonation pathways.
- Verify the audit insert and any failure are within the same transaction.
- CI preservation harness does not execute SQL migration or database race tests.

## Recommended next step
Provision or identify an **isolated non-production Supabase project**. Execute migrations and synthetic concurrent integration tests there only after reviewing the migration bundle. Production project higmlrqrgxdhvkmrdpru must not be used for staging execution.
