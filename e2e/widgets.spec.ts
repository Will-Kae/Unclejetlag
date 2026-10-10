/**
 * Third-party integration protection (Phase 1A).
 * Checks that each partner integration is still mounted with its exact identifiers. All third-party
 * requests are aborted (blockThirdParty), so the widgets' own scripts never load; we only inspect the
 * markup and the script/iframe tags our code creates.
 */
import { expect, test } from "@playwright/test";
import { blockThirdParty } from "./helpers";

test.beforeEach(async ({ page }) => blockThirdParty(page));

test("site-wide head integrations: Impact verification and consent defaults (no pre-consent Drive)", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).not.toContain('id="travelpayouts"');
  expect(html).toContain("e3f65cdf-b28c-4507-9fd4-e102d360a10e");
  expect(html).toContain("2cabb71a-44d5-414f-b1d4-dedb993fc5aa");
  expect(html).toContain('id="consent-defaults"');
});


test("Travelpayouts Drive loads only after advertising consent, not before", async ({ page }) => {
  await page.goto("/");
  const drive = page.locator('script[src="https://emrldtp.cc/NTgyNzYz.js?t=582763"]');
  await expect(drive).toHaveCount(0);
  await page.getByRole("button", { name: "Essential only" }).click();
  await expect(drive).toHaveCount(0);
  await page.getByRole("button", { name: "Cookie settings" }).first().click();
  await page.getByRole("button", { name: "Accept all" }).click();
  await expect(drive).toHaveCount(1);
});

test("Travelpayouts Drive remains absent for analytics-only consent", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "uj_consent", value: encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), analytics: true, ads: false })), url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator('script[src="https://emrldtp.cc/NTgyNzYz.js?t=582763"]')).toHaveCount(0);
});

test("Travelpayouts Drive is not loaded after ads consent withdrawal and reload", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "uj_consent", value: encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), analytics: false, ads: true })), url: baseURL! }]);
  await page.goto("/");
  const drive = page.locator('script[src="https://emrldtp.cc/NTgyNzYz.js?t=582763"]');
  await expect(drive).toHaveCount(1);
  await page.getByRole("button", { name: "Cookie settings" }).first().click();
  await page.getByRole("button", { name: "Essential only" }).click();
  await page.waitForLoadState("load");
  await expect(drive).toHaveCount(0);
});

test("Travelpayouts flights widget keeps its tracking parameters", async ({ page }) => {
  await page.goto("/guides/topics/flights");
  await page.locator("#flights").scrollIntoViewIfNeeded();
  const src = await page.waitForFunction(() => [...document.scripts].map((s) => s.src).find((s) => s.startsWith("https://tpwidg.com/content")), null, { timeout: 15_000 }).then((h) => h.jsonValue());
  const u = new URL(String(src));
  expect(u.searchParams.get("trs")).toBe("582763");
  expect(u.searchParams.get("shmarker")).toBe("786947.786947");
  expect(u.searchParams.get("promo_id")).toBe("3414");
  expect(u.searchParams.get("campaign_id")).toBe("111");
});

test("Expedia stays widget embed keeps its partner identifiers", async ({ page, request }) => {
  await page.goto("/guides/topics/hotels");
  await page.locator("#hotels-stays").scrollIntoViewIfNeeded();
  await expect(page.locator('iframe[src="/embeds/expedia-stays.html"]')).toHaveCount(1, { timeout: 15_000 });
  const embed = await (await request.get("/embeds/expedia-stays.html")).text();
  for (const attr of ['data-program="uk-expedia"', 'data-lobs="stays"', 'data-network="pz"', 'data-camref="1011l6tK2n"', 'data-pubref="unclejetlag"', 'src="https://creator.expediagroup.com/products/widgets/assets/eg-widgets.js"']) {
    expect(embed, attr).toContain(attr);
  }
});

test("DiscoverCars widget keeps its affiliate attributes", async ({ page }) => {
  await page.goto("/guides/topics/car-rentals");
  await page.locator("#car-rentals").scrollIntoViewIfNeeded();
  const s = page.locator('script[src="https://www.discovercars.com/widget.js?v1"]');
  await expect(s).toHaveCount(1, { timeout: 15_000 });
  await expect(s).toHaveAttribute("data-utm-source", "unclejetlag");
  await expect(s).toHaveAttribute("data-aff-code", "a_aid");
  await expect(s).toHaveAttribute("data-aff-channel", "code1");
});

test("Insurance: Genki calculator iframe and World Nomads / Genki partner links", async ({ page }) => {
  await page.goto("/insurance");
  const iframe = page.locator('iframe[src^="https://widgets.genki.world/calculator"]');
  await expect(iframe).toHaveCount(1);
  expect(new URL((await iframe.getAttribute("src"))!).searchParams.get("with")).toBe("unclejetlag");
  // These partners are linked directly with their exact tracking URLs (not via /go/).
  for (const href of ["https://www.jdoqocy.com/click-101899765-15403748", "https://genki.world/products/traveler?with=unclejetlag", "https://genki.world/products/native?with=unclejetlag"]) {
    await expect(page.locator(`a[href="${href}"]`).first(), href).toBeAttached();
  }
  // The CJ impression pixel must NOT be present without ads consent.
  await expect(page.locator('img[src="https://www.lduhtrp.net/image-101899765-15403748"]')).toHaveCount(0);
});

test("Insurance: CJ impression pixel appears only after ads consent, once", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "uj_consent", value: encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), analytics: false, ads: true })), url: baseURL! }]);
  await page.goto("/insurance");
  await expect(page.locator('img[src="https://www.lduhtrp.net/image-101899765-15403748"]')).toHaveCount(1, { timeout: 10_000 });
});

test("Homepage booking tabs keep all three panels", async ({ page }) => {
  await page.goto("/");
  for (const id of ["book-panel-flights", "book-panel-hotels", "book-panel-cars"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
});

test("Partner links are still placed on their hub pages", async ({ page }) => {
  const expectations: Record<string, string[]> = {
    "/esim": ["holafly", "saily"],
    "/security": ["nordvpn", "nordpass"],
    "/banking": ["dukascopy"],
    "/guides/topics/car-rentals": ["discovercars"],
  };
  for (const [path, slugs] of Object.entries(expectations)) {
    await page.goto(path);
    for (const slug of slugs) await expect(page.locator(`a[href^="/go/${slug}"]`).first(), `${path} -> ${slug}`).toBeAttached();
  }
});
