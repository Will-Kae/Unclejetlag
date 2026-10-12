#!/usr/bin/env bash
# CI-only: two PostgreSQL sessions race to approve the same revision.
set -euo pipefail
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

psql -v ON_ERROR_STOP=1 <<'SQL'
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000021'),
 ('00000000-0000-4000-8000-000000000022'),
 ('00000000-0000-4000-8000-000000000023');
insert into public.passport_research_profiles(user_id,role,active) values
 ('00000000-0000-4000-8000-000000000021','researcher',true),
 ('00000000-0000-4000-8000-000000000022','reviewer',true),
 ('00000000-0000-4000-8000-000000000023','reviewer',true);
SQL

id="$(psql -At -v ON_ERROR_STOP=1 -c "select passport_internal.submit_evidence('00000000-0000-4000-8000-000000000021','race-rule','AUS','ZAF','visa_free','official','https://example.gov/visas',now(),'Independent evidence for concurrent review approval testing.',false)")"
[[ "$id" =~ ^[0-9a-f-]{36}$ ]] || { echo "Invalid test submission ID" >&2; exit 1; }

# Session A locks the evidence row, waits to let B block, then approves.
(
  psql -v ON_ERROR_STOP=1 -v id="$id" >"$tmp/a.log" 2>&1 <<'SQL'
begin;
select id from public.passport_evidence_submissions where id=:'id'::uuid for update;
select pg_sleep(4);
select passport_internal.review_evidence('00000000-0000-4000-8000-000000000022', :'id'::uuid,1,'approve','Official evidence independently reviewed and approved.');
commit;
SQL
) &
a_pid=$!

# Wait until session A has locked the row; fail if it never reaches that point.
for i in {1..100}; do
  # A is inside pg_sleep only after acquiring the evidence row lock.
  if psql -At -v ON_ERROR_STOP=1 -c "select exists(select 1 from pg_stat_activity where query like 'select pg_sleep(4)%' and state='active')" | grep -qx t; then break; fi
  if ! kill -0 "$a_pid" 2>/dev/null; then cat "$tmp/a.log"; exit 1; fi
  sleep 0.05
done
if ! psql -At -v ON_ERROR_STOP=1 -c "select exists(select 1 from pg_stat_activity where query like 'select pg_sleep(4)%' and state='active')" | grep -qx t; then
  echo "Session A did not acquire lock in time" >&2; cat "$tmp/a.log"; exit 1
fi

# Session B attempts approval while A holds the row lock.
(
  psql -v ON_ERROR_STOP=1 -v id="$id" >"$tmp/b.log" 2>&1 <<'SQL'
select passport_internal.review_evidence('00000000-0000-4000-8000-000000000023', :'id'::uuid,1,'approve','Second independent reviewer attempts duplicate approval.');
SQL
) &
b_pid=$!
wait "$a_pid" || { cat "$tmp/a.log"; echo "First review failed"; exit 1; }
if wait "$b_pid"; then
  cat "$tmp/b.log"
  echo "SECURITY FAILURE: second concurrent approval succeeded" >&2
  exit 1
fi
grep -q 'Unavailable or stale submission' "$tmp/b.log" || {
  cat "$tmp/b.log"
  echo "Second review failed for an unexpected reason" >&2
  exit 1
}

psql -v ON_ERROR_STOP=1 -v id="$id" <<'SQL'
select pg_catalog.set_config('passport.ci_submission_id', :'id', false);
do $ci$
declare
  v_id uuid := current_setting('passport.ci_submission_id')::uuid;
begin
  if (select status from public.passport_evidence_submissions where id=v_id) <> 'approved'
    or (select count(*) from public.passport_verification_reviews where submission_id=v_id) <> 1
    or (select count(*) from public.passport_verification_audit
        where object_id=v_id and action='evidence_reviewed') <> 1
  then raise exception 'Concurrent approval invariant violated'; end if;
  raise notice 'PASS exactly one approval and audit event';
end $ci$;
SQL
echo "PASS second concurrent reviewer safely rejected"
