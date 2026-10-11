-- Freeze release-linked evidence and prevent new unresolved conflicts.
-- This closes the post-association mutation gap without enabling public access.

create or replace function public.passport_protect_linked_evidence()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if exists (
    select 1 from public.passport_release_candidate_submissions
    where submission_id = old.id
  ) then
    if new is distinct from old then
      raise exception 'Evidence linked to a release candidate is immutable';
    end if;
  end if;
  return new;
end;
$$;

create trigger passport_linked_evidence_update_guard
before update on public.passport_evidence_submissions
for each row execute function public.passport_protect_linked_evidence();

create or replace function public.passport_protect_linked_conflicts()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if exists (
    select 1 from public.passport_release_candidate_submissions
    where submission_id = new.submission_id
  ) and new.status = 'open' then
    raise exception 'Open conflict prohibited for release-linked evidence';
  end if;
  return new;
end;
$$;

create trigger passport_linked_conflict_guard
before insert or update on public.passport_verification_conflicts
for each row execute function public.passport_protect_linked_conflicts();

revoke all on function public.passport_protect_linked_evidence() from public, anon, authenticated;
revoke all on function public.passport_protect_linked_conflicts() from public, anon, authenticated;
