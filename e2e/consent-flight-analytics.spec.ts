/**
 * Phase 3A: separate, informed consent for the Travelpayouts flight search.
 *
 * Loading the flight search starts Travelpayouts' behavioural analytics (`_sp_id.*`: a unique ID and
 * visit timestamps, ~13 months; `_sp_ses.*`: 30 minutes), which Travelpayouts offers no way to switch
 * off. So the search loads only after the visitor presses "Allow and load flight search". These tests
 * cover refusal, acceptance, persistence, withdrawal (both routes) and third-party network isolation.
 *
 * Every request to a host other than the local server is recorded and aborted, so Travelpayouts is
 * never contacted. Aborting tpwidg.com means its downstream trackers never run here, so the analytics
 * cookies are created the way the tracker creates them (document.cookie on our page). Live behaviour
 * is checked on the Vercel preview.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const FLIGHTS = "/guides/topics/flights";
const WIDGET_HOST = "tpwidg.com";
const DRIVE = "emrldtp.cc";
const SP = ["_sp_id.4e6c", "_sp_ses.4e6c"];
const ALLOW = "Allow and load flight search";

async function recordThirdParty(context: BrowserContext) {
  const hosts: string[] = [];
  await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => {
    hosts.push(new URL(r.request().url()).hostname);
    return r.abort();
  });
  return { hosts, unique: () => [...new Set(hosts)].sort() };
}

async function cookie<T>(context: BrowserContext, name: string): Promise<T | null> {
  const c = (await context.cookies()).find((x) => x.name === name);
  return c ? (JSON.parse(decodeURIComponent(c.value)) as T) : null;
}
const flightPermission = (context: BrowserContext) => cookie<{ v: number; granted: boolean }>(context, "uj_flight_analytics");
const consent = (context: BrowserContext) => cookie<{ ads: boolean; analytics: boolean }>(context, "uj_consent");
const names = async (context: BrowserContext) => (await context.cookies()).map((c) => c.name);

/** Write the analytics cookies the way the Travelpayouts tracker does, plus an unrelated cookie. */
async function plantTrackerCookies(page: Page) {
  await page.evaluate((sp) => {
    for (const n of sp) document.cookie = `${n}=tracker-value; Path=/; Max-Age=3600; SameSite=Lax`;
    document.cookie = "uj_other_pref=keep; Path=/; Max-Age=3600; SameSite=Lax";
  }, SP);
}

async function scrollAll(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(600);
}

const placeholder = (page: Page) => page.locator('[data-consent-placeholder="travelpayouts-flights"]');

test("the prompt discloses provider, purpose, cookies and lifetime, and offers a real choice", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  const prompt = page.getByRole("group", { name: "Allow Travelpayouts analytics to use the flight search?" });
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("Travelpayouts");
  await expect(prompt).toContainText("behavioural analytics");
  await expect(prompt).toContainText("_sp_id.*");
  await expect(prompt).toContainText("about 13 months");
  await expect(prompt.getByRole("button", { name: ALLOW })).toBeVisible();
  await expect(prompt.getByRole("button", { name: "No thanks" })).toBeVisible();
  await scrollAll(page);
  expect(net.unique()).toEqual([]);
});

test("refusal: No thanks loads nothing, sets no analytics cookie, and is remembered", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "No thanks" }).click();
  await expect(placeholder(page)).toHaveAttribute("data-consent-state", "declined");
  await expect(page.getByText("Flight search not loaded")).toBeVisible();
  expect(await flightPermission(context)).toMatchObject({ v: 1, granted: false });
  // Declining in the tool doesn't answer the cookie banner.
  expect(await consent(context)).toBeNull();

  // Persistence: on later pages and visits the search stays unloaded, including the homepage tab.
  for (const p of [FLIGHTS, "/"]) {
    await page.goto(p);
    await scrollAll(page);
    await expect(placeholder(page)).toHaveAttribute("data-consent-state", "declined");
  }
  expect(net.unique()).toEqual([]);
  for (const n of SP) expect(await names(context)).not.toContain(n);

  // The choice can be reviewed; the prompt is offered again without loading anything.
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Review this choice" }).click();
  await expect(page.getByRole("button", { name: ALLOW })).toBeVisible();
  expect(net.unique()).toEqual([]);
});

test("Accept all does not allow the flight-search analytics", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Accept all" }).click();
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(1);
  await scrollAll(page);
  await expect(placeholder(page)).toHaveAttribute("data-consent-state", "undecided");
  expect(await flightPermission(context)).toBeNull();
  expect(net.hosts).not.toContain(WIDGET_HOST);

  // Analytics cookies left over (e.g. from an older visit) are deleted on the next load: advertising
  // consent doesn't cover them. Drive's own cookie, which advertising consent does cover, is kept.
  await plantTrackerCookies(page);
  await page.evaluate(() => (document.cookie = "am_user_session=s; Path=/; Max-Age=3600; SameSite=Lax"));
  await page.reload();
  await expect.poll(() => names(context)).not.toContain(SP[0]);
  const after = await names(context);
  expect(after).not.toContain(SP[1]);
  expect(after).toContain("am_user_session");
  expect(after).toContain("uj_other_pref");
});

