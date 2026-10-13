/**
 * Phase 3A: withdrawal deletes Travelpayouts' Domain-scoped tracking cookies, as they exist on
 * unclejetlag.com (Domain=unclejetlag.com). A real-looking two-label domain (unclejetlag.test) is
 * mapped to the local server so Domain= cookies behave as in production. Third-party requests are
 * blocked as in every harness test.
 */
import { expect, test } from "@playwright/test";

const port = Number(process.env.HARNESS_PORT ?? 3210);
test.use({ baseURL: `http://www.unclejetlag.test:${port}`, launchOptions: { args: ["--host-resolver-rules=MAP *.unclejetlag.test 127.0.0.1, MAP unclejetlag.test 127.0.0.1"] } });

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!(?:[\w-]+\.)*unclejetlag\.test[:/]|127\.0\.0\.1|localhost)/, (r) => r.abort());
});

test("withdrawal deletes Domain=unclejetlag.test cookies as well as host-only ones", async ({ page, context }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Accept all" }).click();
  await page.evaluate(() => {
    document.cookie = "_sp_id.43e4=id; Domain=unclejetlag.test; Path=/; Max-Age=3600; SameSite=Lax";
    document.cookie = "_sp_ses.43e4=ses; Domain=unclejetlag.test; Path=/; Max-Age=3600; SameSite=Lax";
    document.cookie = "am_user_session=s; Path=/; Max-Age=3600; SameSite=Lax";
  });
  const before = await context.cookies();
  expect(before.find((c) => c.name === "_sp_id.43e4")?.domain).toBe(".unclejetlag.test");

  await page.getByRole("button", { name: "Cookie settings" }).last().click();
  const reload = page.waitForEvent("load");
  await page.getByRole("dialog", { name: "Cookies, briefly." }).getByRole("button", { name: "Essential only" }).click();
  await reload;

  const after = (await context.cookies()).map((c) => c.name);
  expect(after).not.toContain("_sp_id.43e4");
  expect(after).not.toContain("_sp_ses.43e4");
  expect(after).not.toContain("am_user_session");
  expect(after).toContain("uj_consent");
});

test("a tracker rewriting its cookie while the page unloads is cleared on the next load", async ({ page, context }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Accept all" }).click();
  // Simulate a tracker that writes its cookie again on pagehide, after the first clear.
  await page.evaluate(() => {
    document.cookie = "_sp_id.43e4=id; Domain=unclejetlag.test; Path=/; Max-Age=3600; SameSite=Lax";
    addEventListener("pagehide", () => {
      document.cookie = "_sp_id.43e4=rewritten; Domain=unclejetlag.test; Path=/; Max-Age=3600; SameSite=Lax";
    });
  });
  await page.getByRole("button", { name: "Cookie settings" }).last().click();
  const reload = page.waitForEvent("load");
  await page.getByRole("dialog", { name: "Cookies, briefly." }).getByRole("button", { name: "Essential only" }).click();
  await reload;
  await expect.poll(async () => (await context.cookies()).map((c) => c.name)).not.toContain("_sp_id.43e4");
});
