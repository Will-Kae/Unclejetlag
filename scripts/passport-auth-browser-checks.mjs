// No traces, screenshots, storageState files, tokens or credentials are emitted.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const cfg = JSON.parse(fs.readFileSync(0, "utf8"));
const origin = new URL(cfg.base);
if (origin.protocol !== "https:" || origin.hostname !== "127.0.0.1")
  throw Error("Browser test requires the isolated loopback HTTPS server");
const ROOT = "/passport-index/research-admin";
const LOGIN = ROOT + "/login";
const COOKIE = "uj_passport_research_session";
let stage = "launch Chromium";
let browser;
function check(ok, message) { if (!ok) throw Error(message); }
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.route("**/*", route => {
    try {
      return new URL(route.request().url()).origin === cfg.base ? route.continue() : route.abort();
    } catch { return route.abort(); }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const cookie = async () => (await context.cookies(cfg.base + ROOT)).find(x => x.name === COOKIE);
  const atLogin = () => page.waitForURL(url => url.pathname === LOGIN);
  async function submit(user, password = user.password) {
    await page.goto(cfg.base + LOGIN);
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  stage = "anonymous protected-page denial";
  await page.goto(cfg.base + ROOT + "/workspace");
  await atLogin();
  check(!(await cookie()), "Unexpected anonymous session cookie");
  console.log("PASS: anonymous protected workspace redirects to login");

  stage = "forged-cookie denial";
  await context.addCookies([{ name: COOKIE, value: "forged-test-cookie",
    domain: "127.0.0.1", path: ROOT, secure: true, httpOnly: true, sameSite: "Strict" }]);
  await page.goto(cfg.base + ROOT + "/workspace");
  await atLogin();
  await context.clearCookies();
  console.log("PASS: forged cookie cannot open protected workspace");

  for (const [label, user, password] of [
    ["wrong password", cfg.active, "known-invalid-password"],
    ["inactive profile", cfg.inactive, cfg.inactive.password],
    ["missing profile", cfg.absent, cfg.absent.password],
  ]) {
    stage = label + " login rejection";
    await submit(user, password);
    await page.getByRole("alert").waitFor({ state: "visible" });
    check(new URL(page.url()).pathname === LOGIN, "Rejected identity escaped login page");
    check(!(await cookie()), "Rejected identity received a session cookie");
    console.log("PASS: application rejects " + label + " without setting a session cookie");
  }

  stage = "active research login";
  await submit(cfg.active);
  await page.waitForURL(url => url.pathname === ROOT);
  await page.getByRole("heading", { name: "Passport research administration", exact: true }).waitFor();
  const session = await cookie();
  check(session && session.httpOnly && session.secure && session.sameSite === "Strict" &&
    session.path === ROOT, "Session-cookie security attributes differ");
  check(session.expires > Date.now()/1000 && session.expires <= Date.now()/1000 + 3610,
    "Session-cookie expiry differs");
  check(!(await context.cookies(cfg.base + "/about")).some(x => x.name === COOKIE),
    "Research cookie is sent outside its protected path");
  console.log("PASS: real application login sets HttpOnly Secure Strict path-limited session cookie");

  stage = "protected workspace and evidence case";
  await page.goto(cfg.base + ROOT + "/workspace");
  check(new URL(page.url()).pathname === ROOT + "/workspace", "Workspace redirected after login");
  await page.locator("main h1").waitFor();
  check(new URL(page.url()).pathname === ROOT + "/workspace" &&
    (await page.locator("main h1").innerText()) !== "Passport research sign in", "Workspace identity check failed");
  await page.goto(cfg.base + ROOT + "/workspace/cases/pair-gh-tz");
  check(new URL(page.url()).pathname.endsWith("/cases/pair-gh-tz"), "Case redirected after login");
  await page.locator("main h1").waitFor();
  check(new URL(page.url()).pathname.endsWith("/cases/pair-gh-tz") &&
    (await page.locator("main h1").innerText()) !== "Passport research sign in", "Evidence case identity check failed");
  console.log("PASS: signed-in browser opens workspace and evidence case");

  const authHeaders = { apikey: "local-test-public-key", Authorization: "Bearer " + session.value };
  stage = "logout CSRF denial";
  for (const headers of [{ Origin: "https://other.invalid" }, {}]) {
    const response = await context.request.post(cfg.base + ROOT + "/logout", { headers, maxRedirects: 0 });
    check(response.status() === 403, "Logout accepted missing or cross-site origin");
  }
  check((await cookie())?.value === session.value, "Rejected logout changed session cookie");
  check((await context.request.get(cfg.base + "/auth/v1/user", { headers: authHeaders })).status() === 200,
    "Rejected logout revoked the Auth session");
  console.log("PASS: origin-less and cross-origin logout requests are refused without revoking session");

  stage = "open administration page for sign-out";
  await page.goto(cfg.base + ROOT);
  const essential = page.getByRole("button", { name: /essential only/i });
  if (await essential.isVisible()) await essential.click();
  stage = "submit browser sign-out";
  const logoutResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname === ROOT + "/logout" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  const logout = await logoutResponse;
  console.log("SCOPE: browser logout HTTP status " + logout.status());
  if (logout.status() === 403) {
    const headers = await logout.allHeaders();
    for (const key of ["x-local-origin-present", "x-local-origin-null", "x-local-origin-matches",
      "x-local-request-https", "x-local-host-matches"]) {
      console.log("SCOPE: " + key + " " + (["true", "false"].includes(headers[key]) ? headers[key] : "unavailable"));
    }
  }
  check(logout.status() === 303, "Browser logout did not confirm revocation");
  stage = "sign-out redirect to login";
  await atLogin();
  stage = "sign-out cookie removal";
  check(!(await cookie()), "Logout left the research cookie present");
  stage = "Auth rejects access token after browser sign-out";
  const oldToken = await context.request.get(cfg.base + "/auth/v1/user", { headers: authHeaders });
  console.log("SCOPE: post-logout Auth user HTTP status " + oldToken.status());
  check([401, 403].includes(oldToken.status()), "Old token still accepted by isolated Auth after app logout");
  console.log("PASS: application sign-out clears cookie and isolated Auth refuses the old access token");

  stage = "post-logout protected-page denial";
  for (const path of [ROOT, ROOT + "/workspace", ROOT + "/workspace/cases/pair-gh-tz"]) {
    await page.goto(cfg.base + path);
    await atLogin();
  }
  console.log("PASS: all tested protected pages redirect after browser logout");
  console.log("PASS: isolated authenticated browser acceptance completed");
  console.log("SCOPE: local candidate configuration; no production, gateway API-key or editorial-write verification");
} catch {
  console.error("FAIL: authenticated browser stage: " + stage + "; sensitive details withheld");
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
