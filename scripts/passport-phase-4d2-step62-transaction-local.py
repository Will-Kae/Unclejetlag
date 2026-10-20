#!/usr/bin/env python3
"""Step 62 supplemental tests: isolated PostgreSQL transaction and review checks.

Clone-only; does not connect to production or enable approvals.
"""
import os
import subprocess
import uuid

CONTAINER="supabase_db_unclejetlag-passport-staging"
SOURCE="passport_concurrency_test"
DB="passport_step62_"+uuid.uuid4().hex[:12]
CMD=["docker","exec","-i",CONTAINER,"psql","-X","-qAt","-v","ON_ERROR_STOP=1","-U","postgres"]

def sql(statement, db="postgres", failure=False):
    p=subprocess.run(CMD+["-d",db],input=statement,text=True,capture_output=True,timeout=35)
    if failure:
        if p.returncode==0:
            raise AssertionError("Expected SQL rejection, statement succeeded")
        return p.stderr
    if p.returncode:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return p.stdout.strip()

def check(label, condition):
    if not condition:
        raise AssertionError(label)
    print("PASS:",label)

def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB")!="yes":
        raise SystemExit("Requires ALLOW_LOCAL_DISPOSABLE_DB=yes")
    inspect=subprocess.run(["docker","inspect","--format","{{.Name}}",CONTAINER],
                           text=True,capture_output=True,timeout=15)
    if inspect.returncode or inspect.stdout.strip()!="/"+CONTAINER:
        raise RuntimeError("Expected local Docker container not available")
    created=False
    try:
        sql(f'CREATE DATABASE "{DB}" TEMPLATE "{SOURCE}";')
        created=True
        check("disposable clone created",True)
        rows=sql("""
SELECT e.id,e.submitter_id,e.revision,p.user_id
FROM public.passport_evidence_submissions e
JOIN public.passport_research_profiles p
 ON p.active AND p.role IN ('reviewer','admin')
 AND p.user_id<>e.submitter_id
WHERE e.status='submitted'
AND NOT EXISTS (SELECT 1 FROM public.passport_release_candidate_submissions l
                WHERE l.submission_id=e.id)
ORDER BY e.id LIMIT 1;
""",DB)
        if not rows:
            raise AssertionError("No eligible submitted evidence fixture")
        sid,owner,rev,reviewer=rows.splitlines()[0].split("|")
        check("independent reviewer differs from submitter",reviewer!=owner)
        before=sql(f"SELECT count(*) FROM public.passport_verification_reviews WHERE submission_id='{sid}';",DB)
        # A failed transaction must not leave its earlier valid audit insert behind.
        # Force failure using a deterministic SQL error; no assumption about RPC messages.
        sql(f"""
BEGIN;
INSERT INTO public.passport_verification_reviews
 (submission_id,reviewer_id,decision,rationale,reviewed_revision)
VALUES ('{sid}','{reviewer}','reject','Rollback-only test',{int(rev)});
SELECT 1/0;
COMMIT;
""",DB,failure=True)
        after=sql(f"SELECT count(*) FROM public.passport_verification_reviews WHERE submission_id='{sid}';",DB)
        check("failed transaction rolls back preceding review insert",before==after)
        # Check actual database constraints and grants without guessing their names.
        grants=sql("""
SELECT NOT has_function_privilege('anon',
'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)','EXECUTE')
AND NOT has_function_privilege('authenticated',
'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)','EXECUTE')
AND NOT has_function_privilege('service_role',
'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)','EXECUTE');
""",DB)
        check("review RPC denied to client roles",grants=="t")
        check("submission unchanged by rollback",
              sql(f"SELECT status='submitted' FROM public.passport_evidence_submissions WHERE id='{sid}';",DB)=="t")
        print("PASS: supplemental transaction checks completed")
        print("NOT TESTED: end-to-end JWT/RLS, RPC self-review enforcement, source provenance,")
        print("SERIALIZABLE races, approval activation or production behavior")
    finally:
        if created:
            sql(f'DROP DATABASE "{DB}" WITH (FORCE);')
            print("PASS: disposable clone removed")

if __name__=="__main__":
    main()
