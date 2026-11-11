/** First-party responsive checks. Provider requests are aborted; live widget layout needs the preview audit. */
import { expect, test, type Page } from "@playwright/test";
import { blockThirdParty } from "./helpers";

const pages = [
  { path: "/", buttons: ["Allow and load flight search", "Load hotel and stays search", "Load car hire search"] },
  { path: "/guides/topics/flights", buttons: ["Allow and load flight search"] },
  { path: "/guides/topics/hotels", buttons: ["Load hotel and stays search"] },
  { path: "/guides/topics/car-rentals", buttons: ["Load car hire search"] },
  { path: "/insurance", buttons: ["Load health insurance calculator"] },
];

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
}
async function fitsViewport(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
}

for (const width of [375, 390, 768]) {
  test.describe(`mobile consent at ${width}px`, () => {
    test.use({ viewport: { width, height: 812 } });
    for (const entry of pages) {
      test(`${entry.path}: cookie choices, booking controls and activation fit`, async ({ page }) => {
        await blockThirdParty(page);
        await page.goto(entry.path, { waitUntil: "domcontentloaded" });
        await noOverflow(page);
        for (const name of ["Customise", "Essential only", "Accept site preferences"]) await fitsViewport(page, name);
        await page.getByRole("button", { name: "Essential only", exact: true }).click();
        for (let i = 0; i < entry.buttons.length; i++) {
          if (entry.path === "/") {
            const tabName = ["Book a flight", "Book a hotel", "Book a car"][i];
            await page.getByRole("tab", { name: tabName, exact: true }).click();
            await expect(page.getByRole("tab", { name: tabName, exact: true })).toHaveAttribute("aria-selected", "true");
          }
          const button = page.getByRole("button", { name: entry.buttons[i], exact: true });
          await button.scrollIntoViewIfNeeded();
          await fitsViewport(page, entry.buttons[i]);
          await button.click();
          await expect(page.locator("[data-consent-loaded]").filter({ visible: true }).last()).toBeVisible();
          await noOverflow(page);
        }
      });
    }
  });
}
