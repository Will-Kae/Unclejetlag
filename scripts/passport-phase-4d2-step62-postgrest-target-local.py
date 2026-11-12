#!/usr/bin/env python3
"""Step 62: local PostgREST database-target preflight, read-only.

Never prints connection strings, passwords, API keys or tokens.
Does not make API requests, change databases or access production.
"""
import json
import os
import subprocess
from urllib.parse import urlsplit, parse_qs

REST = "supabase_rest_unclejetlag-passport-staging"
DB_CONTAINER = "supabase_db_unclejetlag-passport-staging"
EXPECTED = "passport_concurrency_test"

def docker_inspect(name):
    p = subprocess.run(["docker", "inspect", name], capture_output=True,
                       text=True, timeout=15)
    if p.returncode:
        raise RuntimeError("Expected local container unavailable: " + name)
    data = json.loads(p.stdout)
    if len(data) != 1 or data[0].get("Name") != "/" + name:
        raise RuntimeError("Unexpected Docker container identity")
    return data[0]

def db_name_from_uri(uri):
    # Do not print or persist the raw URI.
    if uri.startswith("postgres://") or uri.startswith("postgresql://"):
        return urlsplit(uri).path.lstrip("/").split("?")[0] or "(default)"
    # libpq key=value strings: use only the explicit dbname token.
    import shlex
    try:
        parts = shlex.split(uri)
    except ValueError:
        return "(unparseable)"
    for part in parts:
        if part.startswith("dbname="):
            return part[len("dbname="):]
    return "(not explicit)"

def main():
    if os.getenv("ALLOW_LOCAL_READONLY_DB_INSPECTION") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_READONLY_DB_INSPECTION=yes")
    rest = docker_inspect(REST)
    docker_inspect(DB_CONTAINER)
    print("PASS: expected Uncle Jetlag local REST and database containers found")
    env = {}
    for entry in rest.get("Config", {}).get("Env", []):
        key, sep, value = entry.partition("=")
        if sep and key in ("PGRST_DB_URI", "PGRST_DB_SCHEMAS", "PGRST_DB_ANON_ROLE"):
            env[key] = value
    uri = env.get("PGRST_DB_URI")
    if not uri:
        print("INCONCLUSIVE: PGRST_DB_URI not exposed in container environment")
        print("STOP: cannot establish target database; no API authorization test permitted")
        return 2
    target = db_name_from_uri(uri)
    print("PostgREST database name:", target)
    print("Expected isolated test database:", EXPECTED)
    print("PostgREST schema configuration:", env.get("PGRST_DB_SCHEMAS", "(not exposed)"))
    print("PostgREST anonymous role:", env.get("PGRST_DB_ANON_ROLE", "(not exposed)"))
    if target != EXPECTED:
        print("STOP: PostgREST does NOT explicitly target the disposable test database.")
        print("No HTTP authorization testing against this service until an isolated")
        print("test-only PostgREST instance is configured for a disposable clone.")
        return 2
    print("PASS: database name matches; still verify host and connection identity")
    print("PREFLIGHT ONLY: no signed-JWT, HTTP authorization or RLS behavior tested")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
