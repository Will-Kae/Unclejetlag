-- Phase 4C.2 — REVIEW-ONLY migration draft.
-- NOT APPLIED to Supabase. Requires DBA/security review and integration tests.
-- Scope intentionally limited to active profile discovery and research draft creation.
-- Review/approval/release/audit writes remain denied by RLS.

begin;

-- Existing RLS remains enabled. Only allow the minimum required grants.
grant usage on schema public to authenticated;
grant select on public.passport_research_profiles to authenticated;
grant select, insert on public.passport_evidence_submissions to authenticated;

-- No policy allows authenticated users to update roles or the active flag.
create policy "passport_active_profile_self_read"
on public.passport_research_profiles
for select to authenticated
using (user_id = (select auth.uid()) and active = true);

-- A researcher/admin may see only their own evidence at this stage.
create policy "passport_evidence_owner_read"
on public.passport_evidence_submissions
for select to authenticated
using (
  submitter_id = (select auth.uid())
  and exists (
    select 1 from public.passport_research_profiles p
    where p.user_id = (select auth.uid()) and p.active = true
      and p.role in ('researcher', 'admin')
  )
);

-- Enforce draft status and submitter ownership on insertion.
-- Client must not be allowed to choose an approved/submitted status.
create policy "passport_evidence_owner_draft_insert"
on public.passport_evidence_submissions
for insert to authenticated
with check (
  submitter_id = (select auth.uid())
  and status = 'draft'
  and revision = 0
  and exists (
    select 1 from public.passport_research_profiles p
    where p.user_id = (select auth.uid()) and p.active = true
      and p.role in ('researcher', 'admin')
  )
);

-- Deliberately no UPDATE, DELETE or reviewer INSERT policies.
-- Submission state changes must be designed as controlled transactions,
-- with protected fields, audit insertion and revision enforcement.

commit;
