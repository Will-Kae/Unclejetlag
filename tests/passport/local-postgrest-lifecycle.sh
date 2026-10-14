#!/usr/bin/env bash
# Runs only against GitHub's disposable local Supabase CLI instance.
set -euo pipefail
: "${SUPABASE_URL:?}" "${SUPABASE_SERVICE_ROLE_KEY:?}" "${SUPABASE_ANON_KEY:?}"
[[ "$SUPABASE_URL" == "http://127.0.0.1:54321" || "$SUPABASE_URL" == "http://localhost:54321" ]] || exit 1
container="$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1)"
[[ -n "$container" ]] || { echo "No local Supabase DB container"; exit 1; }
sql() { docker exec -i "$container" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"; }
api="$SUPABASE_URL/rest/v1/rpc"
request() {
  local endpoint="$1" payload="$2" filename="$3"
  curl -sS -o "$filename" -w '%{http_code}' -X POST "$api/$endpoint" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' -d "$payload"
}
# Use genuine local Auth accounts and obtain verified IDs from GoTrue admin API.
for role in researcher reviewer; do
  curl -fsS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"passport-ci-$role@example.test\",\"password\":\"local-only-test-password-987!\",\"email_confirm\":true}" > "/tmp/passport-$role.json"
done
researcher="$(python3 -c 'import json;print(json.load(open("/tmp/passport-researcher.json"))["id"])')"
reviewer="$(python3 -c 'import json;print(json.load(open("/tmp/passport-reviewer.json"))["id"])')"
[[ "$researcher" =~ ^[0-9a-f-]{36}$ && "$reviewer" =~ ^[0-9a-f-]{36}$ ]] || exit 1

# A real signed-in researcher must still be denied direct PostgREST mutations.
login_code="$(curl -sS -o /tmp/passport-auth-token.json -w '%{http_code}' -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" -H 'Content-Type: application/json' \
  -d '{"email":"passport-ci-researcher@example.test","password":"local-only-test-password-987!"}')"
[[ "$login_code" == 200 ]] || { cat /tmp/passport-auth-token.json; echo "Auth login HTTP $login_code"; exit 1; }
access_token="$(python3 -c 'import json;print(json.load(open("/tmp/passport-auth-token.json"))["access_token"])')"
client_code="$(curl -sS -o /tmp/passport-authenticated-response -w '%{http_code}' -X POST "$api/passport_server_submit" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $access_token" \
  -H 'Content-Type: application/json' -d '{}')"
[[ "$client_code" == 401 || "$client_code" == 403 || "$client_code" == 404 ]] || {
  echo "SECURITY FAILURE: authenticated browser can invoke server-only RPC (HTTP $client_code)" >&2; exit 1;
}

# Deny every privileged RPC and deny direct reads of protected tables.
for endpoint in passport_server_review passport_server_resubmit passport_server_rate_limit; do
  code="$(curl -sS -o /tmp/passport-authenticated-denied -w '%{http_code}' -X POST "$api/$endpoint" \
    -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $access_token" \
    -H 'Content-Type: application/json' -d '{}')"
  [[ "$code" == 401 || "$code" == 403 || "$code" == 404 ]] || {
    echo "SECURITY FAILURE: authenticated browser can invoke $endpoint (HTTP $code)" >&2; exit 1;
  }
done
for table in passport_research_profiles passport_evidence_submissions passport_verification_reviews passport_verification_audit; do
  code="$(curl -sS -o /tmp/passport-table-denied -w '%{http_code}' "$SUPABASE_URL/rest/v1/$table?select=*" \
    -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $access_token")"
  [[ "$code" == 401 || "$code" == 403 || "$code" == 404 ]] || {
    echo "SECURITY FAILURE: authenticated browser can read $table (HTTP $code)" >&2; exit 1;
  }
done


# Verify the shared PostgREST rate limiter enforces 10 calls per actor/operation/minute.
for i in {1..11}; do
  code="$(request passport_server_rate_limit "{\"p_actor\":\"$researcher\",\"p_operation\":\"review\"}" /tmp/passport-rate-limit.json)"
  [[ "$code" == 200 ]] || { cat /tmp/passport-rate-limit.json; echo "Rate limit RPC HTTP $code"; exit 1; }
  actual="$(cat /tmp/passport-rate-limit.json)"
  if (( i <= 10 )); then
    [[ "$actual" == true ]] || { echo "Premature rate limit on request $i"; exit 1; }
  else
    [[ "$actual" == false ]] || { echo "SECURITY FAILURE: 11th request was not limited"; exit 1; }
  fi
done

