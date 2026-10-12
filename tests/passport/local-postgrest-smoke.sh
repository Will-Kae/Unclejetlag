#!/usr/bin/env bash
# Disposable Supabase CLI stack only. Never run against a hosted project.
set -euo pipefail
: "${SUPABASE_URL:?missing local Supabase URL}"
: "${SUPABASE_ANON_KEY:?missing local anon key}"
: "${SUPABASE_SERVICE_ROLE_KEY:?missing local service key}"
[[ "$SUPABASE_URL" == "http://127.0.0.1:54321" || "$SUPABASE_URL" == "http://localhost:54321" ]] || {
  echo "Refusing non-local Supabase target" >&2; exit 1;
}
api="$SUPABASE_URL/rest/v1/rpc"
anon_code="$(curl -sS -o /tmp/passport-anon-response -w '%{http_code}' -X POST "$api/passport_server_submit" \
 -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
 -H 'Content-Type: application/json' -d '{}')"
[[ "$anon_code" == "401" || "$anon_code" == "403" || "$anon_code" == "404" ]] || {
  echo "SECURITY FAILURE: anon RPC response HTTP $anon_code" >&2; exit 1;
}
# The service key must reach the RPC and fail on validation, not on privileges.
service_code="$(curl -sS -o /tmp/passport-service-response -w '%{http_code}' -X POST "$api/passport_server_submit" \
 -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
 -H 'Content-Type: application/json' -d '{}')"
[[ "$service_code" == "400" ]] || {
  echo "Service RPC failed with unexpected HTTP $service_code" >&2
  cat /tmp/passport-service-response >&2; exit 1;
}
grep -q 'Unauthorized researcher\|Invalid evidence' /tmp/passport-service-response || {
  echo "Unexpected service RPC response" >&2; cat /tmp/passport-service-response >&2; exit 1;
}
echo "PASS local PostgREST denies anon and reaches privileged validation for service_role"
