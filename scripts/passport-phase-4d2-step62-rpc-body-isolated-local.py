#!/usr/bin/env python3
"""Exercise disabled review RPC internals in a disposable local clone only.

Owner-level SQL identity simulation, not JWT/HTTP authorization evidence.
Loads the reviewed five-argument prototype into the clone; grants no EXECUTE.
"""
import importlib.util
import os
from pathlib import Path
import uuid

ROOT = Path(__file__).resolve().parents[1]
DB = "passport_rpc_" + uuid.uuid4().hex[:12]
SIGNATURE = "public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)"


class Failure(RuntimeError):
    pass


def load_helpers():
    spec = importlib.util.spec_from_file_location(
        "passport_rpc_helpers", ROOT / "scripts/passport-phase-4d2-step62-http-isolated-local.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB") != "yes":
        raise SystemExit("Requires ALLOW_LOCAL_DISPOSABLE_DB=yes")
    db = load_helpers()
    db.inspect(db.DB_CONTAINER)
    created = False
    stage = "create clone"
    try:
        db.psql('CREATE DATABASE "' + DB + '" TEMPLATE "passport_concurrency_test";')
        created = True
        if db.psql("SELECT current_database();", database=DB) != DB:
            raise Failure("Clone identity mismatch")
        print("PASS: disposable RPC clone identity verified", flush=True)
        stage = "load disabled prototype into clone"
        prototype = ROOT / "docs/sql/passport-phase-4d2-STAGING-review-rpc-idempotent.sql"
        db.psql(prototype.read_text(), database=DB)
        denied = db.psql("SELECT NOT EXISTS (SELECT 1 FROM unnest("
            "ARRAY['anon','authenticated','service_role']) r WHERE has_function_privilege("
            "r,'" + SIGNATURE + "','EXECUTE'));", database=DB)
        if denied != "t":
            raise Failure("Client RPC execution must remain denied")
        print("PASS: reviewed five-argument prototype loaded only in clone; client EXECUTE denied", flush=True)
        stage = "select independent fixture"
        row = db.psql("""
SELECT e.id,e.submitter_id,e.revision,p.user_id
FROM public.passport_evidence_submissions e
JOIN public.passport_research_profiles p ON p.active AND p.role IN ('reviewer','admin')
 AND p.user_id<>e.submitter_id
WHERE e.status='submitted'
 AND NOT EXISTS (SELECT 1 FROM public.passport_release_candidate_submissions l WHERE l.submission_id=e.id)
 AND NOT EXISTS (SELECT 1 FROM public.passport_verification_reviews r WHERE r.submission_id=e.id AND r.reviewer_id=p.user_id)
ORDER BY e.id,p.user_id LIMIT 1;
""", database=DB)
        values = row.split("|")
        if len(values) != 4:
            raise Failure("No eligible independent fixture")
        sid, owner, rev, actor = values
        sid, owner, actor = [str(uuid.UUID(v)) for v in (sid, owner, actor)]
        rev = int(rev)
        if not 0 < rev < 2147483647:
            raise Failure("Fixture revision outside test range")
        request_id = str(uuid.uuid4())

        def identity(who):
            claims = '{"sub":"' + who + '","role":"authenticated"}' if who else '{}'
            return ("SELECT set_config('request.jwt.claims','" + claims + "',true);"
                    "SELECT set_config('request.jwt.claim.sub','" + who + "',true);")

        def call(decision="reject", revision=rev, rationale="Isolated RPC acceptance rationale", key=request_id):
            return ("public.passport_review_submission_staging('" + sid + "'," + str(revision) +
                    ",'" + decision + "','" + rationale + "','" + key + "')")

        snapshot = """
jsonb_build_array(
 (SELECT to_jsonb(e) FROM public.passport_evidence_submissions e WHERE id='%s'),
 (SELECT count(*) FROM public.passport_verification_reviews),
 (SELECT count(*) FROM public.passport_verification_audit))
""" % sid

        def rejection(label, expression, message, who=actor, setup=""):
            nonlocal stage
            stage = label
            sql = ("BEGIN;" + setup + identity(who) + """
DO $test$ DECLARE before_state jsonb; after_state jsonb; rejected boolean := false;
BEGIN
 before_state := """ + snapshot + """;
 BEGIN
  PERFORM """ + expression + """;
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> '""" + message + """' THEN RAISE; END IF;
  rejected := true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Expected exact rejection absent'; END IF;
 after_state := """ + snapshot + """;
 IF after_state IS DISTINCT FROM before_state THEN RAISE EXCEPTION 'Rejection left residue'; END IF;
END $test$;
ROLLBACK;""")
            db.psql(sql, database=DB)
            print("PASS: " + label + "; submission/review/audit unchanged", flush=True)

        rejection("missing identity rejected", call(), "authentication required", who="")
        rejection("self-review rejected", call(), "reviewer not authorized", who=owner)
        rejection("inactive reviewer rejected", call(), "reviewer not authorized",
                  setup="UPDATE public.passport_research_profiles SET active=false WHERE user_id='" + actor + "';")
        rejection("researcher role rejected", call(), "reviewer not authorized",
                  setup="UPDATE public.passport_research_profiles SET role='researcher' WHERE user_id='" + actor + "';")
        rejection("stale revision rejected", call(revision=rev+1), "stale or unsubmitted evidence")
        rejection("short rationale rejected", call(rationale="short"), "review rationale too short")
        rejection("approval remains disabled", call(decision="approve"),
                  "approval disabled: authoritative source verification unavailable")

        stage = "atomic rejection and idempotent retry"
        db.psql("BEGIN;" + identity(actor) + """
DO $test$ DECLARE first_id uuid; retry_id uuid; reviews_before bigint; audits_before bigint;
BEGIN
 SELECT count(*) INTO reviews_before FROM public.passport_verification_reviews;
 SELECT count(*) INTO audits_before FROM public.passport_verification_audit;
 first_id := """ + call() + """;
 retry_id := """ + call() + """;
 IF first_id IS DISTINCT FROM retry_id THEN RAISE EXCEPTION 'Replay result changed'; END IF;
 IF (SELECT count(*) FROM public.passport_verification_reviews) <> reviews_before+1
 OR (SELECT count(*) FROM public.passport_verification_audit) <> audits_before+1
 THEN RAISE EXCEPTION 'Expected exactly one review and audit'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.passport_evidence_submissions
 WHERE id='""" + sid + """' AND status='rejected' AND revision=""" + str(rev+1) + """)
 THEN RAISE EXCEPTION 'Transition mismatch'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.passport_verification_audit
 WHERE object_id='""" + sid + """' AND action='editorial_review'
 AND payload->>'review_id'=first_id::text AND payload->>'request_id'='""" + request_id + """')
 THEN RAISE EXCEPTION 'Correlated audit missing'; END IF;
 BEGIN
  PERFORM """ + call(rationale="Different isolated acceptance rationale") + """;
  RAISE EXCEPTION 'Changed replay unexpectedly accepted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'request id reused with different review' THEN RAISE; END IF;
 END;
END $test$;
ROLLBACK;""", database=DB)
        print("PASS: rejection transition and identical replay yield one review/audit and stable result; changed replay denied", flush=True)

        trigger = """
CREATE FUNCTION public.passport_rpc_test_audit_failure() RETURNS trigger
LANGUAGE plpgsql AS $body$ BEGIN RAISE EXCEPTION 'isolated forced audit failure'; END $body$;
CREATE TRIGGER passport_rpc_test_audit_failure BEFORE INSERT ON public.passport_verification_audit
FOR EACH ROW EXECUTE FUNCTION public.passport_rpc_test_audit_failure();
"""
        rejection("forced audit failure rolls back RPC review and transition",
                  call(), "isolated forced audit failure", setup=trigger)
        print("PASS: isolated disabled-RPC body acceptance completed", flush=True)
        print("NOT TESTED: real role/JWT entrypoint, service-role impersonation defense, request races, higher isolation, source verification or publication")
    except Exception:
        raise Failure("RPC acceptance incomplete at " + stage + "; raw database details withheld") from None
    finally:
        if created:
            db.psql('DROP DATABASE "' + DB + '" WITH (FORCE);')
            print("PASS: disposable RPC database removed", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        raise SystemExit("STOP: " + (str(exc) if isinstance(exc, Failure) else
                         "local RPC operation failed; raw details withheld")) from None
