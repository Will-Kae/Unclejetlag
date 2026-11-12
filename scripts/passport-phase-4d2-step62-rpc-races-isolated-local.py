#!/usr/bin/env python3
"""Disabled RPC races in disposable local clones, READ COMMITTED only.
Owner-level identity simulation. No client grants, Auth calls or approvals.
"""
import importlib.util
import os
from pathlib import Path
import select
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
DB = "passport_rpc_race_" + uuid.uuid4().hex[:10]
SIGNATURE = "public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)"


class Failure(RuntimeError):
    pass


def helpers():
    spec = importlib.util.spec_from_file_location(
        "rpc_race_helpers", ROOT / "scripts/passport-phase-4d2-step62-http-isolated-local.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fixture(db, other=None):
    excluded = " AND e.id<>'" + other + "'" if other else ""
    row = db.psql("""
SELECT e.id,e.revision,p.user_id
FROM public.passport_evidence_submissions e
JOIN public.passport_research_profiles p ON p.active AND p.role IN ('reviewer','admin')
 AND p.user_id<>e.submitter_id
WHERE e.status='submitted'
 AND e.revision BETWEEN 1 AND 2147483646
 AND NOT EXISTS (SELECT 1 FROM public.passport_release_candidate_submissions l WHERE l.submission_id=e.id)
 AND NOT EXISTS (SELECT 1 FROM public.passport_verification_reviews r WHERE r.submission_id=e.id AND r.reviewer_id=p.user_id)
""" + excluded + " ORDER BY e.id,p.user_id LIMIT 1;", database=DB)
    parts = row.split("|")
    if len(parts) != 3:
        raise Failure("Eligible distinct submitted fixtures unavailable")
    return str(uuid.UUID(parts[0])), int(parts[1]), str(uuid.UUID(parts[2]))


def transaction(item, key, app, decision="reject"):
    sid, rev, actor = item
    claims = '{"sub":"' + actor + '","role":"authenticated"}'
    return ("BEGIN ISOLATION LEVEL READ COMMITTED;"
            "SET LOCAL statement_timeout='20s'; SET LOCAL lock_timeout='15s';"
            "SET LOCAL application_name='" + app + "';"
            "DO $identity$ BEGIN PERFORM set_config('request.jwt.claims','" + claims + "',true);"
            "PERFORM set_config('request.jwt.claim.sub','" + actor + "',true); END $identity$;"
            "SELECT public.passport_review_submission_staging('" + sid + "'," +
            str(rev) + ",'" + decision + "','Concurrent isolated review rationale','" + key + "');")


def run_race(db, scenario):
    first_item = fixture(db)
    second_item = fixture(db, first_item[0]) if scenario == "cross-submission-key" else first_item
    key1 = str(uuid.uuid4())
    key2 = str(uuid.uuid4()) if scenario == "competing-decisions" else key1
    app1, app2 = "rpc_first_" + uuid.uuid4().hex[:8], "rpc_second_" + uuid.uuid4().hex[:8]
    cmd = ["docker", "exec", "-i", db.DB_CONTAINER, "psql", "-X", "-qAt",
           "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-U", "postgres", "-d", DB]
    before_reviews = int(db.psql("SELECT count(*) FROM public.passport_verification_reviews;", database=DB))
    before_audits = int(db.psql("SELECT count(*) FROM public.passport_verification_audit;", database=DB))
    second_before = db.psql("SELECT to_jsonb(e) FROM public.passport_evidence_submissions e WHERE id='" + second_item[0] + "';", database=DB)
    processes = []
    try:
        first = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE, text=True)
        processes.append(first)
        first.stdin.write(transaction(first_item, key1, app1) + "\nSELECT 'RPC_HELD';\n")
        first.stdin.flush()
        deadline = time.monotonic() + 20
        # Select/read one byte at a time to avoid buffered readline hiding the marker.
        output = ""
        while "RPC_HELD\n" not in output:
            remaining = deadline - time.monotonic()
            if remaining <= 0 or first.poll() is not None:
                raise Failure("First RPC did not reach held transaction")
            if select.select([first.stdout], [], [], min(remaining, 0.2))[0]:
                char = os.read(first.stdout.fileno(), 1).decode()
                if not char:
                    raise Failure("First RPC output ended before held marker")
                output += char
        second = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True)
        processes.append(second)
        decision = "request_changes" if scenario == "competing-decisions" else "reject"
        # Derive the non-approve decision from the actual enum, rather than assuming its spelling.
        if scenario == "competing-decisions":
            decision = db.psql("SELECT enumlabel FROM pg_enum WHERE enumtypid='public.passport_review_decision'::regtype AND enumlabel NOT IN ('approve','reject') ORDER BY enumsortorder LIMIT 1;", database=DB)
            if not decision or not decision.replace("_", "").isalpha():
                raise Failure("Non-approval alternate decision unavailable")
        second.stdin.write(transaction(second_item, key2, app2, decision) + "\nCOMMIT;\n")
        second.stdin.close()
        blocked = False
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline and second.poll() is None:
            result = db.psql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity s JOIN pg_stat_activity f ON f.application_name='" + app1 + "' WHERE s.datname=current_database() AND f.datname=current_database() AND s.application_name='" + app2 + "' AND f.pid=ANY(pg_blocking_pids(s.pid)));", database=DB)
            if result == "t":
                blocked = True
                break
            time.sleep(0.1)
        if not blocked:
            raise Failure("Competing RPC was not observed blocked by first transaction")
        print("PASS: " + scenario + ": overlapping database lock wait observed", flush=True)
        first.stdin.write("COMMIT;\n")
        first.stdin.close()
        first.wait(timeout=25)
        second.wait(timeout=25)
        first_output = output + first.stdout.read()
        second_output = second.stdout.read()
        second_error = second.stderr.read()
        if first.returncode != 0:
            raise Failure("First RPC did not commit")
        if scenario == "identical-retry":
            first_ids = [line for line in first_output.splitlines() if len(line) == 36 and line.count("-") == 4]
            second_ids = [line for line in second_output.splitlines() if len(line) == 36 and line.count("-") == 4]
            if second.returncode != 0 or len(first_ids) != 1 or first_ids != second_ids:
                raise Failure("Concurrent identical retry did not return stable review ID")
        else:
            expected = "stale or unsubmitted evidence" if scenario == "competing-decisions" else "23505"
            if second.returncode == 0 or expected not in second_error:
                raise Failure("Losing RPC did not reject for expected reason")
        reviews = int(db.psql("SELECT count(*) FROM public.passport_verification_reviews;", database=DB))
        audits = int(db.psql("SELECT count(*) FROM public.passport_verification_audit;", database=DB))
        if reviews != before_reviews + 1 or audits != before_audits + 1:
            raise Failure("Race did not leave exactly one review and audit")
        sid, rev, _ = first_item
        if db.psql("SELECT status='rejected' AND revision=" + str(rev+1) + " FROM public.passport_evidence_submissions WHERE id='" + sid + "';", database=DB) != "t":
            raise Failure("Winner transition mismatch")
        if scenario == "cross-submission-key":
            after = db.psql("SELECT to_jsonb(e) FROM public.passport_evidence_submissions e WHERE id='" + second_item[0] + "';", database=DB)
            if after != second_before:
                raise Failure("Request-key collision changed losing submission")
        print("PASS: " + scenario + ": one transition/review/audit; expected replay or rejection", flush=True)
    finally:
        for process in processes:
            if process.poll() is None:
                process.kill()
            process.wait(timeout=10)


