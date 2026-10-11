# Phase 2B-B — Independent Verification & Evidence Management

Status: implementation planning baseline. **No database, authentication, or workflow is deployed by this document.**

## Goal and boundaries

Create a private, auditable research and verification workflow for Uncle Jetlag's World Passport Index. The authoritative published dataset remains `src/lib/passport/data.ts`. No submitted evidence, AI suggestion, monitor alert, or single-person review may publish or change a visa rule automatically.

Phase 2B-A monitoring produces review items; Phase 2B-B must support human evidence submissions, independent second review, conflicts, and approved release candidates. Admin UI and automated release belong to later phases.

## Decisions / prerequisites

- Proposed persistence: a **new Supabase Postgres project**; no Supabase database is presently wired to the repository. Do not assume a project, credentials, or migrations exist.
- Proposed identity: Supabase Auth, invite-only. Roles: `admin`, `researcher`, `reviewer`. No public sign-up.
- Named independent reviewers must be actual humans other than the submitter. AI assistance must be disclosed and never counts as second review.
- Secrets must remain server-side. Never expose a service-role key in `NEXT_PUBLIC_*` variables.
- Do not introduce public API routes or a browser-accessible admin workflow before authentication and authorization are implemented and tested.

## Required data model (migration proposal, not yet applied)

- `passport_research_profiles`: `user_id` PK (auth.users FK), role, active, created_at. Admin-only role changes.
- `passport_evidence_submissions`: UUID PK, rule identifier / passport / destination, proposed access classification, source URL and source ID, source document date, observation date, rationale, `ai_assisted`, submitter ID, created_at, status, revision.
- `passport_evidence_artifacts`: UUID PK, submission FK, SHA-256, content type, private storage object key, retrieval time, size, provenance; reject unsafe content and public buckets.
- `passport_verification_reviews`: UUID PK, submission FK, reviewer ID, decision (approve/reject/request-changes), rationale, created_at; enforce reviewer != submitter in database and service layer. A reviewer cannot approve their own submission, even if they also have admin role.
- `passport_verification_conflicts`: UUID PK, submission FK, conflicting source/rule reference, description, resolution status, resolver ID, timestamps.
- `passport_release_candidates`: UUID PK, immutable approved submission IDs and dataset digest, created_by, status, created_at. No auto-publication.
- `passport_verification_audit`: append-only event ID, actor, action, object ID, event payload, timestamp; restrict UPDATE/DELETE to trusted maintenance procedures, with tamper-evident chaining or equivalent integrity control.

Use database transactions for status transitions, uniqueness/idempotency constraints for repeated submissions and reviews, and explicit foreign keys and indexes. Prefer typed, versioned migrations.

## Workflow and invariants

1. Researcher creates a draft with official source evidence and source URL. Evidence provenance and verification dates are mandatory; unknown stays unknown.
2. Submission freezes the submitted revision for review; edits require a new revision.
3. A different authenticated human reviewer checks the primary official evidence, source date, exceptions, reciprocity and scope. AI-generated text is not evidence.
4. Reviewer approves, rejects, or requests changes with written reasoning. No self-approval.
5. Contradictory sources or ambiguous rules go to conflict resolution; unresolved conflicts block release candidates.
6. Only approved, independently reviewed records may enter a release candidate. Publication still requires an explicit reviewed PR changing `data.ts`, methodology/version, coverage report and reproducibility snapshot.

## Security requirements

- Supabase Row Level Security on every user-accessible table; default deny. Use server-side authorization for all mutations, not only UI controls.
- Researcher can access own drafts and assigned work only; reviewer can read assigned evidence and write own decisions, but cannot edit submitted evidence; admin can assign and resolve, but cannot bypass independent approval.
- Never allow client-provided `submitter_id`, `reviewer_id`, role, status, or approval timestamp to override authenticated server identity and state machine.
- Private object storage with scoped, expiring access and upload size/type validation; redact tokens and personal data from logs.
- Validate official-source URL and artifacts before retrieval. Never permit server-side fetching of arbitrary user-submitted URLs.
- Audit each state transition, assignment, reviewer decision, conflict resolution, and release-candidate action.
- Preserve 2B-A single-machine FileStore limitations; do not silently reuse it as a multi-instance production database.

## Priority backlog

1. Independently re-evaluate the **17 `absent-from-list` visa-required rules**: establish whether each official list is exhaustive, check exceptions, record corroboration and second reviewer identity. No mass approval.
2. Review the existing 640 rules for freshness and evidence sufficiency, starting with high-impact destinations.
3. Continue growing verified coverage without inventing access status for the remaining unknown pairs.

## Acceptance criteria / tests

- Database tests prove RLS denies unauthenticated and unauthorized reads/writes.
- Tests prove a submitter cannot approve their own submission, including role escalation and concurrent requests.
- Tests prove two separate human identities, explicit approval and no unresolved conflicts are necessary for release candidacy.
- Tests prove duplicate submissions, retries and simultaneous reviews are deterministic and auditable.
- Tests prove artifacts are private and malicious/oversized uploads are rejected.
- Tests prove no workflow action changes published `data.ts`, passport rankings, SEO, affiliates, Travelpayouts, consent, or production configuration.
- Run typecheck, unit tests, build, and preservation/browser harness before marking a PR ready for review.

## Delivery sequence

1. Schema, RLS, migrations and database test harness (no production credentials).
2. Typed server-only persistence and domain state machine with deterministic tests.
3. Invite-only authentication and reviewer assignments (separate from public site).
4. Evidence artifact handling, conflicts and release candidate export.
5. Full preservation/security verification and human review.

Do not merge, deploy, run live migrations, create paid infrastructure or enable monitoring without explicit approval.
