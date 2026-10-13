/**
 * Release safety (Phase 3A): AdSense must not load in any consent state. A Google-certified CMP is
 * planned for Phase 3B; until then ADSENSE_RELEASE_ENABLED is false (src/components/monetization/ads-config.ts).
 *
 * Every request to Google's ad hosts is recorded and aborted. For a meaningful run, build with a
 * publisher ID set, e.g. NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000 npm run build; the
 * unit test in tests/consent-services.test.ts covers the switch when no ID is configured.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ADSENSE = /(^|\.)(googlesyndication\.com|doubleclick\.net|googleadservices\.com|adtrafficquality\.google)$/;

async function record(context: BrowserContext) {
  const hosts: string[] = [];
  await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => {
    hosts.push(new URL(r.request().url()).hostname);
    return r.abort();
  });
  return () => hosts.filter((h) => ADSENSE.test(h));
}

async function visit(page: Page) {
  for (const p of ["/", "/guides", "/insurance", "/guides/topics/flights"]) {
    await page.goto(p);
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    await page.waitForTimeout(500);
    await expect(page.locator('script[src*="adsbygoogle"], ins.adsbygoogle')).toHaveCount(0);
  }
}

const states: { name: string; act: (page: Page) => Promise<void> }[] = [
  { name: "no choice made", act: async () => {} },
  { name: "Essential only", act: async (page) => page.getByRole("button", { name: "Essential only" }).click() },
  { name: "Accept site preferences", act: async (page) => page.getByRole("button", { name: "Accept site preferences" }).click() },
  {
    name: "Accept site preferences plus flight-search analytics",
    act: async (page) => {
      await page.getByRole("button", { name: "Accept site preferences" }).click();
      await page.goto("/guides/topics/flights");
      await page.getByRole("button", { name: "Allow and load flight search" }).click();
    },
  },
];

for (const s of states) {
  test(`AdSense does not load: ${s.name}`, async ({ page, context }) => {
    const adsenseHosts = await record(context);
    await page.goto("/about");
    await s.act(page);
    await visit(page);
    expect(adsenseHosts()).toEqual([]);
  });
}
