#!/usr/bin/env python3
"""Step 62 local-only regression runner for passport governance.

Uses existing isolated-clone tests. No production access, deployments,
approval activation, or PR merge. Reports remaining coverage gaps.
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS = (
    "scripts/passport-phase-4d2-hardening-validate-local.py",
    "scripts/passport-phase-4d2-race-local.py",
)

def main():
    if os.getenv("ALLOW_LOCAL_DISPOSABLE_DB") != "yes":
        raise SystemExit("Set ALLOW_LOCAL_DISPOSABLE_DB=yes to run disposable local tests")
    for relative in TESTS:
        target = ROOT / relative
        if not target.is_file():
            raise SystemExit(f"FAIL: missing test: {relative}")
        print(f"RUN: {relative}", flush=True)
        result = subprocess.run([sys.executable, str(target)], cwd=ROOT,
                                env=os.environ.copy(), check=False)
        if result.returncode:
            raise SystemExit(f"FAIL: {relative} exited {result.returncode}")
        print(f"PASS: {relative}", flush=True)
    print("PASS: Existing Step 60 and 61 local regression suites completed")
    print("NOT VERIFIED: JWT/RLS integration, audit rollback, source provenance,")
    print("approval activation, and alternative transaction isolation levels")
    print("Step 62 remains OPEN until missing security cases are implemented.")

if __name__ == "__main__":
    main()
