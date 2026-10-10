/**
 * Accessibility regression (Phase 1C-C). axe-core with WCAG 2.0/2.1/2.2 A + AA rules on the Zimbabwe
 * passport profile (the page with the original 14 contrast failures) and representative shared
 * components, at desktop and mobile widths. Plus keyboard checks: skip link and visible focus.
 * Third-party requests are blocked, as everywhere in the harness.
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { blockThirdParty } from "./helpers";

const AXE = path.join(path.dirname(require.resolve("axe-core")), "axe.min.js");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const NO_CONSENT = encodeURIComponent(JSON.stringify({ v: 1, ts: 1, analytics: false, ads: false }));

type Violation = { id: string; impact: string | null; nodes: { target: string[]; failureSummary?: string }[] };

async function axe(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: AXE });
  const v: Violation[] = await page.evaluate(async (tags) => {
    // @ts-expect-error axe is injected above
    const r = await window.axe.run(document, { runOnly: tags, resultTypes: ["violations"] });
    return r.violations;
  }, TAGS);
  return v.flatMap((x) => x.nodes.map((n) => `${x.id} (${x.impact}): ${n.target.join(" ")}`));
}

const PAGES = [
  "/passport-index/passports/zimbabwe",
  "/passport-index/passports/south-africa",
  "/passport-index/africa",
  "/passport-index/methodology",
  "/passport-index",
  "/",
  "/destinations/kenya",
  "/visas/zimbabwe/georgia",
  "/guides/topics/flights",
  "/esim",
  "/insurance",
  "/banks/south-africa",
  "/tools/global-banking",
];

for (const [name, viewport] of [["desktop", { width: 1366, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
  test.describe(`axe ${name}`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ page, context, baseURL }) => {
      await blockThirdParty(page);
      await context.addCookies([{ name: "uj_consent", value: NO_CONSENT, url: baseURL! }]);
    });

    for (const p of PAGES) {
      test(`${p} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(p);
        expect(await axe(page)).toEqual([]);
      });
    }

    test("passport comparison result has no violations", async ({ page }) => {
      await page.goto("/passport-index/compare?a=ZW&b=MW");
      await expect(page.getByText("Both passports").first()).toBeVisible();
      expect(await axe(page)).toEqual([]);
    });

    test("SWIFT/BIC checker result and error states have no violations", async ({ page }) => {
      await page.goto("/tools/swift-code-checker");
      const input = page.getByLabel("SWIFT or BIC code");
      await input.fill("ABSAZAJJ");
      await input.press("Enter");
      await expect(page.getByText("Found in our directory").first()).toBeVisible();
      expect(await axe(page)).toEqual([]);
      await input.fill("ZZ");
      await input.press("Enter");
      await expect(page.getByText("Invalid format").first()).toBeVisible();
      expect(await axe(page)).toEqual([]);
    });
  });
}

test("cookie banner (first visit) has no violations", async ({ page }) => {
  await blockThirdParty(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /accept/i }).first()).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test.describe("keyboard", () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    await blockThirdParty(page);
    await context.addCookies([{ name: "uj_consent", value: NO_CONSENT, url: baseURL! }]);
  });

  test("skip link is the first tab stop and moves focus to main content", async ({ page }) => {
    await page.goto("/passport-index/passports/zimbabwe");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    expect(await skip.getAttribute("href")).toBe("#main");
    await expect(page.locator("#main")).toHaveCount(1);
  });

  for (const p of ["/passport-index/passports/zimbabwe", "/"]) {
    test(`${p}: the first 30 tab stops all show a visible focus indicator`, async ({ page }) => {
      await page.goto(p);
      const missing: string[] = [];
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        // Visible focus = the focused element or one of its two nearest ancestors (e.g. a
        // focus-within ring on a search field) looks different focused vs. not focused.
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const chain = [el, el.parentElement, el.parentElement?.parentElement].filter(Boolean) as HTMLElement[];
          const sig = () => chain.map((n) => { const cs = getComputedStyle(n); return `${cs.outlineStyle}|${cs.outlineWidth}|${cs.outlineColor}|${cs.boxShadow}|${cs.borderColor}|${cs.backgroundColor}`; }).join("||");
          const focused = sig();
          el.blur();
          const unfocused = sig();
          el.focus({ preventScroll: true });
          return { visible: focused !== unfocused, desc: `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().slice(0, 40)}"` };
        });
        if (info && !info.visible) missing.push(info.desc);
      }
      expect(missing, "focusable elements without a visible focus style").toEqual([]);
    });
  }
});
