-- Phase 2B-B foundation. Apply only to an approved Supabase project after review.
-- No client-facing table policies: RLS defaults to DENY. All writes must pass
-- through future authenticated server-side workflows with explicit role checks.
begin;

create extension if not exists pgcrypto;

create type public.passport_role as enum ('admin', 'researcher', 'reviewer');
create type public.passport_submission_status as enum ('draft', 'submitted', 'changes_requested', 'approved', 'rejected');
create type public.passport_review_decision as enum ('approve', 'reject', 'request_changes');
create type public.passport_conflict_status as enum ('open', 'resolved');
create type public.passport_candidate_status as enum ('draft', 'ready_for_pr', 'withdrawn');

create table public.passport_research_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.passport_role not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.passport_evidence_submissions (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null,
  passport_code text not null,
  destination_code text not null,
  proposed_access text not null,
  source_id text not null,
  source_url text not null check (source_url ~ '^https://'),
  source_document_date date,
  observed_at timestamptz not null,
  rationale text not null check (length(trim(rationale)) > 0),
  ai_assisted boolean not null default false,
  submitter_id uuid not null references public.passport_research_profiles(user_id),
  status public.passport_submission_status not null default 'draft',
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index passport_submissions_queue_idx on public.passport_evidence_submissions(status, created_at);
create index passport_submissions_rule_idx on public.passport_evidence_submissions(rule_id);

create table public.passport_evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.passport_evidence_submissions(id) on delete restrict,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  content_type text not null,
  object_key text not null unique,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 20000000),
  retrieved_at timestamptz not null,
  provenance text not null,
  created_at timestamptz not null default now()
);

create table public.passport_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.passport_evidence_submissions(id) on delete restrict,
  reviewer_id uuid not null references public.passport_research_profiles(user_id),
  decision public.passport_review_decision not null,
  rationale text not null check (length(trim(rationale)) > 0),
  created_at timestamptz not null default now(),
  unique(submission_id, reviewer_id)
);
create index passport_reviews_submission_idx on public.passport_verification_reviews(submission_id);

create or replace function public.passport_enforce_independent_review()
returns trigger language plpgsql set search_path = '' as $$
declare
  owner_id uuid;
  reviewer_active boolean;
begin
  select submitter_id into owner_id from public.passport_evidence_submissions
    where id = new.submission_id for update;
  if owner_id is null then raise exception 'submission missing'; end if;
  if owner_id = new.reviewer_id then raise exception 'self-review prohibited'; end if;
  select active and role in ('reviewer'::public.passport_role, 'admin'::public.passport_role)
    into reviewer_active from public.passport_research_profiles where user_id = new.reviewer_id;
  if coalesce(reviewer_active, false) is not true then raise exception 'active reviewer required'; end if;
  return new;
end $$;
create trigger passport_review_independence before insert or update on public.passport_verification_reviews
for each row execute function public.passport_enforce_independent_review();

create table public.passport_verification_conflicts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.passport_evidence_submissions(id) on delete restrict,
  conflicting_reference text not null,
  description text not null,
  status public.passport_conflict_status not null default 'open',
  resolver_id uuid references public.passport_research_profiles(user_id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint passport_conflict_resolution_consistent check (
    (status = 'open' and resolver_id is null and resolved_at is null) or
    (status = 'resolved' and resolver_id is not null and resolved_at is not null)
  )
);
create index passport_conflicts_open_idx on public.passport_verification_conflicts(submission_id) where status = 'open';

create table public.passport_release_candidates (
  id uuid primary key default gen_random_uuid(),
  dataset_sha256 text not null check (dataset_sha256 ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references public.passport_research_profiles(user_id),
  status public.passport_candidate_status not null default 'draft',
  created_at timestamptz not null default now()
);
create table public.passport_release_candidate_submissions (
  candidate_id uuid not null references public.passport_release_candidates(id) on delete restrict,
  submission_id uuid not null references public.passport_evidence_submissions(id) on delete restrict,
  primary key(candidate_id, submission_id)
);

-- This table is immutable for ordinary roles. Later server code must append audit
-- events in the same transaction as every state transition.
create table public.passport_verification_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.passport_research_profiles(user_id),
  action text not null,
  object_type text not null,
  object_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function public.passport_audit_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit records cannot be updated or deleted';
end $$;
create trigger passport_audit_no_mutation before update or delete on public.passport_verification_audit
for each row execute function public.passport_audit_immutable();

alter table public.passport_research_profiles enable row level security;
alter table public.passport_evidence_submissions enable row level security;
alter table public.passport_evidence_artifacts enable row level security;
alter table public.passport_verification_reviews enable row level security;
alter table public.passport_verification_conflicts enable row level security;
alter table public.passport_release_candidates enable row level security;
alter table public.passport_release_candidate_submissions enable row level security;
alter table public.passport_verification_audit enable row level security;

-- Explicitly no RLS policies yet. Neither anon nor authenticated clients
-- may read/write these tables. Do not grant access until tested role policies
-- and authenticated server mutations are introduced in a later commit.
revoke all on
  public.passport_research_profiles,
  public.passport_evidence_submissions,
  public.passport_evidence_artifacts,
  public.passport_verification_reviews,
  public.passport_verification_conflicts,
  public.passport_release_candidates,
  public.passport_release_candidate_submissions,
  public.passport_verification_audit
from anon, authenticated;

commit;
