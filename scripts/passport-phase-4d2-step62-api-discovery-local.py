#!/usr/bin/env python3
"""Step 62: local-only API access-model discovery (no credentials or writes).

Reports local Docker service metadata and PostgreSQL grants/RLS, without
contacting production, minting tokens, or changing policy.
"""
import json
import os
import subprocess

DB_CONTAINER="supabase_db_unclejetlag-passport-staging"
DB="passport_concurrency_test"

def execute(args, input_text=None):
    p=subprocess.run(args,input=input_text,text=True,capture_output=True,timeout=25)
    if p.returncode:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return p.stdout.strip()

def main():
    if os.getenv("ALLOW_LOCAL_READONLY_DB_INSPECTION")!="yes":
        raise SystemExit("Set ALLOW_LOCAL_READONLY_DB_INSPECTION=yes")
    name=execute(["docker","inspect","--format","{{.Name}}",DB_CONTAINER])
    if name!="/"+DB_CONTAINER:
        raise SystemExit("Expected local PostgreSQL container unavailable")
    print("## Local containers (name, image, exposed ports; no secrets)")
    raw=execute(["docker","ps","--format","{{json .}}"])
    found=False
    for line in raw.splitlines():
        item=json.loads(line)
        name=item.get("Names","")
        if "supabase" in name.lower() or "postgrest" in name.lower():
            print(name, "|",item.get("Image",""),"|",item.get("Ports",""))
            if "postgrest" in name.lower() or "rest" in name.lower():
                found=True
    print("LOCAL API CONTAINER CANDIDATE:", "FOUND (verify config)" if found else "NOT IDENTIFIED")
    psql=["docker","exec","-i",DB_CONTAINER,"psql","-X","-qAt",
          "-v","ON_ERROR_STOP=1","-U","postgres","-d",DB]
    queries={
        "Passport schema usage and direct grants": """
SELECT r.rolname,has_schema_privilege(r.rolname,'public','USAGE'),
       count(*) FILTER (WHERE has_table_privilege(r.rolname,c.oid,'SELECT')) AS selectable,
       count(*) FILTER (WHERE has_table_privilege(r.rolname,c.oid,'INSERT')) AS insertable
FROM pg_roles r CROSS JOIN pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE r.rolname IN ('anon','authenticated','service_role')
 AND n.nspname='public' AND c.relname LIKE 'passport_%' AND c.relkind IN ('r','p')
GROUP BY r.rolname ORDER BY r.rolname;
""",
        "Passport RPC security modes and role grants": """
SELECT p.proname,pg_get_function_identity_arguments(p.oid),
 p.prosecdef,
 has_function_privilege('anon',p.oid,'EXECUTE'),
 has_function_privilege('authenticated',p.oid,'EXECUTE'),
 has_function_privilege('service_role',p.oid,'EXECUTE')
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname LIKE 'passport_%'
ORDER BY p.proname;
""",
        "Research profile self-read policy": """
SELECT policyname,roles::text,cmd,qual,with_check
FROM pg_policies WHERE schemaname='public'
 AND tablename='passport_research_profiles';
""",
    }
    for title,statement in queries.items():
        print("\n##",title)
        print(execute(psql,statement) or "(none)")
    print("\nDISCOVERY ONLY. No signed JWT, HTTP authorization or RLS behavior verified.")
    print("Do not grant privileges or enable approvals based solely on this report.")

if __name__=="__main__":
    main()
