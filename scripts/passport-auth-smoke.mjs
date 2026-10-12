#!/usr/bin/env node
/**
 * Read-only staging smoke tests. Does not create users or modify data.
 * Example:
 * PASSPORT_STAGING_URL=https://staging.example.com \
 * PASSPORT_RESEARCHER_TOKEN=... PASSPORT_REVIEWER_TOKEN=... PASSPORT_ADMIN_TOKEN=... \
 * node scripts/passport-auth-smoke.mjs
 *
 * Supply secrets through a protected CI environment, never command history.
 */
const base = process.env.PASSPORT_STAGING_URL;
if (!base) throw new Error("PASSPORT_STAGING_URL is required");
const url = new URL(base);
if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
  throw new Error("Staging URL must be an HTTPS origin");
}
const tokenVars = {
  researcher: "PASSPORT_RESEARCHER_TOKEN",
  reviewer: "PASSPORT_REVIEWER_TOKEN",
  admin: "PASSPORT_ADMIN_TOKEN",
};
const tokens = Object.fromEntries(Object.entries(tokenVars).map(([role, key]) => [role, process.env[key]]));
if (Object.values(tokens).some((token) => !token || token.length > 8192 || /\s/.test(token))) {
  throw new Error("All three valid test access tokens are required");
}
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!bypass || /\s/.test(bypass)) throw new Error("Valid Vercel automation bypass secret is required");
const paths = ["me", "researcher", "reviewer", "admin"];
const expectations = {
  researcher: [200, 200, 403, 403],
  reviewer: [200, 403, 200, 403],
  admin: [200, 200, 200, 200],
};
let failures = 0;
async function check(role, path, token, expected) {
  try {
    const response = await fetch(new URL(`/api/passport-verification/${path}`, url), {
      headers: { "x-vercel-protection-bypass": bypass, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    const cache = response.headers.get("cache-control") || "";
    const pass = response.status === expected && cache.includes("no-store");
    console.log(`${pass ? "PASS" : "FAIL"} ${role}/${path}: HTTP ${response.status}, expected ${expected}; no-store=${cache.includes("no-store")}`);
    if (!pass) failures++;
    if (path === "me" && response.ok && token) {
      const body = await response.json();
      if (body.role !== role) {
        console.log(`FAIL ${role}/me: role mismatch`);
        failures++;
      }
    }
  } catch {
    console.log(`FAIL ${role}/${path}: request failed (check Vercel protection, network, or timeout)`);
    failures++;
  }
}
for (const path of paths) await check("anonymous", path, null, 401);
for (const [role, token] of Object.entries(tokens)) {
  for (let i = 0; i < paths.length; i++) {
    await check(role, paths[i], token, expectations[role][i]);
  }
}
if (failures) {
  console.error(`Staging authorization smoke tests failed: ${failures}`);
  process.exitCode = 1;
} else {
  console.log("Staging authorization smoke tests passed (read-only).");
}

/**
 * Optional live expiry check. Uses the existing researcher token, never logs it,
 * and waits for the JWT exp claim plus a small clock-skew margin.
 * Enable with PASSPORT_EXPIRY_TEST=1 in a local interactive test run.
 */
if (process.env.PASSPORT_EXPIRY_TEST === "1") {
  const token = tokens.researcher;
  const jwtParts = token.split(".");
  let expiry;
  try {
    if (jwtParts.length !== 3) throw new Error("Invalid JWT");
    const claims = JSON.parse(Buffer.from(jwtParts[1], "base64url").toString("utf8"));
    if (!Number.isSafeInteger(claims.exp)) throw new Error("Missing expiry");
    expiry = claims.exp * 1000;
  } catch {
    console.error("FAIL expiry: researcher token does not have a valid JWT expiry");
    process.exitCode = 1;
  }
  if (expiry) {
    const endpoint = new URL("/api/passport-verification/me", url);
    const headers = { Authorization: `Bearer ${token}`, "x-vercel-protection-bypass": bypass };
    const request = () => fetch(endpoint, {
      headers, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    try {
      const before = await request();
      if (before.status !== 200) throw new Error(`pre-expiry HTTP ${before.status} (expected 200)`);
      const delay = Math.max(0, expiry + 10000 - Date.now());
      if (delay > 90 * 60 * 1000) throw new Error("token expiry is over 90 minutes away");
      console.log(`PASS expiry preflight: HTTP 200. Waiting approximately ${Math.ceil(delay / 60000)} minutes for token expiry; keep Terminal open.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      const after = await request();
      const noStore = (after.headers.get("cache-control") || "").includes("no-store");
      if (after.status !== 401 || !noStore) {
        throw new Error(`post-expiry HTTP ${after.status} (expected 401); no-store=${noStore}`);
      }
      console.log("PASS expired-token API rejection: HTTP 401; no-store=true");
    } catch (error) {
      console.error(`FAIL expiry: ${error instanceof Error ? error.message : "request failed"}`);
      process.exitCode = 1;
    }
  }
}
