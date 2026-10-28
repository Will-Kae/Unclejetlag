#!/usr/bin/env python3
"""Isolated authenticated production-browser acceptance. Never targets production.

Reuses the verified fresh Auth lifecycle, adds a disposable passport clone and
PostgREST, then builds a tracked-file copy without .env files. Serves the copy
over local HTTPS. Everything is removed on success or failure.
"""
import http.client
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import signal
import socket
import ssl
import subprocess
import tempfile
import time
import uuid
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import ProxyHandler, build_opener, HTTPSHandler

ROOT = Path(__file__).resolve().parents[1]
PASSPORT = "passport_browser_" + uuid.uuid4().hex[:10]
REST = "passport-browser-rest-" + uuid.uuid4().hex[:10]


class Failure(RuntimeError):
    pass


def load_auth():
    path = Path(__file__).with_name("passport-phase-4d2-step62-auth-isolated-local.py")
    spec = importlib.util.spec_from_file_location("passport_auth_browser_lifecycle", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def safe_log(path):
    return os.fdopen(os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), "w")


def stop_process(process):
    if process is not None and process.poll() is None:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=10)


def run_child(args, cwd, env, log, payload=None, timeout=240):
    with safe_log(log) as output:
        process = subprocess.Popen(args, cwd=cwd, env=env, stdin=subprocess.PIPE,
                                   stdout=output, stderr=subprocess.STDOUT,
                                   text=True, start_new_session=True)
        try:
            process.communicate(payload, timeout=timeout)
        except subprocess.TimeoutExpired:
            stop_process(process)
            raise Failure("Local child process timed out; private log withheld") from None
    return process.returncode


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def copy_tracked_project(target):
    result = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, check=True,
                            capture_output=True, timeout=20)
    for name in result.stdout.decode().split("\0"):
        if not name:
            continue
        relative = Path(name)
        if relative.is_absolute() or ".." in relative.parts:
            raise Failure("Unsafe tracked project path")
        if any(part.startswith(".env") or part in (".git", "node_modules", ".next")
               for part in relative.parts):
            continue
        source = ROOT / relative
        if source.is_symlink():
            raise Failure("Tracked symlink refused in isolated build")
        if not source.is_file():
            raise Failure("Tracked project file missing from checkout")
        dest = target / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
    # Assets already produced by the user's successful prebuild. Do not fetch.
    public = ROOT / "public"
    if any(path.is_symlink() for path in public.rglob("*")):
        raise Failure("Public asset symlink refused")
    shutil.copytree(public, target / "public", dirs_exist_ok=True)


def setup_profiles(db, users):
    if db.psql("SELECT current_database();", database=PASSPORT) != PASSPORT:
        raise Failure("Wrong passport fixture database")
    baseline = db.psql("""
SELECT json_build_object(
 'rls', (SELECT relrowsecurity FROM pg_class WHERE oid='public.passport_research_profiles'::regclass),
 'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='passport_research_profiles'),
 'expected', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public'
   AND tablename='passport_research_profiles' AND policyname='passport_active_profile_self_read'
   AND cmd='SELECT' AND roles=ARRAY['authenticated']::name[]),
 'bypass', (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname='authenticated'));
""", database=PASSPORT)
    facts = json.loads(baseline)
    if not (facts.get("rls") is True and facts.get("policies") == 1
            and facts.get("expected") is True and facts.get("bypass") is False):
        raise Failure("Existing profile policy/RLS baseline differs; policy not replaced")
    ids = [str(uuid.UUID(user["id"])) for user in users]
    statement = "BEGIN;"
    if db.psql("SELECT to_regclass('auth.users') IS NOT NULL;", database=PASSPORT) == "t":
        statement += "INSERT INTO auth.users(id) VALUES " + ",".join("('" + x + "')" for x in ids) + ";"
    statement += (
        "INSERT INTO public.passport_research_profiles(user_id,role,active) VALUES "
        "('" + ids[0] + "','researcher',true),('" + ids[1] + "','researcher',false);"
        "GRANT USAGE ON SCHEMA public TO authenticated;"
        "GRANT SELECT(user_id,role,active) ON public.passport_research_profiles TO authenticated;"
        "COMMIT;"
    )
    db.psql(statement, database=PASSPORT)
    signature = "public.passport_review_submission_staging(uuid,integer,public.passport_review_decision,text,uuid)"
    denied = db.psql(
        "SELECT NOT EXISTS(SELECT 1 FROM unnest(ARRAY['anon','authenticated','service_role']) r "
        "WHERE has_function_privilege(r,'" + signature + "','EXECUTE'));", database=PASSPORT)
    if denied != "t":
        raise Failure("Review RPC execution must remain denied")
    print("PASS: isolated active/inactive profile fixtures; existing RLS preserved; RPC execution denied")


