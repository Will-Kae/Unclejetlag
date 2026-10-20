#!/usr/bin/env python3
"""Phase 4D.2: real competing-write regression in an isolated local database.

Creates a throwaway clone of passport_concurrency_test. Never connects to production.
Requires local Docker, PostgreSQL container and an idle template database.
"""
import os
import subprocess
import threading
import time
import uuid

CONTAINER = "supabase_db_unclejetlag-passport-staging"
SOURCE = "passport_concurrency_test"
TEST_DB = "passport_race_" + uuid.uuid4().hex[:12]
PSQL = ["docker", "exec", "-i", CONTAINER, "psql", "-X", "-qAt",
        "-v", "ON_ERROR_STOP=1", "-U", "postgres"]
def sql(statement, db="postgres", timeout=30):
    p = subprocess.run(PSQL + ["-d", db], input=statement, text=True,
                       capture_output=True, timeout=timeout)
    if p.returncode:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip())
    return p.stdout.strip()

def setup():
    rows = sql("""
SELECT e.id, e.submitter_id, e.revision, p.user_id
FROM public.passport_evidence_submissions e
JOIN public.passport_research_profiles p
  ON p.active AND p.role IN ('reviewer','admin')
 AND p.user_id <> e.submitter_id
WHERE e.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM public.passport_verification_conflicts c
                  WHERE c.submission_id=e.id AND c.status='open')
  AND NOT EXISTS (SELECT 1 FROM public.passport_release_candidate_submissions l
                  WHERE l.submission_id=e.id)
  AND NOT EXISTS (SELECT 1 FROM public.passport_verification_reviews r
                  WHERE r.submission_id=e.id AND r.reviewer_id=p.user_id
                    AND r.reviewed_revision=e.revision)
LIMIT 1;
""", TEST_DB)
    if not rows:
        raise RuntimeError("No eligible fixture in disposable clone")
    sid, owner, revision, reviewer = rows.splitlines()[0].split("|")
    candidate = sql(f"""
BEGIN;
INSERT INTO public.passport_verification_reviews
 (submission_id,reviewer_id,decision,rationale,reviewed_revision)
VALUES ('{sid}','{reviewer}','approve','Isolated race fixture',{int(revision)});
UPDATE public.passport_evidence_submissions
 SET status='approved',revision={int(revision)+1} WHERE id='{sid}';
INSERT INTO public.passport_release_candidates(dataset_sha256,created_by)
 VALUES (repeat('a',64),'{reviewer}') RETURNING id;
COMMIT;
""", TEST_DB)
    cid = next((x for x in candidate.splitlines() if len(x)==36 and x.count("-")==4), None)
    if not cid:
        raise RuntimeError("Candidate ID not returned: "+candidate)
    return sid,cid

def race(order, sid, cid):
    # The winner performs a REAL guarded write, then holds its transaction
    # until the losing session starts attempting its competing guarded write.
    link = f"""INSERT INTO public.passport_release_candidate_submissions
 (candidate_id,submission_id) VALUES ('{cid}','{sid}');"""
    conflict = f"""INSERT INTO public.passport_verification_conflicts
 (submission_id,conflicting_reference,description)
 VALUES ('{sid}','RACE-{uuid.uuid4().hex}','Concurrent race regression');"""
    first,second = (link,conflict) if order=="link-first" else (conflict,link)
    ready=threading.Event()
    started=threading.Event()
    outcome={}

    def winner():
        p=subprocess.Popen(PSQL+["-d",TEST_DB],stdin=subprocess.PIPE,
                           stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                           text=True,bufsize=1)
        try:
            p.stdin.write("BEGIN;\nSET LOCAL lock_timeout='8s';\n"+first+"\nSELECT 'FIRST_WRITE_DONE';\n")
            p.stdin.flush()
            for line in p.stdout:
                if line.strip()=="FIRST_WRITE_DONE":
                    ready.set()
                    break
            if not ready.is_set():
                raise RuntimeError("First guarded write did not finish: "+p.stderr.read())
            if not started.wait(8):
                raise RuntimeError("Second transaction did not start")
            time.sleep(0.8)
            p.stdin.write("COMMIT;\n")
            p.stdin.close()
            err=p.stderr.read()
            rc=p.wait(timeout=12)
            if rc: raise RuntimeError("First transaction failed: "+err)
            outcome["first"]="committed"
        except BaseException as exc:
            outcome["first"]=str(exc)
            p.kill()
            ready.set()
            started.set()

    def loser():
        if not ready.wait(8):
            outcome["second"]="First transaction not ready"
            return
        started.set()
        p=subprocess.run(PSQL+["-d",TEST_DB],input="BEGIN;\nSET LOCAL lock_timeout='6s';\n"+second+"\nCOMMIT;\n",
                         capture_output=True,text=True,timeout=12)
        outcome["second"]=(p.returncode,p.stderr.strip())

    a=threading.Thread(target=winner)
    b=threading.Thread(target=loser)
    a.start(); b.start()
    a.join(16); b.join(16)
    if a.is_alive() or b.is_alive():
        raise RuntimeError("Thread timeout: "+repr(outcome))
    expected=("Open conflict prohibited for release-linked evidence"
              if order=="link-first" else "Unresolved conflict blocks release candidate")
    if outcome.get("first")!="committed":
        raise RuntimeError(f"{order}: winner failed: {outcome}")
    second_result=outcome.get("second")
    if not isinstance(second_result,tuple) or second_result[0]==0 or expected not in second_result[1]:
        raise RuntimeError(f"{order}: expected {expected!r}, got {outcome}")
    violations=sql(f"""
SELECT count(*) FROM public.passport_release_candidate_submissions l
JOIN public.passport_verification_conflicts c ON c.submission_id=l.submission_id
WHERE l.submission_id='{sid}' AND c.status='open';
""",TEST_DB)
    if violations!="0":
        raise RuntimeError(f"{order}: linked evidence has open conflicts")
    print(f"PASS: {order}: first write committed, competing write rejected for expected reason")
    print(f"PASS: {order}: no linked evidence with open conflict")

def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB")!="yes":
        raise SystemExit("Set ALLOW_LOCAL_DISPOSABLE_DB=yes to allow isolated local clone")
    created=False
    try:
        sql(f'CREATE DATABASE "{TEST_DB}" TEMPLATE "{SOURCE}";')
        created=True
        sid,cid=setup()
        race("link-first",sid,cid)
        # Reset the clone fixture between directions by recreating the clone.
        sql(f'DROP DATABASE "{TEST_DB}" WITH (FORCE);')
        created=False
        sql(f'CREATE DATABASE "{TEST_DB}" TEMPLATE "{SOURCE}";')
        created=True
        sid,cid=setup()
        race("conflict-first",sid,cid)
        print("PASS: Both actual competing-write orders verified")
    finally:
        if created:
            sql(f'DROP DATABASE "{TEST_DB}" WITH (FORCE);')
            print("PASS: Isolated test database removed")

if __name__=="__main__":
    main()
