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

The profile-policy acceptance work identified at this checkpoint was subsequently
run with synthetic identities; see the profile RLS checkpoint below. Any fixture grants
must match a separately reviewed application access contract, exist only inside
the disposable database, and must not enable review execution or publication.
Do not weaken grants simply to obtain a passing ownership test.

RPC self-review, stale revision, idempotency, source provenance, atomic
review/status/audit rollback and alternative isolation-level races remain
unverified by this checkpoint. The previously reported manual transaction and
trigger tests are separate evidence and do not close these RPC-level gates.
Keep PR #21 draft; no production migration, merge, deployment, approval
enablement or ranking publication is authorized by these results.


## Step 62 profile RLS checkpoint — 26 October 2026

Evidence: user-supplied terminal output from commit
`7960865e9306dd77b94340e7a4cf82d56ef57eba`, running
`ALLOW_LOCAL_PROFILE_RLS=yes` in the disposable local clone.
This is reported local evidence, not CI or production verification.

The test preserved the existing `passport_active_profile_self_read` policy.
It added candidate schema USAGE and SELECT on only `user_id,role,active`
for authenticated inside the clone. These fixture grants were necessary because
the source test database's blanket privilege denial prevents the policy from
being exercised. This is evidence for the existing policy under that candidate
access contract; it does not establish current production access behavior or
authorize applying grants elsewhere.

| Scenario | Reported outcome |
| --- | --- |
| Active researcher A, unfiltered read | Exactly own profile |
| Active reviewer B, unfiltered read | Exactly own profile |
| A explicitly filters for B | No rows |
| B explicitly filters for A | No rows |
| Inactive profile identity | No rows |
| Identity with no profile | No rows |
| Anonymous profile request | Denied |
| A deactivated after initial successful read, same token reused | No rows |
| Review RPC EXECUTE for anon/authenticated/service_role | Denied by catalog preflight |
| Anonymous and authenticated RPC HTTP requests | Rejected by database privilege check |
| Temporary API and clone | Both removed |

### Current gate state

- Local anonymous/JWT denial and existing-profile-policy read scenarios above:
  reported PASS within their stated scope. Do not repeat unchanged smoke tests.
- The minimal profile-read access contract still needs independent review before
  any production grant or migration. No broad evidence-table grants are implied.
- Real Supabase Auth issuance, application login/logout, session revocation and
  the actual server `verifyResearchSession` path are not tested by these synthetic
  PostgREST requests.
- RPC internal authorization, self-review, stale revision, idempotency, trusted
  source/provenance validation, atomic review/status/audit rollback and remaining
  isolation/concurrency acceptance remain open. HTTP rejection cannot prove RPC
  internals because EXECUTE remains denied.
- Step 62 remains OPEN; source verification and atomic approval gates remain
  blocked. Keep approvals and publication disabled and PR #21 draft. No
  production migration, merge or deployment follows from these local results.

The next distinct verification boundary is the real application/Auth session
path in a separately isolated test environment. Do not point an Auth service at
production or retarget an existing local service to the disposable database.


## Step 62 real Auth service checkpoint — 28 October 2026

Evidence: user-supplied terminal output from
`scripts/passport-phase-4d2-step62-auth-isolated-local.py` at commit
`7fea5d70b74cb4299c899ef1074f9449825732eb`, with
`ALLOW_LOCAL_DISPOSABLE_AUTH=yes ALLOW_LOCAL_FRESH_AUTH_DB=yes`.
Reported local evidence only; not independently executed CI or production proof.

### Isolated setup and migration provenance

The hand-built passport fixture has zero Auth migration records. The working
local Auth database has 82. A new database from template0 and separate instance
of the installed Auth image were used; neither existing database was upgraded.

The fresh Auth service applied 75 migrations. The exact seven IDs present only
in the working Supabase database were independently matched to the historical
records seeded by Supabase PostgreSQL's bootstrap:
`migrations/db/init-scripts/00000000000001-auth-schema.sql`
(reviewed source blob `ad47aadd9c2acf3cdb78ec569860ca695bea4152`).
The fresh service's `00_init_auth_schema.up.sql` provides consolidated setup.
The harness accepts only this exact seven-ID difference for the fresh disposable
case with matching remaining migration sets and a `00` entry on both sides.
No migration records were copied or stamped. This does not establish complete
schema equivalence.

The local postgres role could create databases but could not SET ROLE to
supabase_auth_admin. The harness therefore retained creator ownership and granted
USAGE/CREATE on only the disposable auth schema to the existing Auth role.
No role memberships or existing database/service settings changed.

