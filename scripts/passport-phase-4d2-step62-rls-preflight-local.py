#!/usr/bin/env python3
"""Step 62: read-only local JWT/PostgREST/RLS integration preflight.

Inspects only the named local Docker database. Does not fabricate signed JWTs,
claim an RLS pass, change permissions, or contact production.
"""
import os
import subprocess

CONTAINER = "supabase_db_unclejetlag-passport-staging"
DATABASE = "passport_concurrency_test"
PSQL = ["docker", "exec", "-i", CONTAINER, "psql", "-X", "-qAt",
        "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", DATABASE]

def inspect(label, statement):
    result = subprocess.run(PSQL, input=statement, capture_output=True,
                            text=True, timeout=20)
    if result.returncode:
        raise RuntimeError(label + ": " + result.stderr.strip())
    print("\n## " + label)
    print(result.stdout.strip() or "(none)")

def main():
    if os.getenv("ALLOW_LOCAL_READONLY_DB_INSPECTION") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_READONLY_DB_INSPECTION=yes")
    result = subprocess.run(["docker", "inspect", "--format", "{{.Name}}", CONTAINER],
                            capture_output=True, text=True, timeout=15)
    if result.returncode or result.stdout.strip() != "/" + CONTAINER:
        raise SystemExit("Expected local staging Docker container unavailable")
    inspect("Connection and database identity",
            "SELECT current_database(), current_user, version();")
    inspect("RLS state and policy inventory", """
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
       coalesce(p.policyname,'(no policy)'),coalesce(p.roles::text,''),
       coalesce(p.cmd,'')
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname=n.nspname AND p.tablename=c.relname
WHERE n.nspname='public' AND c.relname LIKE 'passport_%'
  AND c.relkind IN ('r','p')
ORDER BY c.relname,p.policyname;
""")
    inspect("Client role table privileges", """
SELECT r.rolname,t.table_name,
 has_table_privilege(r.rolname,'public.'||quote_ident(t.table_name),'SELECT'),
 has_table_privilege(r.rolname,'public.'||quote_ident(t.table_name),'INSERT'),
 has_table_privilege(r.rolname,'public.'||quote_ident(t.table_name),'UPDATE'),
 has_table_privilege(r.rolname,'public.'||quote_ident(t.table_name),'DELETE')
FROM pg_roles r CROSS JOIN information_schema.tables t
WHERE r.rolname IN ('anon','authenticated','service_role')
 AND t.table_schema='public' AND t.table_name LIKE 'passport_%'
ORDER BY r.rolname,t.table_name;
""")
    inspect("Review RPC security and grants", """
SELECT p.proname, p.prosecdef, p.provolatile,
 p.proconfig::text, pg_get_function_identity_arguments(p.oid),
 has_function_privilege('anon',p.oid,'EXECUTE'),
 has_function_privilege('authenticated',p.oid,'EXECUTE'),
 has_function_privilege('service_role',p.oid,'EXECUTE')
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname LIKE 'passport_%review%'
ORDER BY p.proname;
""")
    inspect("Local PostgREST container presence", "SELECT 'PostgREST must be inspected separately; PostgreSQL cannot prove HTTP/JWT configuration';")
    print("\nPREFLIGHT ONLY: no JWT issued, no HTTP requests made, no RLS authorization tested.")
    print("Do not mark Step 62 complete based on this report.")

if __name__ == "__main__":
    main()