sql -v researcher="$researcher" -v reviewer="$reviewer" <<'SQL'
insert into public.passport_research_profiles(user_id,role,active)
values (:'researcher'::uuid,'researcher',true),(:'reviewer'::uuid,'reviewer',true);
SQL
base="{\"p_actor\":\"$researcher\",\"p_rule_id\":\"local-auth-rpc\",\"p_passport_code\":\"AUS\",\"p_destination_code\":\"ZAF\",\"p_access\":\"visa_free\",\"p_source_id\":\"official\",\"p_source_url\":\"https://example.gov/visa\",\"p_observed_at\":\"2026-10-12T00:00:00Z\",\"p_rationale\":\"Independently verified against a published government source.\",\"p_ai_assisted\":false}"
code="$(request passport_server_submit "$base" /tmp/passport-created.json)"
[[ "$code" == 200 ]] || { cat /tmp/passport-created.json; echo "Submit HTTP $code"; exit 1; }
id="$(python3 -c 'import json;print(json.load(open("/tmp/passport-created.json")))')"
[[ "$id" =~ ^[0-9a-f-]{36}$ ]] || exit 1
# The researcher must not be allowed to approve their own submission.
self="{\"p_actor\":\"$researcher\",\"p_submission_id\":\"$id\",\"p_revision\":1,\"p_decision\":\"approve\",\"p_rationale\":\"Attempting to approve my own submitted evidence. \"}"
code="$(request passport_server_review "$self" /tmp/passport-self.json)"
[[ "$code" == 400 ]] || { echo "Self-review unexpectedly returned $code"; exit 1; }
grep -qi 'Self-review prohibited' /tmp/passport-self.json || { cat /tmp/passport-self.json; exit 1; }
changes="{\"p_actor\":\"$reviewer\",\"p_submission_id\":\"$id\",\"p_revision\":1,\"p_decision\":\"request_changes\",\"p_rationale\":\"Please provide updated official source evidence for this case.\"}"
code="$(request passport_server_review "$changes" /tmp/passport-changes.json)"
[[ "$code" == 204 || "$code" == 200 ]] || { cat /tmp/passport-changes.json; echo "Changes HTTP $code"; exit 1; }
resubmit="{\"p_actor\":\"$researcher\",\"p_submission_id\":\"$id\",\"p_expected_revision\":1,\"p_source_id\":\"official-updated\",\"p_source_url\":\"https://example.gov/visa-updated\",\"p_observed_at\":\"2026-10-12T01:00:00Z\",\"p_rationale\":\"Updated evidence verified against the current official source.\",\"p_ai_assisted\":false}"
code="$(request passport_server_resubmit "$resubmit" /tmp/passport-resubmitted.json)"
[[ "$code" == 200 ]] || { cat /tmp/passport-resubmitted.json; echo "Resubmit HTTP $code"; exit 1; }
[[ "$(cat /tmp/passport-resubmitted.json)" == 2 ]] || { cat /tmp/passport-resubmitted.json; exit 1; }
stale="{\"p_actor\":\"$reviewer\",\"p_submission_id\":\"$id\",\"p_revision\":1,\"p_decision\":\"approve\",\"p_rationale\":\"Stale revision should not be accepted by the server.\"}"
code="$(request passport_server_review "$stale" /tmp/passport-stale.json)"
[[ "$code" == 400 ]] || { echo "Stale review unexpectedly returned $code"; exit 1; }
approve="{\"p_actor\":\"$reviewer\",\"p_submission_id\":\"$id\",\"p_revision\":2,\"p_decision\":\"approve\",\"p_rationale\":\"Official updated evidence independently reviewed and approved.\"}"
code="$(request passport_server_review "$approve" /tmp/passport-approved.json)"
[[ "$code" == 204 || "$code" == 200 ]] || { cat /tmp/passport-approved.json; echo "Approve HTTP $code"; exit 1; }
sql -v id="$id" <<'SQL'
select pg_catalog.set_config('passport.ci_submission_id', :'id', false);
do $check$
declare
  v_id uuid := current_setting('passport.ci_submission_id')::uuid;
begin
  if (select status from public.passport_evidence_submissions where id=v_id) <> 'approved'
    or (select revision from public.passport_evidence_submissions where id=v_id) <> 2
    or (select count(*) from public.passport_verification_reviews where submission_id=v_id) <> 2
    or (select count(*) from public.passport_verification_audit where object_id=v_id) <> 4
  then raise exception 'Local PostgREST lifecycle invariant violated'; end if;
  raise notice 'PASS Auth-backed PostgREST lifecycle and audit invariants';
end $check$;
SQL
echo "PASS local Auth-created users, submit, self-review rejection, request changes, resubmit, stale rejection, approve"
