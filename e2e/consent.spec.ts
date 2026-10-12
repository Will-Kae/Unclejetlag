/**
 * Consent and third-party compliance (Phase 3A). Network-level regression tests.
 *
 * Every request to a host other than the local server is recorded and then aborted, so no partner is
 * ever contacted, yet we can prove which services the browser *tried* to reach in each consent state:
 * - no choice made yet, and "Essential only": no third-party request at all, on any audited page,
 *   after scrolling every lazy section and opening every booking tab, including after client-side
 *   navigation;
 * - pressing a tool's "Load" button: only that tool's provider is contacted; advertising consent is
 *   not granted and Travelpayouts Drive / the CJ pixel never load;
 * - "Accept all": Drive and the tools load;
 * - withdrawing advertising consent: the page reloads and nothing third-party loads afterwards.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const AUDITED = ["/", "/guides/topics/flights", "/guides/topics/hotels", "/guides/topics/car-rentals", "/insurance", "/guides", "/esim", "/destinations/kenya", "/passport-index", "/money", "/travel-tech", "/visas/zimbabwe/georgia"];
const DRIVE = "emrldtp.cc";
const CJ = "www.lduhtrp.net";

/** Record (then abort) every third-party request made in this context. */
async function recordThirdParty(context: BrowserContext) {
  const hosts: string[] = [];
  await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => {
    hosts.push(new URL(r.request().url()).hostname);
    return r.abort();
  });
  return { hosts, unique: () => [...new Set(hosts)].sort() };
}

/** Scroll through the whole page and open every booking tab, so every lazy section would mount. */
async function exercise(page: Page) {
  for (const name of ["Book a hotel", "Book a car", "Book a flight"]) {
    const tab = page.getByRole("tab", { name });
    if (await tab.count()) await tab.click();
  }
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(800);
}

async function consentCookie(context: BrowserContext) {
  const c = (await context.cookies()).find((x) => x.name === "uj_consent");
  return c ? (JSON.parse(decodeURIComponent(c.value)) as { analytics: boolean; ads: boolean }) : null;
}

/** Click an in-app link and confirm the navigation was client-side (the window survived). */
async function clientNavigate(page: Page, href: string) {
  await page.evaluate(() => ((window as unknown as { __ujMarker: number }).__ujMarker = 1));
  await page.locator(`a[href="${href}"]`).first().click();
  await page.waitForURL((u) => u.pathname === href);
  expect(await page.evaluate(() => (window as unknown as { __ujMarker?: number }).__ujMarker), "client-side navigation").toBe(1);
}

test("server HTML keeps the Travelpayouts snippet only as an inert block", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const tag = html.match(/<script[^>]*id="travelpayouts"[^>]*>/)?.[0] ?? "";
  expect(tag).toContain('type="text/plain"');
  expect(tag).toContain('data-consent-category="advertising"');
  // No executable <script> anywhere in the server HTML points at the Drive host.
  for (const m of html.matchAll(/<script\b([^>]*)>/g)) {
    if (/emrldtp\.cc/.test(m[1])) throw new Error(`executable Drive script tag: ${m[0]}`);
  }
});

test("no choice made yet: no third-party request on any audited page", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  for (const p of AUDITED) {
    await page.goto(p);
    await exercise(page);
  }
  expect(net.unique()).toEqual([]);
  expect(await consentCookie(context)).toBeNull();
});

test("Essential only: nothing third-party loads, including after client-side navigation", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto("/");
  await page.getByRole("button", { name: "Essential only" }).click();
  expect(await consentCookie(context)).toMatchObject({ analytics: false, ads: false });
  await exercise(page);
  await clientNavigate(page, "/insurance");
  await exercise(page);
  await page.goto("/guides/topics/flights");
  await clientNavigate(page, "/guides/topics/hotels");
  await exercise(page);
  for (const p of AUDITED) {
    await page.goto(p);
    await exercise(page);
  }
  expect(net.unique()).toEqual([]);
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(0);
});