def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB") != "yes":
        raise SystemExit("Requires ALLOW_LOCAL_DISPOSABLE_DB=yes")
    db = helpers()
    db.inspect(db.DB_CONTAINER)
    for scenario in ("identical-retry", "competing-decisions", "cross-submission-key"):
        created = False
        try:
            db.psql('CREATE DATABASE "' + DB + '" TEMPLATE "passport_concurrency_test";')
            created = True
            if db.psql("SELECT current_database();", database=DB) != DB:
                raise Failure("Clone identity mismatch")
            db.psql((ROOT / "docs/sql/passport-phase-4d2-STAGING-review-rpc-idempotent.sql").read_text(), database=DB)
            if db.psql("SELECT NOT EXISTS(SELECT 1 FROM unnest(ARRAY['anon','authenticated','service_role']) r WHERE has_function_privilege(r,'" + SIGNATURE + "','EXECUTE'));", database=DB) != "t":
                raise Failure("Client execution must remain denied")
            print("PASS: " + scenario + ": disposable clone and denied client EXECUTE verified", flush=True)
            run_race(db, scenario)
        finally:
            if created:
                db.psql('DROP DATABASE "' + DB + '" WITH (FORCE);')
                print("PASS: disposable RPC race database removed", flush=True)
    print("PASS: disabled RPC READ COMMITTED race scenarios completed")
    print("NOT TESTED: client-role/JWT entrypoint, impersonation defense, higher isolation, source verification or approval/publication")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        raise SystemExit("STOP: " + (str(exc) if isinstance(exc, Failure)
                         else "local RPC race failed; raw details withheld")) from None
