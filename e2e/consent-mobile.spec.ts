/**
 * Phase 3A mobile smoke checks. Third-party requests are blocked, so the test
 * exercises our responsive consent UI without contacting affiliate providers.
 */
import { expect, test } from "@playwright/test";
import { blockThirdParty } from "./helpers";

for (const width of [375, 390, 768]) {
  test.describe(`mobile consent at ${width}px`, () => {
    test.use({ viewport: { width, height: 812 } });

    test("cookie choices and car hire activation remain usable", async ({ page }) => {
      await blockThirdParty(page);
      await page.goto("/guides/topics/car-rentals", { waitUntil: "domcontentloaded" });
      const essential = page.getByRole("button", { name: "Essential only" });
      await expect(essential).toBeVisible();
      await essential.click();
      const load = page.getByRole("button", { name: "Load car hire search" });
      await load.scrollIntoViewIfNeeded();
      await expect(load).toBeVisible();
      await load.click();
      const script = page.locator('script[src="https://www.discovercars.com/widget.js?v1"]');
      await expect(script).toHaveAttribute("data-aff-code", "a_aid");
      await expect(script).toHaveAttribute("data-aff-value", "unclejetlag");
    });

    test("homepage cookie banner is actionable without horizontal overflow", async ({ page }) => {
      await blockThirdParty(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: "Accept all" })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "horizontal page overflow in pixels").toBeLessThanOrEqual(2);
    });
  });
}
