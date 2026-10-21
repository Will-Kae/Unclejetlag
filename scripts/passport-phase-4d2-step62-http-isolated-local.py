#!/usr/bin/env python3
"""Step 62: isolated, temporary PostgREST HTTP deny-by-default smoke test.

Creates a disposable clone of the local passport test DB, launches a separate
PostgREST container bound to 127.0.0.1 on a random port, performs unauthenticated
HTTP checks, then removes both. Never touches the existing API configuration.
Does not validate signed JWTs or approval flows.
"""
import json
import os
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

REST = "supabase_rest_unclejetlag-passport-staging"
DB_CONTAINER = "supabase_db_unclejetlag-passport-staging"
SOURCE = "passport_concurrency_test"
SUFFIX = uuid.uuid4().hex[:10]
CLONE = "passport_http_" + SUFFIX
EPHEMERAL = "passport-http-test-" + SUFFIX

def call(args, *, input=None, check=True, timeout=35):
    p = subprocess.run(args, input=input, text=True, capture_output=True, timeout=timeout)
    if check and p.returncode:
        raise RuntimeError(f"Command failed: {args[:3]}: {p.stderr.strip()}")
    return p

def inspect(name):
    result = json.loads(call(["docker", "inspect", name]).stdout)
    if len(result) != 1 or result[0].get("Name") != "/" + name:
        raise RuntimeError("Unexpected local container identity")
    return result[0]

def psql(sql, database="postgres"):
    return call(["docker", "exec", "-i", DB_CONTAINER, "psql", "-X", "-qAt",
                 "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database],
                input=sql).stdout.strip()

def replace_database(uri, database):
    parsed = urlsplit(uri)
    if parsed.scheme not in ("postgres", "postgresql") or not parsed.hostname:
        raise RuntimeError("STOP: unsupported PostgREST database URI format")
    if parsed.path not in ("/postgres", "postgres"):
        raise RuntimeError("STOP: source PostgREST must target the local postgres DB")
    return urlunsplit((parsed.scheme, parsed.netloc, "/" + database,
                       parsed.query, parsed.fragment)), parsed.hostname

def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB") != "yes":
        raise SystemExit("Requires ALLOW_LOCAL_DISPOSABLE_DB=yes")
    rest = inspect(REST)
    db = inspect(DB_CONTAINER)
    rest_networks = rest["NetworkSettings"]["Networks"]
    db_networks = db["NetworkSettings"]["Networks"]
    common = sorted(set(rest_networks) & set(db_networks))
    if len(common) != 1:
        raise RuntimeError("STOP: expected exactly one shared local Docker network")
    network = common[0]
    env = dict(entry.split("=", 1) for entry in rest["Config"]["Env"] if "=" in entry)
    uri = env.get("PGRST_DB_URI", "")
    new_uri, host = replace_database(uri, CLONE)
    allowed_hosts = {DB_CONTAINER, db["Name"].lstrip("/")}
    allowed_hosts.update(db_networks[network].get("Aliases") or [])
    if host not in allowed_hosts:
        raise RuntimeError("STOP: PostgREST DB hostname does not identify the expected local DB container")
    if env.get("PGRST_DB_ANON_ROLE") != "anon":
        raise RuntimeError("STOP: unexpected anonymous role")
    if "public" not in env.get("PGRST_DB_SCHEMAS", "").split(","):
        raise RuntimeError("STOP: public schema not exposed by local PostgREST")
    image = rest["Config"]["Image"]
    created = False
    launched = False
    try:
        psql(f'CREATE DATABASE "{CLONE}" TEMPLATE "{SOURCE}";')
        created = True
        print("PASS: disposable database clone created", flush=True)
        # Never print the connection string, JWT secret, or temporary env file.
        with tempfile.TemporaryDirectory(prefix="passport-http-") as folder:
            path = Path(folder) / "postgrest.env"
            safe = {k: v for k, v in env.items() if k.startswith("PGRST_")}
            safe["PGRST_DB_URI"] = new_uri
            # Prevent PostgREST from silently using a different schema.
            safe["PGRST_DB_SCHEMAS"] = "public"
            path.write_text("".join(f"{k}={v}\n" for k, v in safe.items()))
            path.chmod(0o600)
            call(["docker", "run", "-d", "--rm", "--name", EPHEMERAL,
                  "--network", network, "-p", "127.0.0.1::3000",
                  "--env-file", str(path), image])
            launched = True
        port_line = call(["docker", "port", EPHEMERAL, "3000/tcp"]).stdout.strip()
        if len(port_line.splitlines()) != 1 or not port_line.startswith("127.0.0.1:"):
            raise RuntimeError("STOP: ephemeral API must bind exclusively to loopback")
        port = int(port_line.rsplit(":", 1)[1])
        base = f"http://127.0.0.1:{port}"
        ready = False
        for _ in range(30):
            try:
                with urlopen(base + "/", timeout=2) as response:
                    ready = response.status < 500
                    break
            except HTTPError as exc:
                if exc.code < 500:
                    ready = True
                    break
            except URLError:
                time.sleep(0.5)
        if not ready:
            raise RuntimeError("Temporary PostgREST did not become ready")
        print("PASS: isolated PostgREST started on loopback", flush=True)
        # No bearer token and no API key: deny-by-default expected.
        for resource in ("passport_evidence_submissions", "passport_verification_reviews",
                         "passport_research_profiles"):
            request = Request(base + "/" + resource + "?select=*", method="GET")
            try:
                with urlopen(request, timeout=5) as response:
                    raise AssertionError(f"FAIL: anonymous GET unexpectedly returned {response.status}: {resource}")
            except HTTPError as exc:
                if exc.code not in (401, 403):
                    raise AssertionError(f"FAIL: unexpected anonymous HTTP {exc.code} for {resource}")
                print(f"PASS: anonymous GET {resource} rejected (HTTP {exc.code})")
        print("PASS: isolated anonymous HTTP denial smoke test")
        print("NOT TESTED: signed JWT, authenticated RLS, PostgREST RPC, approval or publication")
    finally:
        if launched:
            call(["docker", "rm", "-f", EPHEMERAL], check=False)
            print("PASS: temporary PostgREST removed")
        if created:
            psql(f'DROP DATABASE "{CLONE}" WITH (FORCE);')
            print("PASS: disposable database clone removed")

if __name__ == "__main__":
    main()