| Check | Reported outcome |
| --- | --- |
| Separate Auth API and fresh signing key | Healthy on loopback |
| Synthetic confirmed user creation via Auth API | Passed; no email sent |
| Wrong password | Rejected with invalid_credentials |
| Correct password | Auth-issued access and refresh tokens |
| Issued session_id | Matching auth.sessions row |
| Auth /user before logout | Validated issued identity |
| Local Auth logout | Matching session removed |
| Refresh after logout | Rejected |
| Old access token at Auth /user after logout | Rejected in this installed local Auth configuration |
| Temporary Auth container and database | Both removed |

### Remaining application and editorial boundaries

The Auth-service smoke scenario above is complete within its stated scope.
Do not rerun it unchanged. The old-token result applies to this specific
Auth /user test, not every JWT consumer or production configuration.

Application `verifyResearchSession`, the real login server action, cookie
attributes/path/clearing, protected browser-route behavior, CSRF handling and
application logout-to-Auth integration still need an end-to-end test. This Auth
smoke test did not run Next.js or PostgREST and does not close those boundaries.
The earlier profile RLS and disabled-RPC evidence is separate.

Step 62 remains OPEN. Editorial RPC internals, transactional review/audit
guarantees, trusted-source verification and remaining concurrency/isolation
gates are still open. PR #21 remains draft; approvals and publication stay
disabled. No production migration, merge or deployment is authorized.


## Application logout and dependency checkpoint — 28 October 2026

At application commit `f6fdf46`, the user reported 20/20 tests passing across
`passport-admin-session.test.ts` (11) and `passport-admin-logout.test.ts` (9),
followed by successful `next typegen && tsc --noEmit`. These exercise mocked
provider/framework boundaries, not browser end-to-end behavior.

The draft logout fix now calls Auth's local-scope logout endpoint before clearing
the cookie. Success redirects; a provider/config/network failure still clears
the local cookie and returns HTTP 503 with revocation explicitly unconfirmed.
Missing/cross-site origins remain denied before provider calls or cookie changes.

The user's installation reported five audited dependency findings: one moderate,
one high and three critical. This was independently reproduced against the
committed lockfile. The audited packages were Next.js, Zod, Vitest, @vitest/mocker
and tinypool (test dependency findings include inherited severity).

Dependency candidate at `b2893f7` pins Next.js 16.4.1, Zod 4.6.6 and Vitest
4.1.12, with the npm-generated lockfile. This is a controlled Vitest major update,
not npm audit fix --force. No install scripts were executed in the isolated
dependency-check workspace. Independent checks there reported:
- npm audit: zero findings across production and development dependencies.
- The actual two session/logout test files: 20/20 pass on Vitest 4.1.12.

The dependency workspace contained the relevant source/test files, not the
complete application. Full-suite regression, typecheck and production build on
the complete checkout remain required for this dependency candidate. A zero
registry audit is not proof that all security risks are eliminated.

Real browser login, cookie behavior, protected routes, CSRF and application
logout-to-Auth integration remain unverified end-to-end. The existing real Auth
service and profile-policy local results are separate evidence. Step 62 remains
OPEN; approvals and publication stay disabled. No production deployment or
database settings were changed by these draft commits.


## Complete-checkout regression checkpoint — 28 October 2026

Evidence: user-supplied Mac terminal output at `6467958` after a clean
`npm ci --include=dev`, followed by the entire command chain below:

| Check | Reported outcome |
| --- | --- |
| Full Vitest 4.1.12 run | 28 files passed, 3 skipped; 442 tests passed, 4 skipped |
| Monitor security suite | 27 passed, including six-process concurrent store writes |
| Typecheck | next typegen and tsc --noEmit passed |
| Prebuild assets | Fonts copied; 67/67 photos ready |
| Next.js 16.4.1 production build | Compiled and generated 442/442 static pages |
| Final npm audit | Zero reported vulnerabilities |

The earlier missing-esbuild failure is resolved by declaring esbuild 0.28.2 as a
direct development dependency. The complete-checkout results above supersede
the dependency candidate's earlier partial-workspace validation limit.

Non-failing notices remain: npm install-script approvals for optional/native
packages, Vite's future native-config-loader compatibility warning, and Next's
ignored parent-directory lockfile notice. None prevented this reported run;
the harness/test assertions were not weakened or baselines regenerated.

These are local user-reported results, not independent CI or browser evidence.
The existing Playwright preservation harness is the next regression gate:
run against the new local production build with one worker and no reuse of an
existing server. Its public/anonymous coverage does not establish authenticated
browser login, cookie or logout-to-Auth behavior. Real authenticated application
integration and the editorial RPC/source/transaction gates remain open.

Step 62 remains OPEN. No merge, production deployment, database change,
approval enablement or ranking publication is authorized by this checkpoint.
