#!/usr/bin/env python3
"""Step 62: isolated, temporary PostgREST HTTP deny-by-default smoke test.

Creates a disposable clone of the local passport test DB, launches a separate
PostgREST container bound to 127.0.0.1 on a random port, performs unauthenticated
HTTP checks, then removes both. Never touches the existing API configuration.
Does not validate signed JWTs or approval flows.
"""
import json
import re
import http.client
import os
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, build_opener, ProxyHandler

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
            # Container port publishing targets 3000: explicitly bind the API
            # to 0.0.0.0:3000 inside this disposable container only.
            safe["PGRST_SERVER_HOST"] = "0.0.0.0"
            safe["PGRST_SERVER_PORT"] = "3000"
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
        opener = build_opener(ProxyHandler({}))  # Bypass system proxies for loopback only.
        ready = False
        last_issue = "none"
        for _ in range(30):
            try:
                with opener.open(base + "/", timeout=2) as response:
                    ready = response.status < 500
                    break
            except HTTPError as exc:
                if exc.code < 500:
                    ready = True
                    break
            except (URLError, http.client.RemoteDisconnected, ConnectionResetError,
                    ConnectionAbortedError, TimeoutError, OSError) as exc:
                last_issue = type(exc).__name__
            time.sleep(0.5)
        if not ready:
            state = inspect(EPHEMERAL)["State"]
            status = state.get("Status", "unknown")
            # Docker logs may contain connection information: display only an
            # allowlisted, non-sensitive diagnosis instead of raw logs.
            print(f"DIAGNOSTIC: temporary service status={status}; "
                  f"last connection error={last_issue}")
            logs_result = call(["docker", "logs", "--tail", "120", EPHEMERAL], check=False)
            # Never output raw logs: they can contain credentials and connection strings.
            logs = logs_result.stdout + logs_result.stderr
            # Classify actual error-level events, not benign startup messages
            # such as "schema cache loaded". Never print raw logs.
            error_lines = [
                line for line in logs.splitlines()
                if re.search(r"\b(error|fatal|critical|panic)\b", line, re.I)
            ]
            signatures = {
                "database connection refused": r"connection refused|could not connect to server",
                "database authentication failed": r"password authentication failed|authentication failed",
                "database missing": r"database .+ does not exist",
                "role missing": r"role .+ does not exist",
                "schema cache load error": r"failed to load.*schema cache|schema cache.*(failed|error)",
                "configuration parsing error": r"failed to parse|invalid configuration|unexpected parameter",
                "database connection timeout": r"connection timed out|timeout expired",
                "database host not found": r"could not translate host name|name or service not known",
            }
            matches = [label for label, pattern in signatures.items()
                       if any(re.search(pattern, line, re.IGNORECASE)
                              for line in error_lines)]
            print("DIAGNOSTIC: startup error categories:",
                  ", ".join(matches) if matches else "none classified")
            print("DIAGNOSTIC: error-level log entries:", len(error_lines))
            # Read-only server-side evidence from the disposable database.
            # Never print connection strings, role secrets, or query text.
            session_count = psql(
                "SELECT count(*) FROM pg_stat_activity "
                "WHERE datname = current_setting('passport_probe_target', true);"
            ) if False else psql(
                "SELECT count(*) FROM pg_stat_activity WHERE datname = '" + CLONE + "';"
            )
            print("DIAGNOSTIC: disposable database connections:", session_count)
            local_connect = psql(
                "SELECT has_database_privilege('authenticator', current_database(), 'CONNECT');",
                database=CLONE
            )
            print("DIAGNOSTIC: authenticator CONNECT grant:", local_connect)
            database_exists = psql("SELECT current_database();", database=CLONE)
            print("DIAGNOSTIC: disposable clone identity verified:",
                  database_exists == CLONE)

            print("DIAGNOSTIC: container exit code:", state.get("ExitCode", "unknown"))
            # Safe port/network metadata only; never print docker inspect environment.
            net = inspect(EPHEMERAL)["NetworkSettings"]
            ports = net.get("Ports", {}).get("3000/tcp") or []
            print("DIAGNOSTIC: published port mappings:",
                  len(ports), "loopback_only:",
                  all(p.get("HostIp") in ("127.0.0.1", "::1") for p in ports))
            print("DIAGNOSTIC: shared Docker network attached:",
                  network in net.get("Networks", {}))
            cfg = inspect(EPHEMERAL)["Config"]
            exposed = sorted((cfg.get("ExposedPorts") or {}).keys())
            print("DIAGNOSTIC: declared container exposed ports:", exposed)
            print("DIAGNOSTIC: PostgREST server host override present:",
                  "PGRST_SERVER_HOST" in safe)
            print("DIAGNOSTIC: PostgREST server port override:",
                  safe.get("PGRST_SERVER_PORT", "(default)"))
            print("DIAGNOSTIC: Docker port forwarding may be healthy even when "
                  "PostgREST does not listen on its published container port.")
            # Docker-internal TCP probe: connect directly to the disposable
            # PostgREST container from the existing local database container.
            # Python is available in Supabase's PostgreSQL image only if present;
            # use bash /dev/tcp when available, without network downloads.
            probe = call([
                "docker", "exec", DB_CONTAINER, "bash", "-c",
                "timeout 3 bash -c 'echo > /dev/tcp/" + EPHEMERAL + "/3000'"
            ], check=False, timeout=8)
            print("DIAGNOSTIC: internal Docker TCP port 3000:",
                  "reachable" if probe.returncode == 0 else "unreachable or probe unavailable")
            print("DIAGNOSTIC: localhost HTTP still disconnected despite direct port mapping")
            # Inspect the HTTP status line from inside the Docker network using
            # bash's /dev/tcp feature; no Python or additional packages needed.
            # Never print headers, bodies, credentials, or raw errors.
            internal_http = call([
                "docker", "exec", DB_CONTAINER, "bash", "-c",
                "exec 3<>/dev/tcp/" + EPHEMERAL + "/3000 || exit 11; "
                "printf 'GET / HTTP/1.0\\r\\nHost: localhost\\r\\nConnection: close\\r\\n\\r\\n' >&3; "
                "IFS= read -r -t 4 status_line <&3 || exit 12; "
                "case \"$status_line\" in HTTP/*) "
                "printf '%s\\n' \"$status_line\" | cut -d' ' -f2 ;; "
                "*) exit 13 ;; esac"
            ], check=False, timeout=8)
            # A status line can include carriage return, extra whitespace,
            # or a valid HTTP status code not present in the old allowlist.
            raw_status = internal_http.stdout.strip()
            status_match = re.search(r"\b([1-5][0-9]{2})\b", raw_status)
            status = status_match.group(1) if status_match else None
            if internal_http.returncode == 0 and status is not None:
                print("DIAGNOSTIC: internal Docker HTTP status:", status)
            else:
                # stdout may be blank, include a truncated/non-HTTP status line,
                # or contain only a carriage return; report shape, not content.
                print("DIAGNOSTIC: internal HTTP stdout shape:",
                      "empty" if not raw_status else
                      "nonempty_without_http_status",
                      "length_bucket:",
                      "0" if not raw_status else
                      "1-8" if len(raw_status) <= 8 else
                      "9-64" if len(raw_status) <= 64 else "65+")
                print("DIAGNOSTIC: internal Docker HTTP:",
                      {11: "TCP connection failed", 12: "no HTTP status line received",
                       13: "non-HTTP response"}.get(
                           internal_http.returncode, "unclassified probe failure"))
                print("DIAGNOSTIC: internal HTTP probe exit code:",
                      internal_http.returncode)
                print("DIAGNOSTIC: probe stderr category:",
                      "bash command missing" if internal_http.returncode == 127
                      else "shell or I/O error" if internal_http.returncode in (1, 2)
                      else "timeout" if internal_http.returncode == 124
                      else "unclassified (raw stderr withheld)")
            print("DIAGNOSTIC: internal HTTP readiness is not an authorization assertion")
            print("DIAGNOSTIC: raw logs withheld (may contain credentials)")
            raise RuntimeError("Temporary PostgREST did not become ready; "
                               "no HTTP authorization checks executed")
        print("PASS: isolated PostgREST started on loopback (system proxies bypassed)", flush=True)
        # No bearer token and no API key: deny-by-default expected.
        for resource in ("passport_evidence_submissions", "passport_verification_reviews",
                         "passport_research_profiles"):
            request = Request(base + "/" + resource + "?select=*", method="GET")
            try:
                with opener.open(request, timeout=5) as response:
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
