/** Real-provider audit, opt-in only. Each Playwright test gets a fresh isolated context. */
import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";

const paths = ["/", "/guides/topics/flights", "/guides/topics/hotels", "/guides/topics/car-rentals", "/insurance"];
const providers = [
  { path: paths[1], button: "Load flight search", host: "tpwidg.com" },
  { path: paths[2], button: "Load hotel and stays search", host: "creator.expediagroup.com" },
  { path: paths[3], button: "Load car hire search", host: "widget.discovercars.com" },
  { path: paths[4], button: "Load health insurance calculator", host: "widgets.genki.world" },
];
const optionalHosts = /(^|\.)(emrldtp\.cc|tpwidg\.com|discovercars\.com|expediagroup\.com|genki\.world|lduhtrp\.net|googlesyndication\.com|doubleclick\.net|googleadservices\.com)$/;

async function capture(context: BrowserContext, info: TestInfo) {
  const requests: { url: string; host: string; type: string; time: number }[] = [];
  const errors: string[] = [];
  await context.tracing.group(`deployment ${process.env.PREVIEW_AUDIT_COMMIT}`);
  context.on("request", request => {
    const url = new URL(request.url());
    requests.push({ url: request.url(), host: url.hostname, type: request.resourceType(), time: Date.now() });
  });
  const observe = (page: Page) => {
    page.on("pageerror", error => errors.push(error.stack ?? error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  };
  context.pages().forEach(observe);
  context.on("page", observe);
  return {
    requests, errors,
    optional: () => requests.filter(r => optionalHosts.test(r.host)),
    save: async () => {
      await info.attach("network-and-errors", { body: JSON.stringify({ claimedDeploymentCommit: process.env.PREVIEW_AUDIT_COMMIT, requests, errors }, null, 2), contentType: "application/json" });
    },
  };
}
async function exercise(page: Page) {
  for (const name of ["Book a hotel", "Book a car", "Book a flight"]) {
    const tab = page.getByRole("tab", { name, exact: true });
    if (await tab.count()) await tab.click();
  }
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  });
  await page.waitForTimeout(2500);
}

for (const essentialOnly of [false, true]) {
  test(`${essentialOnly ? "Essential Only" : "no consent"}: no optional provider attempts across five pages`, async ({ page, context }, info) => {
    const evidence = await capture(context, info);
    try {
      await page.goto("/");
      if (essentialOnly) await page.getByRole("button", { name: "Essential only", exact: true }).click();
      for (const path of paths) { await page.goto(path); await exercise(page); }
      expect(evidence.optional()).toEqual([]);
    } finally { await evidence.save(); }
  });
}

for (const provider of providers) {
  test(`${provider.host}: individual activation keeps unrelated providers gated`, async ({ page, context }, info) => {
    const evidence = await capture(context, info);
    try {
      await page.goto(provider.path);
      await page.getByRole("button", { name: "Essential only", exact: true }).click();
      await page.getByRole("button", { name: provider.button, exact: true }).click();
      await expect.poll(() => evidence.requests.some(r => r.host === provider.host)).toBe(true);
      await page.waitForTimeout(2500);
      const unrelated = providers.filter(p => p.host !== provider.host).map(p => p.host);
      expect(evidence.requests.filter(r => unrelated.includes(r.host) || /emrldtp\.cc|googlesyndication\.com|doubleclick\.net/.test(r.host))).toEqual([]);
    } finally { await evidence.save(); }
  });
}

test("Accept All enables ads; withdrawal blocks new optional requests after reload", async ({ page, context }, info) => {
  const evidence = await capture(context, info);
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all", exact: true }).click();
    await exercise(page);
    await expect.poll(() => evidence.requests.some(r => r.host === "emrldtp.cc")).toBe(true);
    await expect.poll(() => evidence.requests.some(r => r.host === "pagead2.googlesyndication.com")).toBe(true);
    await page.getByRole("button", { name: "Cookie settings", exact: true }).last().click();
    // Record the reload itself, not only requests that arrive afterwards.
    const start = evidence.requests.length;
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("dialog", { name: "Cookies, briefly." }).getByRole("button", { name: "Essential only", exact: true }).click(),
    ]);
    await exercise(page);
    expect(evidence.requests.slice(start).filter(r => optionalHosts.test(r.host))).toEqual([]);
  } finally { await evidence.save(); }
});

for (const width of [375, 390, 768]) for (const path of paths) {
  test(`${width}px ${path}: live provider layout`, async ({ page, context }, info) => {
    const evidence = await capture(context, info);
    try {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(path);
      const banner = page.getByRole("dialog", { name: "Cookies, briefly." });
      for (const name of ["Customise", "Essential only", "Accept all"]) {
        const box = await banner.getByRole("button", { name, exact: true }).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      await banner.getByRole("button", { name: "Essential only", exact: true }).click();
      if (path === "/") {
        for (const name of ["Book a flight", "Book a hotel", "Book a car"]) {
          await page.getByRole("tab", { name, exact: true }).click();
          await page.getByRole("button", { name: /^Load / }).click();
          await page.waitForTimeout(2500);
          await info.attach(`${width}-${name}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        }
      } else await page.getByRole("button", { name: /^Load / }).click();
      await exercise(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
      await info.attach("live-layout", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    } finally { await evidence.save(); }
  });
}

test("DiscoverCars selected Johannesburg search preserves attribution and records provider errors", async ({ page, context }, info) => {
  const evidence = await capture(context, info);
  try {
    await page.goto("/guides/topics/car-rentals");
    await page.getByRole("button", { name: "Load car hire search", exact: true }).click();
    const iframe = page.locator("#discoFrameId");
    await expect(iframe).toHaveAttribute("title", "DiscoverCars car rental search");
    const src = new URL((await iframe.getAttribute("src"))!);
    expect(src.searchParams.get("aff_code")).toBe("a_aid");
    expect(src.searchParams.get("aff_value")).toBe("unclejetlag");
    const frame = page.frameLocator("#discoFrameId");
    await frame.getByRole("searchbox", { name: "Pick-up location" }).pressSequentially("Johannesburg");
    await frame.getByText("O.R. Tambo International Airport (JNB)", { exact: false }).click();
    const popup = page.waitForEvent("popup");
    await frame.getByRole("button", { name: "Search now", exact: true }).click();
    const result = await popup;
    await result.waitForURL(/https:\/\/www\.discovercars\.com\/search\//);
    await expect(result.getByText(/\d+ offers found/)).toBeVisible();
    expect(new URL(result.url()).searchParams.get("a_aid")).toBe("unclejetlag");
    await info.attach("results-url", { body: result.url(), contentType: "text/plain" });
    expect.soft(evidence.errors.filter(e => /isRTL|MutationObserver/.test(e)), "provider errors remain release findings, not silently suppressed").toEqual([]);
  } finally { await evidence.save(); }
});