def report_build_failure(project, logfile):
    """Bounded compiler summaries only; never emit source snippets or full logs."""
    raw = logfile.read_text(errors="replace")
    text = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", raw)
    modules = sorted(set(re.findall(
        r"(?:Cannot find module|Can't resolve|Cannot resolve) ['\"]([@A-Za-z0-9_./-]{1,160})['\"]",
        text)))
    print("BUILD DIAGNOSTIC: missing module identifiers:", ",".join(modules[:8]) or "(none)")
    print("BUILD DIAGNOSTIC: TypeScript codes:",
          ",".join(sorted(set(re.findall(r"\bTS[0-9]{4,5}\b", text)))) or "(none)")
    markers = ("Error:", "Type error:", "Module not found:", "Build error occurred",
               "Failed to compile", "Turbopack build failed", "Error evaluating Node.js code")
    summaries = []
    for line in text.splitlines():
        line = line.strip()
        if not any(line.startswith(marker) for marker in markers):
            continue
        for path, replacement in ((str(project), "<isolated-app>"),
                                  (str(logfile.parent), "<temporary>"),
                                  (str(ROOT), "<repository>"),
                                  (str(Path.home()), "<home>")):
            line = line.replace(path, replacement)
        line = re.sub(r"https?://[^\s'\"]+", "<url>", line)
        line = re.sub(r"(?i)Bearer\s+\S+", "Bearer <redacted>", line)
        line = re.sub(r"(?i)(password|secret|token|apikey)\s*[:=]\s*\S+",
                      r"\1=<redacted>", line)
        line = re.sub(r"\beyJ[A-Za-z0-9_.-]+", "<redacted-jwt>", line)
        line = re.sub(r"\b[A-Za-z0-9_+/=-]{48,}\b", "<redacted-long-value>", line)
        if line not in summaries:
            summaries.append(line[:350])
    for line in summaries[:6]:
        print("BUILD SUMMARY:", line)
    if not summaries:
        print("BUILD SUMMARY: no recognized compiler-summary line; full log withheld")
    print("BUILD DIAGNOSTIC: existing .next and environment files were not modified")


