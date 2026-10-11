-- Phase 2B-B: reject review of draft/terminal evidence and make review
-- decisions revision-specific. No API grants or public policies added.
alter table public.passport_verification_reviews
  add column reviewed_revision integer not null default 1
  check (reviewed_revision > 0);

create or replace function public.passport_enforce_review_revision()
returns trigger language plpgsql set search_path = ''
as $$
declare
  current_status public.passport_submission_status;
  current_revision integer;
begin
  select status, revision into current_status, current_revision
  from public.passport_evidence_submissions
  where id = new.submission_id for update;

  if current_status is distinct from 'submitted'::public.passport_submission_status then
    raise exception 'Only submitted evidence may be reviewed';
  end if;
  if current_revision is distinct from new.reviewed_revision then
    raise exception 'Review revision does not match evidence revision';
  end if;
  return new;
end;
$$;

create trigger passport_review_revision_guard
before insert or update on public.passport_verification_reviews
for each row execute function public.passport_enforce_review_revision();

revoke all on function public.passport_enforce_review_revision() from public, anon, authenticated;

-- Release approval must apply to the current evidence revision.
create or replace function public.passport_check_release_candidate()
returns trigger language plpgsql set search_path = ''
as $$
declare
  evidence public.passport_evidence_submissions%rowtype;
begin
  select * into evidence from public.passport_evidence_submissions
  where id = new.submission_id for update;

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
      and r.reviewed_revision = evidence.revision
      and r.reviewer_id <> evidence.submitter_id
      and r.decision = 'approve'
      and p.active = true
      and p.role in ('reviewer', 'admin')
  ) then
    raise exception 'Current revision requires independent approval';
  end if;
  return new;
end;
$$;

revoke all on function public.passport_check_release_candidate() from public, anon, authenticated;
