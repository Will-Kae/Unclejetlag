/**
 * Phase 4C.7: the Evidence Review Workspace must never be reachable without a research session.
 * The harness build has no Supabase configuration, so every request must end on the sign-in page.
 */
import { expect, test } from "@playwright/test";
import { blockThirdParty, sitemapPaths } from "./helpers";

const PROTECTED = [
  "/passport-index/research-admin/workspace",
  "/passport-index/research-admin/workspace?country=TZ&status=disputed",
  "/passport-index/research-admin/workspace/cases/pair-gh-tz",
  "/passport-index/research-admin/workspace/cases/does-not-exist",
];

test.describe("research workspace access", () => {
  for (const url of PROTECTED) {
    test(`unauthenticated ${url} redirects to sign-in without research data`, async ({ page }) => {
      await blockThirdParty(page);
      const res = await page.goto(url);
      // The root layout streams before the page runs, so Next delivers redirect() as an in-document
      // redirect (meta refresh plus router instruction) rather than an HTTP 307. Check the raw HTML
      // carries the redirect and no research data, then that the browser lands on sign-in.
      const raw = (await res?.text()) ?? "";
      expect(raw).toContain("NEXT_REDIRECT;replace;/passport-index/research-admin/login");
      for (const leak of ["Evidence review workspace", "Research overview", "p4c3-", "Ghana → Tanzania", "tz-isd-visa-guidelines"]) expect(raw).not.toContain(leak);
      await page.waitForURL(/\/passport-index\/research-admin\/login$/);
      expect(await page.content()).not.toContain("Research overview");
    });
  }

  test("a forged session cookie is refused", async ({ page, context }) => {
    await blockThirdParty(page);
    await context.addCookies([{ name: "uj_passport_research_session", value: "forged", url: "http://127.0.0.1" }]);
    const res = await page.goto("/passport-index/research-admin/workspace");
    expect((await res?.text()) ?? "").not.toContain("Research overview");
    await page.waitForURL(/\/passport-index\/research-admin\/login$/);
  });

  test("the workspace is not in the sitemap and no research API is exposed", async ({ request }) => {
    const paths = await sitemapPaths(request);
    expect(paths.filter((p) => p.includes("research-admin"))).toEqual([]);
    for (const p of ["/api/passport-research", "/api/research-cases", "/passport-index/research-admin/workspace/cases"]) {
      const r = await request.get(p, { maxRedirects: 0 });
      expect([307, 308, 404]).toContain(r.status());
    }
  });
});
