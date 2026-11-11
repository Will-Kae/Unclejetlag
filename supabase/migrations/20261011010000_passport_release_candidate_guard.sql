-- Guard release-candidate associations at the database boundary.
-- Existing client roles remain denied by RLS and table privileges.
create or replace function public.passport_check_release_candidate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  evidence public.passport_evidence_submissions%rowtype;
begin
  select * into evidence
  from public.passport_evidence_submissions
  where id = new.submission_id
  for update;

  if evidence.id is null or evidence.status <> 'approved' then
    raise exception 'Approved evidence required for release candidate';
  end if;

  if exists (
    select 1 from public.passport_verification_conflicts
    where submission_id = new.submission_id and status = 'open'
  ) then
    raise exception 'Unresolved conflict blocks release candidate';
  end if;

  if not exists (
    select 1 from public.passport_verification_reviews r
    join public.passport_research_profiles p on p.user_id = r.reviewer_id
    where r.submission_id = new.submission_id
      and r.reviewer_id <> evidence.submitter_id
      and r.decision = 'approve'
      and p.active = true
      and p.role in ('reviewer', 'admin')
  ) then
    raise exception 'Independent approval required for release candidate';
  end if;

  return new;
end;
$$;

revoke all on function public.passport_check_release_candidate() from public, anon, authenticated;

create trigger passport_release_candidate_guard
before insert or update on public.passport_release_candidate_submissions
for each row execute function public.passport_check_release_candidate();
