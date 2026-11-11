#!/usr/bin/env bash
# Local-only disposable Supabase security test runner.
# Requires Docker Desktop, Supabase CLI, psql and a checked-out feature branch.
set -euo pipefail
cd "$(dirname "$0")/../.."

for binary in docker supabase psql; do
  command -v "$binary" >/dev/null || { echo "Missing dependency: $binary" >&2; exit 1; }
done
docker info >/dev/null || { echo "Docker Desktop must be running" >&2; exit 1; }

if [[ -n "${SUPABASE_DB_URL:-}" || -n "${DATABASE_URL:-}" || -n "${PGHOST:-}" ]]; then
  echo "Refusing to run with externally configured database connection variables" >&2
  exit 1
fi

# A local Supabase stack is disposable; do not link a remote Supabase project.
if [[ -f supabase/.branches/_current_branch || -f supabase/.temp/project-ref ]]; then
  echo "Review local Supabase linking before running; refusing ambiguous target" >&2
  exit 1
fi

echo "Starting local Supabase containers (never the remote project)..."
supabase start
local_url="$(supabase status -o env | sed -n 's/^DB_URL=//p' | tr -d '\"')"
if [[ -z "$local_url" ]]; then
  echo "Could not determine local DB URL; stopping" >&2
  exit 1
fi
case "$local_url" in
  *127.0.0.1*|*localhost*) ;;
  *) echo "Refusing non-local DB target" >&2; exit 1 ;;
esac

# Supabase start applies tracked migrations to its local database.
# This assertion script intentionally does not mutate the database.
psql "$local_url" -v ON_ERROR_STOP=1 -f tests/passport/sql/structural-security.sql
echo "Structural checks passed. Full transaction fixtures and concurrency checks still required."
