# Passport verification authentication gates

Phase 2B-B is intentionally **not live**. The workspace route is disabled by default and its page returns 404 even if the feature flag is set. Do not enable it until all gates below are implemented and verified.

1. Configure Supabase project URL and secret only in server-side environment settings; never use a secret with a NEXT_PUBLIC prefix. Prefer Supabase publishable key for browser clients.
2. Install and pin @supabase/ssr and @supabase/supabase-js, committing the lockfile; validate against current Supabase docs.
3. Implement server-validated Supabase Auth sessions, invite-only access, and role checks against passport_research_profiles (not user-editable metadata).
4. Create server-side submission and review operations with strict input validation, role-scoped authorization, atomic transactions and append-only audit.
5. Add revision-specific review decisions and database guards; ensure updates, reopened conflicts and withdrawn approvals cannot invalidate an already-linked release candidate.
6. Test self-review, stale revisions, disabled reviewers, cross-user access, missing/expired sessions, conflict races, and audit consistency in a disposable database.
7. Review RLS policies, grants, service-key isolation, security advisors, and preservation harness before enabling any interface.

Never auto-publish or merge without approval. Existing passport data and public ranking behavior must remain unchanged.
