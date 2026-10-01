import { NextResponse } from "next/server";
import { getPartner } from "@/data/partners";

/**
 * Affiliate redirect: /go/[partner]?d=<destination>&p=<placement>&c=<campaign>
 *
 * - Picks a destination deep link when one is configured, else the partner's default URL.
 * - Appends placement / destination / campaign as network sub-IDs so partner dashboards show
 *   which pages and slots convert. No personal data is ever added.
 * - Logs one structured `affiliate_link_click` line (visible in Vercel runtime logs).
 * - Inactive partners bounce to the affiliate disclosure page.
 */
const clean = (v: string | null) => (v ? v.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) : "");

export async function GET(req: Request, ctx: { params: Promise<{ partner: string }> }) {
  const { partner } = await ctx.params;
  const p = getPartner(partner);
  const sp = new URL(req.url).searchParams;
  const d = clean(sp.get("d"));
  const placement = clean(sp.get("p"));
  const campaign = clean(sp.get("c")) || p?.campaign || "";

  if (!p?.active) {
    return NextResponse.redirect(new URL("/affiliate-disclosure?demo=1", req.url), { status: 302, headers: { "X-Robots-Tag": "noindex, nofollow" } });
  }

  let target = (d && p.links?.[d]) || p.url;
  try {
    const u = new URL(target);
    const [s1, s2, s3] = p.subIdParams ?? [];
    if (s1 && placement) u.searchParams.set(s1, placement);
    if (s2 && d) u.searchParams.set(s2, d);
    if (s3 && campaign) u.searchParams.set(s3, campaign);
    target = u.toString();
  } catch {
    /* keep the configured URL untouched if it can't be parsed */
  }

  console.log(
    JSON.stringify({
      event: "affiliate_link_click",
      partner: p.slug,
      destination: d || null,
      placement: placement || null,
      campaign: campaign || null,
      referrer_path: (() => {
        try {
          return new URL(req.headers.get("referer") ?? "").pathname;
        } catch {
          return null;
        }
      })(),
      device: /mobile|android|iphone/i.test(req.headers.get("user-agent") ?? "") ? "mobile" : "desktop",
    }),
  );

  return NextResponse.redirect(target, { status: 302, headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } });
}
