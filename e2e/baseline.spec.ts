/**
 * Baseline generator for the noindex fixture. Skipped unless UPDATE_BASELINE=1.
 * Candidates: every Passport Index profile, every eSIM page and /search.
 */
import { test } from "@playwright/test";
import { mapLimit, UPDATE, writeFixture } from "./helpers";
import { jurisdictions } from "../src/lib/passport/jurisdictions";
import { esimDestinations } from "../src/data/esim";

test("write tests/fixtures/noindex-paths.json", async ({ request }) => {
  test.skip(!UPDATE, "baseline generation only");
  test.setTimeout(300_000);
  const candidates = [...jurisdictions.map((j) => `/passport-index/passports/${j.slug}`), ...esimDestinations.map((e) => `/esim/${e.slug}`), "/search"];
  const flags = await mapLimit(candidates, 8, async (p) => {
    const res = await request.get(p, { maxRedirects: 0 });
    return res.status() === 200 && /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(await res.text()) ? p : null;
  });
  const paths = flags.filter((x): x is string => !!x).sort();
  writeFixture("noindex-paths.json", { note: "Pages that exist but are intentionally noindex. Passport profiles leave this list when they gain verified data: regenerate with npm run harness:baseline.", count: paths.length, paths });
});
