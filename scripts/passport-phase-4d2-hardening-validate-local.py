#!/usr/bin/env python3
"""Phase 4D.2: validate consolidated hardening candidate in a throwaway local clone.

Never targets production. No approval enablement. Drops clone even on failure.
"""
import os
import subprocess
import uuid
from pathlib import Path

CONTAINER = "supabase_db_unclejetlag-passport-staging"
SOURCE = "passport_concurrency_test"
CLONE = "passport_hardening_" + uuid.uuid4().hex[:12]
MIGRATION = Path(__file__).resolve().parents[1] / "docs/sql/passport-phase-4d2-local-hardening-CANDIDATE.sql"
PSQL = ["docker", "exec", "-i", CONTAINER, "psql", "-X", "-qAt",
        "-v", "ON_ERROR_STOP=1", "-U", "postgres"]

def run(query, database="postgres", expected_failure=None):
    p = subprocess.run(PSQL + ["-d", database], input=query, text=True,
                       capture_output=True, timeout=35)
    if expected_failure is not None:
        if p.returncode == 0 or expected_failure not in p.stderr:
            raise RuntimeError(f"Expected failure {expected_failure!r}; got rc={p.returncode}, stderr={p.stderr}, stdout={p.stdout}")
        return p.stderr.strip()
    if p.returncode:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return p.stdout.strip()

def assert_true(label, statement):
    result=run(statement, CLONE)
    if result != "t":
        raise RuntimeError(f"{label}: expected t, got {result!r}")
    print("PASS:",label)

def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_DISPOSABLE_DB=yes to allow isolated clone")
    if not MIGRATION.is_file():
        raise RuntimeError(f"Missing candidate migration: {MIGRATION}")
    # Confirm the expected local Docker container is available before any writes.
    check=subprocess.run(["docker","inspect","--format","{{.Name}}",CONTAINER],
                         capture_output=True,text=True,timeout=15)
    if check.returncode or check.stdout.strip()!="/"+CONTAINER:
        raise RuntimeError("Expected local Docker container not found")
    created=False
    try:
        run(f'CREATE DATABASE "{CLONE}" TEMPLATE "{SOURCE}";')
        created=True
        print("PASS: disposable database clone created")
        run(MIGRATION.read_text(),CLONE)
        print("PASS: consolidated migration applied in clone")
        assert_true("approved UPDATE/DELETE and conflict/release guards enabled", """
SELECT
  (SELECT count(*)=4 FROM pg_trigger
   WHERE tgrelid IN ('public.passport_evidence_submissions'::regclass,
                     'public.passport_verification_conflicts'::regclass,
                     'public.passport_release_candidate_submissions'::regclass)
   AND tgname IN ('passport_approved_evidence_update_guard',
                  'passport_approved_evidence_delete_guard',
                  'passport_linked_conflict_guard',
                  'passport_release_candidate_guard')
   AND tgenabled='O');
""")
        assert_true("RPC remains inaccessible to client roles", """
SELECT NOT has_function_privilege('anon',
 'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)','EXECUTE')
AND NOT has_function_privilege('authenticated',
 'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)','EXECUTE')
AND NOT has_function_privilege('service_role',
 'public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)','EXECUTE');
""")
        assert_true("release guard uses previous revision", """
SELECT pg_get_functiondef('public.passport_check_release_candidate()'::regprocedure)
 LIKE '%evidence.revision - 1%';
""")
        assert_true("conflict guard locks evidence row", """
SELECT pg_get_functiondef('public.passport_protect_linked_conflicts()'::regprocedure)
 LIKE '%FOR UPDATE%';
""")
        # Create a synthetic approved fixture exclusively in the throwaway clone.
        # This is test setup, NOT an editorial approval or a production pathway.
        # Choose a submitted, unlinked row and perform one setup transition.
        approved=run("""
UPDATE public.passport_evidence_submissions e
SET status='approved', revision=e.revision+1
WHERE e.id=(
  SELECT s.id FROM public.passport_evidence_submissions s
  WHERE s.status='submitted'
    AND NOT EXISTS (
      SELECT 1 FROM public.passport_release_candidate_submissions l
      WHERE l.submission_id=s.id
    )
  ORDER BY s.id LIMIT 1
)
RETURNING e.id;
""",CLONE)
        if not approved or len(approved.splitlines()) != 1:
            raise RuntimeError("INCOMPLETE: could not create isolated approved fixture")
        approved=approved.strip()
        assert_true("approved fixture created in disposable clone",
            f"SELECT EXISTS (SELECT 1 FROM public.passport_evidence_submissions WHERE id='{approved}' AND status='approved');")
        run(f"UPDATE public.passport_evidence_submissions SET revision=revision+1 WHERE id='{approved}';",
            CLONE,expected_failure="Approved evidence is immutable")
        print("PASS: approved evidence UPDATE rejected")
        run(f"DELETE FROM public.passport_evidence_submissions WHERE id='{approved}';",
            CLONE,expected_failure="Approved evidence cannot be deleted")
        print("PASS: approved evidence DELETE rejected")
        assert_true("approved fixture survives both rejected operations",
            f"SELECT EXISTS (SELECT 1 FROM public.passport_evidence_submissions WHERE id='{approved}' AND status='approved');")
        print("PASS: local hardening candidate validation completed")
    finally:
        if created:
            run(f'DROP DATABASE "{CLONE}" WITH (FORCE);')
            print("PASS: disposable clone removed")

if __name__=="__main__":
    main()
