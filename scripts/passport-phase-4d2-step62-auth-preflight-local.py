#!/usr/bin/env python3
"""Read-only prerequisites for a separate local Auth/application integration test.

Inspects only the explicitly named Uncle Jetlag Docker services and passport
test database. Never starts/stops services, changes grants, creates users,
reads credentials into output, or contacts an Auth endpoint.
"""
import json
import os
import shutil
import subprocess
from urllib.parse import urlsplit

AUTH = "supabase_auth_unclejetlag-passport-staging"
DB = "supabase_db_unclejetlag-passport-staging"
DATABASE = "passport_concurrency_test"


def run(args, input_text=None):
    try:
        p = subprocess.run(args, input=input_text, text=True, capture_output=True, timeout=25)
    except (OSError, subprocess.TimeoutExpired):
        raise RuntimeError("Local prerequisite command unavailable or timed out") from None
    if p.returncode:
        # Docker inspect/psql stderr may expose connection details. Do not echo.
        raise RuntimeError("Local prerequisite command failed; raw output withheld") from None
    return p.stdout


def inspect(name):
    rows = json.loads(run(["docker", "inspect", name]))
    if len(rows) != 1 or rows[0].get("Name") != "/" + name:
        raise RuntimeError("Unexpected local container identity")
    return rows[0]


def sql(statement):
    # This entire invocation is read-only, even if a future query is added.
    return run(["docker", "exec", "-i", DB, "psql", "-X", "-qAt",
                "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", DATABASE],
               "BEGIN READ ONLY;\n" + statement + "\nROLLBACK;\n").strip()


def main():
    if os.getenv("ALLOW_LOCAL_READONLY_DB_INSPECTION") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_READONLY_DB_INSPECTION=yes")
    for tool in ("docker", "node", "npm", "openssl"):
        print("PREREQUISITE:", tool, "available:", shutil.which(tool) is not None)
    auth = inspect(AUTH)
    db = inspect(DB)
    if auth.get("State", {}).get("Running") is not True:
        raise RuntimeError("Expected local Uncle Jetlag Auth service is not running")
    if db.get("State", {}).get("Running") is not True:
        raise RuntimeError("Expected local Uncle Jetlag DB service is not running")
    common = set(auth["NetworkSettings"]["Networks"]) & set(db["NetworkSettings"]["Networks"])
    if len(common) != 1:
        raise RuntimeError("Expected exactly one shared Uncle Jetlag Docker network")
    network = next(iter(common))
    aliases = set(db["NetworkSettings"]["Networks"][network].get("Aliases") or [])
    aliases.add(DB)
    env = dict(v.split("=", 1) for v in auth["Config"].get("Env", []) if "=" in v)
    uri = env.get("GOTRUE_DB_DATABASE_URL") or env.get("DATABASE_URL")
    if not uri:
        raise RuntimeError("Auth database URI not found under supported environment keys")
    try:
        parsed = urlsplit(uri)
        local = parsed.scheme in ("postgres", "postgresql") and parsed.hostname in aliases
        source_postgres = parsed.path == "/postgres"
    except ValueError:
        raise RuntimeError("Unsupported local Auth database URI format") from None
    if not local or not source_postgres:
        raise RuntimeError("Auth DB target is not the expected local postgres service; STOP")
    print("PASS: existing Auth DB URI identifies expected local postgres service")
    print("PLAN: existing Auth target stays unchanged; future tests require separate clone and Auth instance")
    # Version tag only; no arbitrary Docker config, URLs, or environment values.
    image = auth["Config"].get("Image", "")
    print("PREREQUISITE: Auth image tag:", image.rsplit(":", 1)[-1]
          if ":" in image and "/" not in image.rsplit(":", 1)[-1] else "(not tagged)")
    for key in ("GOTRUE_JWT_SECRET", "GOTRUE_JWT_KEYS", "GOTRUE_DB_NAMESPACE",
                "GOTRUE_DB_MIGRATIONS_PATH", "GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED",
                "GOTRUE_EXTERNAL_EMAIL_ENABLED", "GOTRUE_MAILER_AUTOCONFIRM"):
        print("CONFIG PRESENT:", key, bool(env.get(key)))
    facts = json.loads(sql("""
SELECT json_build_object(
 'database_matches', current_database()='passport_concurrency_test',
 'auth_schema', EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='auth'),
 'auth_users', to_regclass('auth.users') IS NOT NULL,
 'auth_sessions', to_regclass('auth.sessions') IS NOT NULL,
 'auth_refresh_tokens', to_regclass('auth.refresh_tokens') IS NOT NULL,
 'auth_schema_migrations', to_regclass('auth.schema_migrations') IS NOT NULL,
 'auth_uid_function', to_regprocedure('auth.uid()') IS NOT NULL,
 'profiles', to_regclass('public.passport_research_profiles') IS NOT NULL,
 'auth_owner_role', EXISTS(SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin'));
"""))
    if facts.pop("database_matches", None) is not True:
        raise RuntimeError("Wrong local inspection database")
    for key, value in facts.items():
        print("DATABASE PREREQUISITE:", key, value)
    # Report only catalog booleans; never function bodies, users, password hashes,
    # tokens, role settings or connection strings.
    uid = sql("""
SELECT json_build_object(
 'uses_request_claims', coalesce(pg_get_functiondef(to_regprocedure('auth.uid()'))
    LIKE '%request.jwt.claims%', false),
 'uses_legacy_sub_setting', coalesce(pg_get_functiondef(to_regprocedure('auth.uid()'))
    LIKE '%request.jwt.claim.sub%', false));
""")
    print("UID IMPLEMENTATION SIGNALS:", uid)
    required = ("auth_schema", "auth_users", "auth_sessions", "auth_refresh_tokens",
                "auth_schema_migrations", "auth_uid_function", "profiles", "auth_owner_role")
    if all(facts.get(key) is True for key in required):
        print("PREREQUISITES: core Auth objects present; migration/version compatibility not yet verified")
    else:
        print("BLOCKED: passport clone lacks core Auth prerequisites; do not launch Auth against it")
    print("NOT TESTED: real login, Auth-issued tokens, application cookies, logout or session revocation")
    print("READ ONLY: no database/service/credential changes; no production access")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, KeyError, TypeError) as exc:
        # Only our fixed RuntimeError messages are safe. Parser errors can contain
        # input snippets, so suppress their free-form text.
        message = str(exc) if type(exc) is RuntimeError else "Unexpected prerequisite data; raw details withheld"
        raise SystemExit("STOP: " + message) from None
