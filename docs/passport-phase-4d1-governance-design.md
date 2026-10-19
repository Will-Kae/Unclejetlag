# Phase 4D.1 — Editorial Governance Security Design (DRAFT)

Status: design only. No production schema changes, writes, approvals, publication, or release authorization.

## Baseline
- Phase 4C.7 workspace reads repository evidence only; it has no database write client.
- Research identities are verified server-side with Supabase Auth and active research profile.
- Existing database entities include submissions, artifacts, reviews, conflicts, audit, release candidates and profiles.
- RLS is enabled on all eight passport tables; seven have no policies and deny ordinary authenticated access. Do not apply the earlier Phase 4C.2 draft SQL without a separate review.

## Workflow
1. Researcher creates a draft, edits only their own drafts, attaches provenance and submits.
2. Independent reviewer checks official source, date, destination/passport pairing, contradictory evidence, and classification. Reviewer cannot approve their own submission.
3. Reviewer records approve / request changes / reject / dispute with mandatory rationale, actor, reviewed revision and audit event in one transaction.
4. Disputes remain blocked until separately resolved with a traceable rationale and evidence.
5. Administrator may assemble a release candidate from eligible approved, undisputed revisions. Candidate creation does NOT publish.
6. Publishing requires a distinct explicit release action and independent release gate, outside Phase 4D.1 and 4D.2.

## Security invariants
- All mutations execute in server-side authenticated actions; derive actor from verified session, never browser-supplied identity or role.
- Enforce roles in database transaction as well as server authorization. Do not expose a service-role key to client bundles.
- Reject inactive profiles, unauthorized roles, self-review, stale revisions, illegal transitions, missing reasons, unsupported source evidence and replayed operations.
- Lock submission rows and use revision checks to avoid concurrent approvals; write review and audit in same atomic transaction.
- Restrict evidence file paths, content types, file sizes, signed URL scope and source provenance. Prevent unsafe external URL fetching.
- Deny direct authenticated INSERT/UPDATE/DELETE on approval, release and audit tables. Use tightly scoped SECURITY DEFINER functions only after privilege, search_path, EXECUTE grants and SQL injection review.
- Immutable or append-only audit history; log actor, action, object, old/new state, revision, timestamp and request correlation ID without secrets.
- No data from unapproved proposals may enter public classifications or ranking calculations.
- Keep all production writes and publication disabled until independent review and explicitly approved migrations.

## Implementation sequence (future, not authorized here)
1. Validate enum labels, triggers, constraints, grants, existing data and RLS through read-only inspection.
2. Draft idempotent migration and rollback SQL, do not apply.
3. Implement pure transition validator and server authorization boundary with unit tests.
4. Add transactional review RPC after security review; use test database only.
5. Add accessible reviewer UI behind a disabled-by-default feature flag.
6. Run negative tests for cross-user access, self-approval, stale revision, role spoofing, double-submit, missing audit, and public data leakage.
7. Seek separate approval before any production migration, merge or deployment.

## Release gates
- Security and DBA review of migration, functions, grants and RLS
- CI tests, staging migrations, rollback rehearsal and audit invariants
- Human review of disputed official sources and evidence quality
- Publication gate remains disabled even when editorial review becomes functional
