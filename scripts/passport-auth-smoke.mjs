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
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    console.log(`FAIL ${role}/${path}: request failed`);
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
