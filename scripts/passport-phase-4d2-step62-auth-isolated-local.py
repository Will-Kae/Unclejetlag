#!/usr/bin/env python3
"""Real GoTrue password/session smoke test, ONLY in a disposable local DB clone.

Does not test the Next.js app, cookies, profile RLS, or production. Uses the
already-installed local Auth image and a fresh signing key; no existing Auth
configuration, credentials, users, role grants, or network attachments change.
"""
import base64
import hashlib
import hmac
import http.client
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import tempfile
import time
import uuid
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, ProxyHandler, build_opener

AUTH = "supabase_auth_unclejetlag-passport-staging"
SOURCE = "passport_concurrency_test"
CLONE = "passport_auth_" + uuid.uuid4().hex[:10]
SERVICE = "passport-auth-test-" + uuid.uuid4().hex[:10]


class TestFailure(RuntimeError):
    """Only fixed, non-sensitive test failure messages."""


def helpers():
    path = Path(__file__).with_name("passport-phase-4d2-step62-http-isolated-local.py")
    spec = importlib.util.spec_from_file_location("passport_http_helpers", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def signed_admin(secret):
    def enc(value):
        return base64.urlsafe_b64encode(value).rstrip(b"=")
    header = enc(b'{"alg":"HS256","typ":"JWT"}')
    claims = enc(json.dumps({"role": "service_role", "aud": "authenticated",
                             "sub": str(uuid.uuid4()), "exp": int(time.time()) + 600}).encode())
    body = header + b"." + claims
    return (body + b"." + enc(hmac.new(secret.encode(), body, hashlib.sha256).digest())).decode()


def request_json(opener, base, path, method="GET", payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(base + path, method=method, headers=headers,
                  data=None if payload is None else json.dumps(payload).encode())
    try:
        with opener.open(req, timeout=8) as response:
            status, raw = response.status, response.read(131072)
    except HTTPError as exc:
        status, raw = exc.code, exc.read(131072)
    try:
        body = json.loads(raw) if raw else {}
    except (ValueError, TypeError):
        raise TestFailure("Auth returned non-JSON response; body withheld") from None
    return status, body


def exercise_auth(opener, base, secret, db):
    email = "passport-" + uuid.uuid4().hex + "@example.invalid"
    password = secrets.token_urlsafe(32)
    status, user = request_json(opener, base, "/admin/users", "POST",
                               {"email": email, "password": password, "email_confirm": True},
                               signed_admin(secret))
    if status not in (200, 201) or not isinstance(user, dict):
        raise TestFailure("Synthetic user creation failed (HTTP " + str(status) + "); body withheld")
    try:
        user_id = str(uuid.UUID(user["id"]))
    except (KeyError, ValueError, TypeError):
        raise TestFailure("Synthetic Auth user ID missing or invalid") from None
    print("PASS: synthetic user created by disposable Auth API; no email sent")
    status, rejected = request_json(opener, base, "/token?grant_type=password", "POST",
                                   {"email": email, "password": secrets.token_urlsafe(32)})
    if status not in (400, 401) or not isinstance(rejected, dict) or rejected.get("error_code") != "invalid_credentials":
        raise TestFailure("Wrong-password test did not return invalid_credentials; body withheld")
    print("PASS: wrong password rejected by real Auth service")
    status, session = request_json(opener, base, "/token?grant_type=password", "POST",
                                  {"email": email, "password": password})
    if status != 200 or not isinstance(session, dict):
        raise TestFailure("Real password login failed (HTTP " + str(status) + "); body withheld")
    access, refresh = session.get("access_token"), session.get("refresh_token")
    if not isinstance(access, str) or not isinstance(refresh, str):
        raise TestFailure("Real login did not return access and refresh tokens")
    try:
        encoded = access.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        session_id = str(uuid.UUID(claims["session_id"]))
    except (IndexError, KeyError, ValueError, TypeError):
        raise TestFailure("Auth-issued session_id claim missing or invalid") from None
    if claims.get("sub") != user_id or claims.get("role") != "authenticated":
        raise TestFailure("Auth-issued identity/role mismatch")
    # This only reads the temporary clone; the session ID is validated as a UUID.
    def session_exists():
        return db.psql("SELECT EXISTS(SELECT 1 FROM auth.sessions WHERE id='" +
                       session_id + "' AND user_id='" + user_id + "');", database=CLONE)
    if session_exists() != "t":
        raise TestFailure("Auth-issued token has no matching disposable database session")
    print("PASS: real password login issued tokens and a matching database session")
    status, verified = request_json(opener, base, "/user", token=access)
    if status != 200 or not isinstance(verified, dict) or verified.get("id") != user_id:
        raise TestFailure("Auth /user did not validate the issued identity")
    print("PASS: real Auth /user validates issued access token")
    status, _ = request_json(opener, base, "/logout?scope=local", "POST", token=access)
    if status not in (200, 204):
        raise TestFailure("Auth local logout failed (HTTP " + str(status) + ")")
    if session_exists() != "f":
        raise TestFailure("Local logout left the disposable session present")
    print("PASS: Auth logout removed the matching database session")
    status, rejected = request_json(opener, base, "/token?grant_type=refresh_token", "POST",
                                   {"refresh_token": refresh})
    code = rejected.get("error_code", "") if isinstance(rejected, dict) else ""
    if status not in (400, 401) or not isinstance(code, str) or not (
            code.startswith("refresh_token_") or code == "invalid_refresh_token"):
        raise TestFailure("Post-logout refresh token was not explicitly rejected")
    print("PASS: logged-out refresh token rejected")
    status, _ = request_json(opener, base, "/user", token=access)
    if status in (401, 403):
        print("OBSERVED: Auth /user rejects old access token after logout")
    elif status == 200:
        print("OBSERVED: old access token still accepted by /user until expiry")
        print("OPEN GATE: immediate access-token revocation is NOT established")
    else:
        raise TestFailure("Unexpected post-logout /user HTTP status " + str(status))
    print("PASS: disposable real-Auth login/session smoke test completed")
    print("NOT TESTED: application verifyResearchSession, browser cookies, application logout, RLS or RPC internals")


def compare_migration_histories(db, test_database=SOURCE):
    """Read-only version comparison; emit only counts and numeric version IDs."""
    query = ("BEGIN READ ONLY; SELECT coalesce(json_agg(version ORDER BY version),"
             "'[]'::json)::text FROM auth.schema_migrations; ROLLBACK;")
    histories = {}
    for label, database in (("candidate_auth", test_database), ("existing_local_auth", "postgres")):
        try:
            values = json.loads(db.psql(query, database=database))
        except (ValueError, TypeError):
            raise TestFailure("Auth migration history is not a JSON array; raw details withheld") from None
        if not isinstance(values, list) or any(
                not isinstance(x, (str, int)) or isinstance(x, bool) for x in values):
            raise TestFailure("Unsupported Auth migration version format; raw details withheld")
        versions = [str(x) for x in values]
        histories[label] = set(versions)
        print("MIGRATIONS:", label, "rows:", len(versions), "unique:", len(set(versions)))
        numeric = sorted(x for x in versions if re.fullmatch(r"[0-9]{1,20}", x))
        print("MIGRATIONS:", label, "latest numeric versions:", ",".join(numeric[-5:]) or "(none)")
        print("MIGRATIONS:", label, "non-numeric version count:", len(versions) - len(numeric))
        if len(versions) != len(set(versions)):
            raise TestFailure("Duplicate Auth migration versions; STOP before startup")
    test = histories["candidate_auth"]
    existing = histories["existing_local_auth"]
    for label, versions in (("missing_from_candidate_auth", existing - test),
                            ("only_in_candidate_auth", test - existing)):
        sample = sorted(x for x in versions if re.fullmatch(r"[0-9]{1,20}", x))[:10]
        print("MIGRATION DIFFERENCE:", label, "count:", len(versions),
              "numeric sample:", ",".join(sample) or "(none)")
    if test != existing:
        print("SAFETY: existing databases and services unchanged; caller cleans temporary resources")
        raise TestFailure("Auth migration histories differ; login assertions NOT RUN")
    print("PASS: Auth migration version sets match (schema compatibility not implied)")


def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_AUTH") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_DISPOSABLE_AUTH=yes")
    db = helpers()
    auth, database = db.inspect(AUTH), db.inspect(db.DB_CONTAINER)
    if not auth.get("State", {}).get("Running") or not database.get("State", {}).get("Running"):
        raise TestFailure("Expected local Uncle Jetlag services are not running")
    common = set(auth["NetworkSettings"]["Networks"]) & set(database["NetworkSettings"]["Networks"])
    if len(common) != 1:
        raise TestFailure("Expected exactly one shared local Docker network")
    network = next(iter(common))
    env = dict(x.split("=", 1) for x in auth["Config"].get("Env", []) if "=" in x)
    uri = env.get("GOTRUE_DB_DATABASE_URL") or env.get("DATABASE_URL") or ""
    new_uri, host = db.replace_database(uri, CLONE)
    aliases = set(database["NetworkSettings"]["Networks"][network].get("Aliases") or [])
    aliases.add(db.DB_CONTAINER)
    parsed = urlsplit(uri)
    if host not in aliases or parsed.username != "supabase_auth_admin":
        raise TestFailure("Auth DB URI must identify expected local DB and Auth administrator role")
    # Compare migration histories before startup; don't auto-upgrade a mismatched
    # passport test clone just to get the Auth service running.
    fresh_auth = os.getenv("ALLOW_LOCAL_FRESH_AUTH_DB") == "yes"
    if not fresh_auth:
        compare_migration_histories(db)
    secret = secrets.token_hex(32)
    created = launched = False
    try:
        if fresh_auth:
            # Bootstrap a new empty database, never stamp migration records or
            # upgrade the hand-built passport fixture. Existing cluster roles
            # and their privileges are not changed.
            db.psql('CREATE DATABASE "' + CLONE + '" TEMPLATE template0 OWNER supabase_auth_admin;')
        else:
            db.psql('CREATE DATABASE "' + CLONE + '" TEMPLATE "' + SOURCE + '";')
        created = True
        if db.psql("SELECT current_database();", database=CLONE) != CLONE:
            raise TestFailure("Disposable Auth database identity mismatch")
        if fresh_auth:
            db.psql("CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;", database=CLONE)
            print("PASS: fresh disposable Auth database and empty auth schema created", flush=True)
            print("BOOTSTRAP: installed Auth image must run its own migrations; no migration records copied")
        else:
            print("PASS: disposable Auth database clone created; migration histories match", flush=True)
        safe = {
            "GOTRUE_API_HOST": "0.0.0.0", "GOTRUE_API_PORT": "9999",
            "API_EXTERNAL_URL": "http://127.0.0.1:9999",
            "GOTRUE_SITE_URL": "http://127.0.0.1:3000",
            "GOTRUE_DB_DRIVER": "postgres", "GOTRUE_DB_DATABASE_URL": new_uri,
            "GOTRUE_DB_NAMESPACE": "auth",
            "GOTRUE_JWT_SECRET": secret, "GOTRUE_JWT_EXP": "3600",
            "GOTRUE_JWT_AUD": "authenticated", "GOTRUE_JWT_ADMIN_ROLES": "service_role",
            "GOTRUE_JWT_DEFAULT_GROUP_NAME": "authenticated",
            "GOTRUE_DISABLE_SIGNUP": "true", "GOTRUE_EXTERNAL_EMAIL_ENABLED": "true",
            "GOTRUE_MAILER_AUTOCONFIRM": "true",
        }
        # No inherited JWT/JWK keys, SMTP settings, OAuth secrets or hooks.
        migrations = env.get("GOTRUE_DB_MIGRATIONS_PATH")
        if migrations:
            safe["GOTRUE_DB_MIGRATIONS_PATH"] = migrations
        if any("\n" in value or "\r" in value for value in safe.values()):
            raise TestFailure("Unsupported multiline disposable Auth config")
        with tempfile.TemporaryDirectory(prefix="passport-auth-") as folder:
            path = Path(folder) / "auth.env"
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            with os.fdopen(fd, "w") as handle:
                handle.write("".join(key + "=" + value + "\n" for key, value in safe.items()))
            # Immutable, already-installed image ID. No remote image pull.
            launched = True  # cleanup also covers interrupted docker run.
            db.call(["docker", "run", "-d", "--pull", "never", "--name", SERVICE,
                     "--network", network, "-p", "127.0.0.1::9999",
                     "--env-file", str(path), auth["Image"]])
        port_line = db.call(["docker", "port", SERVICE, "9999/tcp"]).stdout.strip()
        if not re.fullmatch(r"127\.0\.0\.1:[0-9]+", port_line):
            raise TestFailure("Temporary Auth API must be published only on loopback")
        base = "http://" + port_line
        opener = build_opener(ProxyHandler({}))
        ready = False
        for _ in range(25):
            try:
                status, _ = request_json(opener, base, "/health")
                if status == 200:
                    ready = True
                    break
            except (URLError, http.client.HTTPException, OSError, RuntimeError):
                pass
            time.sleep(0.3)
        if not ready:
            state = db.inspect(SERVICE).get("State", {}).get("Status", "unknown")
            print("DIAGNOSTIC: disposable Auth container state:", state)
            result = db.call(["docker", "logs", "--tail", "80", SERVICE], check=False)
            logs = result.stdout + result.stderr
            for label, pattern in (
                ("database_permission", r"permission denied|insufficient privilege"),
                ("missing_database_object", r"does not exist|undefined"),
                ("migration_failure", r"migration.*(fail|error)|failed.*migrat"),
                ("configuration_failure", r"config.*(invalid|error)|required.*(key|secret)"),
            ):
                print("DIAGNOSTIC:", label, bool(re.search(pattern, logs, re.I)))
            print("NOT TESTED: Auth requests; raw logs withheld")
            raise TestFailure("Disposable Auth service did not become healthy")
        print("PASS: separate Auth API healthy on loopback; fresh signing key", flush=True)
        if fresh_auth:
            compare_migration_histories(db, test_database=CLONE)
            print("PASS: freshly migrated Auth version history matches existing local Auth")
        exercise_auth(opener, base, secret, db)
    finally:
        if launched:
            result = db.call(["docker", "rm", "-f", SERVICE], check=False)
            if result.returncode == 0:
                print("PASS: temporary Auth container removed")
            else:
                print("CLEANUP CHECK: temporary Auth removal did not confirm success")
        if created:
            db.psql('DROP DATABASE "' + CLONE + '" WITH (FORCE);')
            print("PASS: disposable Auth database removed")


if __name__ == "__main__":
    try:
        main()
    except TestFailure as exc:
        raise SystemExit("STOP: " + str(exc)) from None
    except Exception:
        # Neither response bodies nor subprocess/URI exceptions are safe to echo.
        raise SystemExit("STOP: real-Auth smoke test incomplete; raw error details withheld. "
                         "Report the last PASS/DIAGNOSTIC and cleanup lines.") from None
