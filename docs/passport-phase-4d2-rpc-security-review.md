# Phase 4D.2 — RPC security review and staging acceptance gates

**Status:** Development-only security review. No SQL applied. No public grant.

## Scope of current draft
`docs/sql/passport-phase-4d2-STAGING-review-rpc-disabled.sql` is an intentionally restricted prototype. It can only reject or request changes, and its approval branch always raises an exception. It has no authenticated EXECUTE grant. The schema migration and review RPC must not be promoted independently.

## Findings requiring remediation before enabling
1. **Invoker identity:** `auth.uid()` is not sufficient by itself when a SECURITY DEFINER function is exposed to privileged backend actors. Ensure the entrypoint is restricted to the intended authenticated role and that trusted backend service invocations cannot impersonate a reviewer. Add explicit role/session boundary tests.
2. **Review uniqueness:** the existing `(submission_id, reviewer_id)` unique index blocks a second review after a request-changes cycle. Add and validate per-revision uniqueness, then replace the legacy index in one controlled staging migration.
3. **Idempotency:** no request key or replay protection exists yet. Define a unique request identifier with payload fingerprint, and make same-request retries return the existing result without duplicating the audit.
4. **Source authority:** the registry draft has no verified entries and no substantive claim validation. Approval must remain disabled until the official source, artifact provenance, document date, and specific visa-access claim are independently verified on the server.
5. **Conflict race:** checking for open conflicts is insufficient unless creation/resolution and approval share a consistent locking strategy. Use submission-row serialization for both workflows.
6. **Release revision:** the existing release trigger still requires review revision equality. Coordinate its update to the N-to-N+1 approval invariant with the review migration; do not weaken independent-review checks.
7. **Audit:** verify a forced audit insertion failure rolls back the review insert and submission update, and confirm audit history cannot be edited or deleted by any client role.
8. **Revision overflow:** explicitly guard `revision < 2147483647` before incrementing the integer column.
9. **Linked evidence:** preserve the release-linked immutability guard; avoid a path that edits linked approved evidence.

## Isolated staging acceptance matrix

| Scenario | Expected outcome |
| --- | --- |
| Anonymous request | Denied |
| Researcher attempts review | Denied |
| Inactive reviewer | Denied |
| Reviewer reviews own submission | Denied |
| Reviewer submits stale revision | Denied |
| Two reviewers race on same submitted revision | Exactly one transition commits |
| Repeated identical request id | One review and one audit, stable result |
| Reused request id with different payload | Rejected |
| Request changes, edit, resubmit, same reviewer | Supported only after uniqueness migration |
| Unverified registry source | Approval denied |
| Trusted host but unsupported visa-access claim | Approval denied |
| Source mismatch or missing provenance | Approval denied |
| Conflict opened concurrently with approval | Serialized, no invalid approval |
| Audit insert deliberately fails | Entire transaction rolls back |
| Approved N+1 linked to release candidate | Only valid independent approval for N qualifies |
| Published passport data | No mutation from editorial review |
| Browser role direct table DML | Denied |

## Release gating
The current draft cannot be declared production-ready merely because GitHub CI passes: GitHub's preservation tests do not execute these SQL files against an isolated database. A sanitized staging clone, database migration runner, verified source policy and independent security review are required before any execution grant or production authorization.


## Step 62 local HTTP checkpoint — 26 October 2026

Evidence: user-supplied Mac terminal output from
`scripts/passport-phase-4d2-step62-http-isolated-local.py` at commit
`094e09074b22a6fc31d5761b1c69c03129dc06ce`. These are reported local
results, not an independently executed CI or production test.

| Check | Reported result |
| --- | --- |
| Disposable PostgREST startup | Ready with public-only schemas and extra search path |
| Anonymous GET submissions, reviews and profiles | HTTP 401 for all three |
| JWT signed with wrong key | HTTP 401 |
| Expired synthetic JWT | HTTP 401 |
| Valid synthetic authenticated JWT GET all three resources | HTTP 403; harness requires PostgreSQL code 42501 |
| Five-argument review RPC catalog privileges | Function exists; EXECUTE denied to anon, authenticated and service_role |
| Anonymous POST to disabled review RPC | Database privilege rejection |
| Authenticated synthetic JWT POST to disabled review RPC | Database privilege rejection |
| Temporary API and database clone cleanup | Both removed |

The readiness experiment isolated an inherited `extensions` extra-search-path
entry absent from this passport clone. Restricting the disposable API's extra
search path to `public` restored readiness. No schema creation, database grants,
existing service reconfiguration, production changes or approval activation
were performed by this HTTP test.

### Limits and next gates

**Step 62 remains OPEN.** Blanket privilege denial prevents these requests from
demonstrating ownership-policy behavior or reaching the review RPC body.
The synthetic signing key belongs only to the disposable API; this does not test
Supabase Auth issuance, actual research identities, session revocation or logout.

Next isolated acceptance work must establish synthetic identities and a positive
control for the intended active-own-profile read path, then compare another
user's profile, inactive profile and unauthenticated requests. Any fixture grants
must match a separately reviewed application access contract, exist only inside
the disposable database, and must not enable review execution or publication.
Do not weaken grants simply to obtain a passing ownership test.

RPC self-review, stale revision, idempotency, source provenance, atomic
review/status/audit rollback and alternative isolation-level races remain
unverified by this checkpoint. The previously reported manual transaction and
trigger tests are separate evidence and do not close these RPC-level gates.
Keep PR #21 draft; no production migration, merge, deployment, approval
enablement or ranking publication is authorized by these results.
