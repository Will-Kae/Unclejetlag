/**
 * Route preservation (Phase 1A).
 * - The sitemap must match tests/fixtures/sitemap-paths.json exactly. Additions and removals are allowed
 *   only by regenerating the fixture (`npm run harness:baseline`) so the change is reviewed in the PR diff.
 * - Every sitemap URL returns 200 and is not marked noindex.
 * - Every known noindex page still returns 200 and stays noindex.
 * - Every configured redirect keeps its status code and destination.
 */
import { expect, test } from "@playwright/test";
import { mapLimit, readFixture, sitemapPaths, UPDATE, writeFixture } from "./helpers";

type Redirect = { from: string; status: number; location: string; host?: string };

test.describe("sitemap", () => {
  test("matches the reviewed baseline", async ({ request }) => {
    const now = await sitemapPaths(request);
    if (UPDATE) writeFixture("sitemap-paths.json", { note: "Sitemap paths. Regenerate only for an intentional, reviewed change.", count: now.length, paths: now });
    const base = readFixture<{ paths: string[] }>("sitemap-paths.json").paths;
    const added = now.filter((p) => !base.includes(p));
    const removed = base.filter((p) => !now.includes(p));
    expect({ added, removed }, `Sitemap changed: +${added.length} -${removed.length}. If intentional, run "npm run harness:baseline" and review the fixture diff.`).toEqual({ added: [], removed: [] });
  });

  test("every sitemap URL returns 200 and is indexable", async ({ request }) => {
    const paths = await sitemapPaths(request);
    const bad = (await mapLimit(paths, 8, async (p) => {
      const res = await request.get(p, { maxRedirects: 0 });
      const body = res.status() === 200 ? await res.text() : "";
      const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(body) || /noindex/i.test(res.headers()["x-robots-tag"] ?? "");
      return res.status() !== 200 ? `${p} -> ${res.status()}` : noindex ? `${p} -> noindex` : null;
    })).filter(Boolean);
    expect(bad, "Sitemap URLs must return 200 and be indexable").toEqual([]);
  });
});

test.describe("noindex pages", () => {
  test("known noindex pages still exist and stay noindex", async ({ request }) => {
    const fx = readFixture<{ paths: string[] }>("noindex-paths.json");
    const bad = (await mapLimit(fx.paths, 8, async (p) => {
      const res = await request.get(p, { maxRedirects: 0 });
      const body = await res.text();
      const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(body);
      return res.status() !== 200 ? `${p} -> ${res.status()}` : !noindex ? `${p} -> now indexable (update the fixture if intentional)` : null;
    })).filter(Boolean);
    expect(bad).toEqual([]);
  });
});

test.describe("redirects", () => {
  const redirects = readFixture<{ redirects: Redirect[] }>("redirects.json").redirects;
  for (const r of redirects) {
    test(`${r.host ?? ""}${r.from} -> ${r.status} ${r.location}`, async ({ request }) => {
      const res = await request.get(r.from, { maxRedirects: 0, headers: r.host ? { host: r.host } : {} });
      expect(res.status()).toBe(r.status);
      expect(res.headers()["location"]).toBe(r.location);
    });
  }
});

test("unknown routes return 404 (not a soft 200)", async ({ request }) => {
  for (const p of ["/harness-does-not-exist", "/destinations/harness-nowhere", "/passport-index/passports/harness-nowhere", "/banks/south-africa/harness-bank"]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
});