test("acceptance: Allow loads only the flight search, grants nothing else, and persists", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Essential only" }).click();
  await page.getByRole("button", { name: ALLOW }).click();
  await expect(page.getByRole("region", { name: "Flight search from Travelpayouts" })).toBeFocused();
  await expect.poll(() => net.unique()).toEqual([WIDGET_HOST]);
  expect(await flightPermission(context)).toMatchObject({ v: 1, granted: true });
  expect(await consent(context)).toMatchObject({ ads: false, analytics: false });
  await expect(page.locator("#travelpayouts-drive")).toHaveCount(0);

  // Persistence across a full reload and other pages; other tools and Drive stay gated.
  await page.goto("/");
  await scrollAll(page);
  await expect(page.locator('[data-consent-loaded="travelpayouts-flights"]')).toHaveCount(1);
  await page.getByRole("tab", { name: "Book a hotel" }).click();
  await expect(page.locator('[data-consent-placeholder="expedia-stays"]')).toBeVisible();
  await page.goto("/insurance");
  await scrollAll(page);
  expect(net.unique()).toEqual([WIDGET_HOST]);
  expect(net.hosts).not.toContain(DRIVE);
});

test("allowing before any banner choice leaves the banner unanswered", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: ALLOW }).click();
  await expect.poll(() => net.unique()).toEqual([WIDGET_HOST]);
  expect(await consent(context)).toBeNull();
  await expect(page.getByRole("dialog", { name: "Cookies, briefly." })).toBeVisible();
});

test("withdrawal with Turn off: reloads, deletes the analytics cookies, and nothing third-party loads", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Essential only" }).click();
  await page.getByRole("button", { name: ALLOW }).click();
  await expect.poll(() => net.unique()).toEqual([WIDGET_HOST]);
  await plantTrackerCookies(page);
  for (const n of SP) expect(await names(context)).toContain(n);

  const reload = page.waitForEvent("load");
  await page.getByRole("button", { name: "Turn off" }).click();
  await reload;
  const after = await names(context);
  for (const n of SP) expect(after, n).not.toContain(n);
  expect(after).toContain("uj_consent");
  expect(after).toContain("uj_other_pref");
  expect(await flightPermission(context)).toMatchObject({ granted: false });
  expect(await consent(context)).toMatchObject({ ads: false, analytics: false });

  net.hosts.length = 0;
  for (const p of [FLIGHTS, "/", "/guides/topics/hotels"]) {
    await page.goto(p);
    await scrollAll(page);
  }
  await expect(page.locator('[data-consent-loaded="travelpayouts-flights"]')).toHaveCount(0);
  expect(net.unique()).toEqual([]);
});

test("withdrawal in Cookie settings: unticking the flight-search analytics reloads and deletes its cookies", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Accept all" }).click();
  await page.getByRole("button", { name: ALLOW }).click();
  await expect.poll(() => net.unique()).toContain(WIDGET_HOST);
  await plantTrackerCookies(page);

  await page.getByRole("button", { name: "Cookie settings" }).last().click();
  const dialog = page.getByRole("dialog", { name: "Cookies, briefly." });
  const box = dialog.getByRole("checkbox", { name: /Flight search analytics/ });
  await expect(box).toBeChecked();
  await box.uncheck();
  const reload = page.waitForEvent("load");
  await dialog.getByRole("button", { name: "Save choices" }).click();
  await reload;

  const after = await names(context);
  for (const n of SP) expect(after, n).not.toContain(n);
  expect(await flightPermission(context)).toMatchObject({ granted: false });
  // Advertising consent is a separate choice and stays as it was.
  expect(await consent(context)).toMatchObject({ ads: true });

  net.hosts.length = 0;
  await page.goto(FLIGHTS);
  await scrollAll(page);
  expect(net.hosts).not.toContain(WIDGET_HOST);
  await expect(placeholder(page)).toHaveAttribute("data-consent-state", "declined");
});

test("ticking the flight-search analytics in Cookie settings is an explicit allow", async ({ page, context }) => {
  const net = await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Customise" }).click();
  const dialog = page.getByRole("dialog", { name: "Cookies, briefly." });
  await dialog.getByRole("checkbox", { name: /Flight search analytics/ }).check();
  await dialog.getByRole("button", { name: "Save choices" }).click();
  expect(await flightPermission(context)).toMatchObject({ granted: true });
  expect(await consent(context)).toMatchObject({ ads: false, analytics: false });
  await scrollAll(page);
  await expect.poll(() => net.unique()).toEqual([WIDGET_HOST]);
});

test("Essential only also withdraws an earlier flight-search allow", async ({ page, context }) => {
  await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: ALLOW }).click();
  await plantTrackerCookies(page);
  // The banner is still unanswered here, so its Essential only button is on screen.
  const reload = page.waitForEvent("load");
  await page.getByRole("dialog", { name: "Cookies, briefly." }).getByRole("button", { name: "Essential only" }).click();
  await reload;
  for (const n of SP) expect(await names(context)).not.toContain(n);
  expect(await flightPermission(context)).toMatchObject({ granted: false });
});

test("saving choices without ticking it records no flight-search decision", async ({ page, context }) => {
  await recordThirdParty(context);
  await page.goto(FLIGHTS);
  await page.getByRole("button", { name: "Customise" }).click();
  await page.getByRole("dialog", { name: "Cookies, briefly." }).getByRole("button", { name: "Save choices" }).click();
  expect(await flightPermission(context)).toBeNull();
  await expect(placeholder(page)).toHaveAttribute("data-consent-state", "undecided");
});
