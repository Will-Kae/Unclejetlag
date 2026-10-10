/**
 * Internal link validation (Phase 1A).
 * Crawls every sitemap page's server-rendered HTML, collects internal links and checks each target once.
 * - Pages must resolve to 200 (redirects are followed).
 * - /go/ links must point at an active partner and return the 302 redirect.
 * Known broken links live in tests/fixtures/known-broken-links.json (dated). A new broken link fails;
 * an allowlisted link that now works also fails, so the allowlist is kept honest.
 */
import { expect, test } from "@playwright/test";
import { internalHrefs, mapLimit, readFixture, sitemapPaths } from "./helpers";

type Known = { recorded: string; links: { target: string }[] };

test("no new broken internal links", async ({ request }) => {
  test.setTimeout(300_000);
  const pages = await sitemapPaths(request);
  const linkedFrom = new Map<string, Set<string>>();
  await mapLimit(pages, 8, async (p) => {
    const html = await (await request.get(p)).text();
    for (const h of internalHrefs(html)) {
      if (!linkedFrom.has(h)) linkedFrom.set(h, new Set());
      linkedFrom.get(h)!.add(p);
    }
  });
  expect(linkedFrom.size, "crawler found internal links").toBeGreaterThan(400);

  const active = new Set(readFixture<{ activeSlugs: string[] }>("affiliate-contract.json").activeSlugs);
  const targets = [...linkedFrom.keys()].sort();
  const broken = (await mapLimit(targets, 8, async (t) => {
    if (t.startsWith("/go/")) {
      const slug = t.slice(4).split("?")[0];
      if (!active.has(slug)) return `${t} (inactive or unknown partner)`;
      const res = await request.get(t, { maxRedirects: 0 });
      return res.status() === 302 ? null : `${t} -> ${res.status()}`;
    }
    const res = await request.get(t);
    return res.status() === 200 ? null : t;
  })).filter((x): x is string => !!x);

  const known = new Set(readFixture<Known>("known-broken-links.json").links.map((l) => l.target));
  const newlyBroken = broken.filter((b) => !known.has(b)).map((b) => `${b}  (linked from ${[...(linkedFrom.get(b.split(" ")[0]) ?? [])].slice(0, 3).join(", ")})`);
  const fixedButAllowlisted = [...known].filter((k) => !broken.includes(k));
  expect(newlyBroken, "New broken internal links").toEqual([]);
  expect(fixedButAllowlisted, "These allowlisted links now work: remove them from tests/fixtures/known-broken-links.json").toEqual([]);
});
