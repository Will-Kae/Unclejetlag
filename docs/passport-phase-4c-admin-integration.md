# Phase 4C.2 — Secure Passport Research Admin Integration

## Existing infrastructure (verified 2026-10-14)

Supabase project **unclejetlag-passport-intelligence** (project ref `higmlrqrgxdhvkmrdpru`) already exists. Do **not** create a second database. The existing public schema includes RLS-enabled:

- `passport_research_profiles` — Supabase Auth user ID, role (admin/researcher/reviewer), active flag
- `passport_evidence_submissions` — evidence proposal, submitter, status, revision
- `passport_evidence_artifacts` — supporting document metadata
- `passport_verification_reviews` — independent review and decision
- `passport_verification_conflicts` — disputes and resolution
- `passport_release_candidates` and `passport_release_candidate_submissions`
- `passport_verification_audit` — audit history

The app currently has **no Supabase Auth session handling** and **no Supabase client**. A public, unprotected admin UI must not be released.

## Implementation sequence

1. Add `@supabase/supabase-js` and `@supabase/ssr` with reviewed, pinned versions and lockfile updates. Use a server-side session-aware client with cookie handling.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel preview first. Never commit credentials. Never use the service-role key in browser code or for ordinary admin actions.
3. Authenticate through Supabase Auth. All protected server routes and mutations must call `auth.getUser()` and look up `passport_research_profiles` with `active=true` and the appropriate role. No public self-registration or self-assigned roles.
4. Verify existing RLS policies, grants, and triggers *before* enabling any writes. Require independent review: the reviewer cannot be the submitter. Ensure review decisions are checked transactionally against the current submission revision to avoid stale approvals.
5. Add server-only admin routes for dashboard, submissions, reviews, conflicts and audit history. Return 404 or redirect to sign-in for unauthenticated users. All mutations validate inputs and roles server-side, and use the authenticated user's JWT (not a privileged service key).
6. Keep the current `data.ts` publication gate authoritative. Approval in Supabase creates a **release candidate**, not a live visa change. Publication still requires a reviewed GitHub PR and explicit production approval.
7. Add negative tests: anonymous access, inactive account, researcher approval attempt, self-review, stale revision, cross-user data, RLS bypass, invalid source, and CSRF/origin failures.
8. Configure email sign-in redirect allow-list and MFA for administrators, audit logging, and a tested rollback before launch.

## Release gates

- [ ] Confirm Vercel preview environment is linked to the correct Supabase project.
- [ ] Inspect and test all existing RLS policies, triggers and grants.
- [ ] Implement authenticated, role-restricted server components/actions.
- [ ] Pass unit, integration, security, and end-to-end tests.
- [ ] Review preview as a real admin and as an unauthorised user.
- [ ] Obtain explicit approval before merge.

No database writes or changes to production environment settings were made as part of this document.