test("a tool's Load button loads only that tool and never grants advertising consent", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto("/guides/topics/flights");
  await page.getByRole("button", { name: "Essential only" }).click();
  await page.getByRole("button", { name: "Load flight search" }).click();
  // Focus moves to the loaded tool for keyboard and screen-reader users.
  await expect(page.getByRole("region", { name: "Flight search from Travelpayouts" })).toBeFocused();
  await expect.poll(() => net.unique()).toEqual(["tpwidg.com"]);
  expect(await consentCookie(context)).toMatchObject({ ads: false });
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(0);

  // Other tools stay gated after client-side navigation; the activation is per tool.
  await clientNavigate(page, "/guides/topics/hotels");
  await exercise(page);
  await expect(page.locator('[data-consent-placeholder="expedia-stays"]')).toBeVisible();
  await clientNavigate(page, "/insurance");
  await exercise(page);
  expect(net.unique()).toEqual(["tpwidg.com"]);
  expect(net.hosts).not.toContain(DRIVE);
  expect(net.hosts).not.toContain(CJ);

  // The activation is for this visit only: a full reload shows the placeholder again.
  await page.goto("/guides/topics/flights");
  await expect(page.locator('[data-consent-placeholder="travelpayouts-flights"]')).toBeVisible();
});

test("a Load button works before any banner choice and leaves the banner unanswered", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto("/insurance");
  await page.getByRole("button", { name: "Load health insurance calculator" }).click();
  await expect(page.locator('iframe[src^="https://widgets.genki.world/calculator"]')).toHaveCount(1);
  await expect.poll(() => net.unique()).toEqual(["widgets.genki.world"]);
  expect(await consentCookie(context)).toBeNull();
  await expect(page.getByRole("dialog", { name: "Cookies, briefly." })).toBeVisible();
});

test("Accept all: Drive and the embedded tools load", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto("/");
  await page.getByRole("button", { name: "Accept all" }).click();
  await exercise(page);
  await page.goto("/insurance", { waitUntil: "domcontentloaded" });
  await exercise(page);
  await page.goto("/guides/topics/car-rentals", { waitUntil: "domcontentloaded" });
  await exercise(page);
  await expect.poll(() => net.unique()).toEqual(expect.arrayContaining([DRIVE, "tpwidg.com", "creator.expediagroup.com", "www.discovercars.com", "widgets.genki.world", CJ]));
  await expect(page.locator("#travelpayouts-drive")).toHaveAttribute("src", "https://emrldtp.cc/NTgyNzYz.js?t=582763");
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(1);
});

test("withdrawing advertising consent reloads the page and nothing third-party loads afterwards", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto("/insurance");
  await page.getByRole("button", { name: "Accept all" }).click();
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(1);
  expect(net.hosts).toContain(DRIVE);

  await page.getByRole("button", { name: "Cookie settings" }).last().click();
  const reload = page.waitForEvent("load");
  await page.getByRole("dialog", { name: "Cookies, briefly." }).getByRole("button", { name: "Essential only" }).click();
  await reload;
  expect(await consentCookie(context)).toMatchObject({ ads: false, analytics: false });

  net.hosts.length = 0;
  await exercise(page);
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(0);
  await expect(page.locator('[data-consent-placeholder="genki-calculator"]')).toBeVisible();
  for (const p of ["/", "/guides/topics/flights"]) {
    await page.goto(p, { waitUntil: "domcontentloaded" });
    await exercise(page);
  }
  expect(net.unique()).toEqual([]);
});

test("changing only analytics consent does not reload the page", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Essential only" }).click();
  await page.evaluate(() => ((window as unknown as { __ujMarker: number }).__ujMarker = 1));
  await page.getByRole("button", { name: "Cookie settings" }).last().click();
  const dialog = page.getByRole("dialog", { name: "Cookies, briefly." });
  await dialog.getByRole("checkbox", { name: /Analytics/ }).check();
  await dialog.getByRole("button", { name: "Save choices" }).click();
  expect(await page.evaluate(() => (window as unknown as { __ujMarker?: number }).__ujMarker)).toBe(1);
});