def exercise_browser(opener_unused, auth_base, secret, db):
    auth = AUTH_MODULE
    created = launched = False
    app = None
    log_handle = None
    try:
        print("STAGE: create real Auth identities and disposable passport clone", flush=True)
        opener = build_opener(ProxyHandler({}))
        users = []
        admin = auth.signed_admin(secret)
        for _ in range(3):
            user = {"email": "browser-" + uuid.uuid4().hex + "@example.invalid",
                    "password": secrets.token_urlsafe(32)}
            status, result = auth.request_json(opener, auth_base, "/admin/users", "POST",
                    {**user, "email_confirm": True}, admin)
            if status not in (200, 201) or not isinstance(result, dict):
                raise Failure("Disposable Auth identity creation failed; response withheld")
            user["id"] = str(uuid.UUID(result["id"]))
            users.append(user)
        db.psql('CREATE DATABASE "' + PASSPORT + '" TEMPLATE "passport_concurrency_test";')
        created = True
        setup_profiles(db, users)
        rest = db.inspect("supabase_rest_unclejetlag-passport-staging")
        database = db.inspect(db.DB_CONTAINER)
        networks = set(rest["NetworkSettings"]["Networks"]) & set(database["NetworkSettings"]["Networks"])
        if len(networks) != 1:
            raise Failure("Expected one shared local REST/database network")
        network = next(iter(networks))
        old_env = dict(x.split("=",1) for x in rest["Config"].get("Env",[]) if "=" in x)
        uri, host = db.replace_database(old_env.get("PGRST_DB_URI",""), PASSPORT)
        allowed = set(database["NetworkSettings"]["Networks"][network].get("Aliases") or [])
        allowed.add(db.DB_CONTAINER)
        if host not in allowed:
            raise Failure("REST URI does not identify expected local DB")
        with tempfile.TemporaryDirectory(prefix=".passport-browser-", dir=ROOT) as folder:
            folder = Path(folder)
            rest_env = {
                "PGRST_DB_URI": uri, "PGRST_DB_SCHEMAS": "public",
                "PGRST_DB_EXTRA_SEARCH_PATH": "public", "PGRST_DB_ANON_ROLE": "anon",
                "PGRST_DB_CONFIG": "false",
                "PGRST_JWT_SECRET": secret, "PGRST_JWT_SECRET_IS_BASE64": "false",
                "PGRST_JWT_ROLE_CLAIM_KEY": ".role", "PGRST_JWT_AUD": "authenticated",
                "PGRST_SERVER_HOST": "0.0.0.0", "PGRST_SERVER_PORT": "3000",
            }
            if any("\n" in value or "\r" in value for value in rest_env.values()):
                raise Failure("Unsupported multiline REST config")
            env_file = folder / "rest.env"
            with safe_log(env_file) as output:
                output.write("".join(k + "=" + v + "\n" for k,v in rest_env.items()))
            launched = True
            db.call(["docker","run","-d","--pull","never","--name",REST,
                     "--network",network,"-p","127.0.0.1::3000","--env-file",str(env_file),rest["Image"]])
            port_line = db.call(["docker","port",REST,"3000/tcp"]).stdout.strip()
            if not re.fullmatch(r"127\.0\.0\.1:[0-9]+",port_line):
                raise Failure("Temporary REST binding is not loopback-only")
            rest_port = int(port_line.rsplit(":",1)[1])
            ready = False
            for _ in range(25):
                try:
                    status,_ = auth.request_json(opener,"http://"+port_line,"/")
                    if status < 500:
                        ready=True
                        break
                except (OSError, URLError, http.client.HTTPException, RuntimeError):
                    pass
                time.sleep(0.3)
            if not ready:
                raise Failure("Disposable profile API did not become ready")

            print("STAGE: prepare isolated project and local TLS certificate", flush=True)
            project = folder / "app"
            project.mkdir()
            copy_tracked_project(project)
            cert, key = folder / "cert.pem", folder / "key.pem"
            config = folder / "tls.cnf"
            config.write_text("[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3\n"
                "[dn]\nCN=127.0.0.1\n[v3]\nsubjectAltName=IP:127.0.0.1,DNS:localhost\n"
                "basicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n"
                "extendedKeyUsage=serverAuth\n")
            db.call(["openssl","req","-x509","-newkey","rsa:2048","-nodes","-days","1",
                     "-config",str(config),"-keyout",str(key),"-out",str(cert)])
            key.chmod(0o600)
            app_port = free_port()
            base = "https://127.0.0.1:" + str(app_port)
            node = shutil.which("node")
            next_bin = ROOT / "node_modules/next/dist/bin/next"
            if not node or not next_bin.is_file():
                raise Failure("Installed Node/Next dependencies are required")
            clean_env = {k: os.environ[k] for k in ("PATH","HOME","TMPDIR") if k in os.environ}
            clean_env.update({
                "NODE_ENV":"production", "NEXT_TELEMETRY_DISABLED":"1",
                "NODE_EXTRA_CA_CERTS":str(cert),
                "NEXT_PUBLIC_SUPABASE_URL":base,
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY":"local-test-public-key",
            })
            print("STAGE: build isolated production app (existing .next and .env files untouched)", flush=True)
            if run_child([node,str(next_bin),"build"],project,clean_env,folder/"build.log") != 0:
                report_build_failure(project, folder/"build.log")
                raise Failure("Isolated Next build failed; see sanitized BUILD diagnostics")
            server_cfg = {"appDir":str(project),"port":app_port,
                          "authPort":urlsplit(auth_base).port,"restPort":rest_port,
                          "cert":str(cert),"key":str(key)}
            log_handle = safe_log(folder/"server.log")
            app = subprocess.Popen([node,str(ROOT/"scripts/passport-auth-browser-server.mjs")],
                cwd=project,env=clean_env,stdin=subprocess.PIPE,stdout=log_handle,
                stderr=subprocess.STDOUT,text=True,start_new_session=True)
            app.stdin.write(json.dumps(server_cfg))
            app.stdin.close()
            tls_opener = build_opener(ProxyHandler({}),
                                     HTTPSHandler(context=ssl.create_default_context(cafile=str(cert))))
            ready = False
            for _ in range(40):
                if app.poll() is not None:
                    break
                try:
                    with tls_opener.open(base+"/robots.txt",timeout=2) as response:
                        if response.status==200:
                            ready=True
                            break
                except (OSError, URLError, HTTPError):
                    pass
                time.sleep(0.3)
            if not ready:
                raise Failure("Isolated HTTPS application did not become ready; private server log withheld")
            print("PASS: isolated HTTPS production app ready; real Auth and profile APIs local only", flush=True)
            browser_cfg = {"base":base,"active":users[0],"inactive":users[1],"absent":users[2]}
            print("STAGE: authenticated browser acceptance", flush=True)
            result = run_child([node,str(ROOT/"scripts/passport-auth-browser-checks.mjs")],
                project,clean_env,folder/"browser.log",json.dumps(browser_cfg),timeout=240)
            for line in (folder/"browser.log").read_text().splitlines():
                if line.startswith(("PASS:","FAIL:","SCOPE:")):
                    print(line,flush=True)
            if result != 0:
                raise Failure("Authenticated browser acceptance incomplete; see safe stage above")
            stop_process(app)
            app = None
            log_handle.close()
            log_handle = None
        print("PASS: temporary build, TLS material and private logs removed")
    finally:
        stop_process(app)
        if log_handle is not None:
            log_handle.close()
        if launched:
            result = db.call(["docker","rm","-f",REST],check=False)
            print("PASS: temporary profile API removed" if result.returncode==0
                  else "CLEANUP CHECK: temporary profile API removal unconfirmed")
        if created:
            db.psql('DROP DATABASE "'+PASSPORT+'" WITH (FORCE);')
            print("PASS: disposable passport profile database removed")


if __name__ == "__main__":
    if os.getenv("ALLOW_LOCAL_AUTHENTICATED_BROWSER") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_AUTHENTICATED_BROWSER=yes")
    try:
        AUTH_MODULE = load_auth()
        os.environ["ALLOW_LOCAL_DISPOSABLE_AUTH"] = "yes"
        os.environ["ALLOW_LOCAL_FRESH_AUTH_DB"] = "yes"
        AUTH_MODULE.main(exercise=exercise_browser)
    except (Failure, RuntimeError) as exc:
        if isinstance(exc, Failure) or ("AUTH_MODULE" in globals() and isinstance(exc, AUTH_MODULE.TestFailure)):
            raise SystemExit("STOP: "+str(exc)) from None
        raise SystemExit("STOP: isolated browser setup failed; raw details withheld") from None
    except Exception:
        raise SystemExit("STOP: isolated browser setup failed; raw details withheld") from None
