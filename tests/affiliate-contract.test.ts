/**
 * Affiliate protection (Phase 1A).
 *
 * Freezes the exact redirect contract of /go/[partner] for every partner in src/data/partners.ts:
 * status code, full target URL (referral IDs, affiliate IDs, sub-ID parameter names, default campaign),
 * and the noindex / no-store headers. Inactive and unknown partners must keep falling back to the
 * affiliate disclosure page.
 *
 * The fixture holds the same values that already live in src/data/partners.ts (no new exposure).
 * If a change is intentional, regenerate it with `npm run harness:baseline` and review the diff in the PR.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { partners } from "@/data/partners";
import { callGo, VARIANTS } from "./harness/go-route";

type Contract = Record<string, Record<string, { status: number; location: string | null; robots: string | null; cacheControl: string | null }>>;
const FIXTURE = path.join(__dirname, "fixtures/affiliate-contract.json");
const baseline: { partners: Contract; activeSlugs: string[] } = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));

describe("affiliate redirect contract", () => {
  it("has the same set of active partners as the baseline", () => {
    const active = partners.filter((p) => p.active).map((p) => p.slug).sort();
    expect(active, "Active partner list changed. If intentional, regenerate the baseline and review.").toEqual(baseline.activeSlugs);
  });

  for (const slug of Object.keys(baseline.partners)) {
    for (const q of VARIANTS) {
      it(`/go/${slug}${q} matches the baseline`, async () => {
        const got = await callGo(slug, q);
        expect(got, `Redirect contract for /go/${slug}${q} changed`).toEqual(baseline.partners[slug][q || "(none)"]);
      });
    }
  }

  it("sends unknown partners to the affiliate disclosure page", async () => {
    const got = await callGo("harness-unknown-partner");
    expect(got.status).toBe(302);
    expect(got.location).toBe("https://unclejetlag.com/affiliate-disclosure?demo=1");
    expect(got.robots).toBe("noindex, nofollow");
  });

  it("active partners always redirect with 302, noindex and no-store", async () => {
    for (const slug of baseline.activeSlugs) {
      const got = await callGo(slug);
      expect(got.status).toBe(302);
      expect(got.robots).toBe("noindex, nofollow");
      expect(got.cacheControl).toBe("no-store");
      expect(got.location?.startsWith("https://")).toBe(true);
    }
  });
});
