import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Uncle Jetlag Recommends: Travel Tools Worth Paying For",
  description: "The travel eSIMs, VPN and password manager Uncle Jetlag recommends, with why, who they suit, and exactly how we're paid.",
  path: "/recommends",
  ogKicker: "Uncle Jetlag Recommends",
});

const groups = [
  {
    title: "eSIMs",
    intro: "Two different approaches. Pick by how you use data, not by brand.",
    more: { href: "/esim", label: "Use the eSIM Finder" },
    picks: [
      { slug: "holafly", why: ["Unlimited data by the day, no counting gigabytes", "Confirmed reader code UNCLEJETLAG, reusable", "Fair use and hotspot caps apply: read them"] },
      { slug: "saily", why: ["Fixed-data plans: pay for what you use", "Top up in the app; hotspot sharing allowed", "Unlimited plans in selected destinations"] },
    ],
  },
  {
    title: "VPN",
    intro: "For hotel, airport and café Wi-Fi you don't control. Useful, not magic.",
    more: { href: "/security#vpn", label: "VPNs, honestly" },
    picks: [{ slug: "nordvpn", why: ["Encrypts traffic between your device and the VPN server", "Set it up and test it before you fly", "Doesn't make you anonymous; check local rules on VPN use"] }],
  },
  {
    title: "Password security",
    intro: "Unique passwords for airline, hotel, email and bank logins, without memorising any.",
    more: { href: "/security#passwords", label: "Passwords and passkeys" },
    picks: [{ slug: "nordpass", why: ["Generates and stores a unique password per account", "One breach doesn't become every breach", "Pair it with passkeys where offered"] }],
  },
];

const soon = ["Travel insurance", "Banking & travel cards", "Luggage & gear", "Flights & hotels", "Airport lounges & transfers", "Activities"];

export default function RecommendsPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-uj pb-12 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ name: "Uncle Jetlag Recommends", href: "/recommends" }]} />
          <div className="mt-10 max-w-3xl">
            <p className="label-mono text-jet-ink">Curated, not catalogued</p>
            <h1 className="mt-3 text-[clamp(2.4rem,1.5rem+3.8vw,4.4rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">Uncle Jetlag recommends</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              A short list on purpose. Everything here earns its place by being useful to travellers. Every item is labelled: today they&apos;re all
              affiliate partners, which means we may earn a commission if you buy, at no extra cost to you. None are sponsored placements, and no
              partner can buy a spot or a better write-up.
            </p>
          </div>
        </div>
      </section>
      <div className="container-uj">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`g-${g.title}`} className="mt-16">
            <div className="flex flex-col gap-2 border-b border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id={`g-${g.title}`} className="font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">{g.title}</h2>
                <p className="mt-1 text-muted">{g.intro}</p>
              </div>
              <Link href={g.more.href} className="text-sm font-semibold text-sky underline">{g.more.label}</Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {g.picks.map((p) => <PartnerCard key={p.slug} slug={p.slug} placement="recommends" why={p.why} />)}
            </div>
          </section>
        ))}
        <section aria-labelledby="soon" className="mt-16 rounded-2xl border border-dashed border-ink/20 p-6 sm:p-8">
          <h2 id="soon" className="font-display text-xl font-semibold">Still testing</h2>
          <p className="mt-2 text-muted">We&apos;ll only add these once we find products we&apos;d use ourselves: {soon.join(", ")}.</p>
        </section>
        <p className="mt-8 max-w-3xl text-sm text-muted">
          <strong className="text-ink">Labels we use:</strong> <em>Editorial pick</em> means no commercial relationship. <em>Affiliate partner</em> means we may
          earn a commission. <em>Sponsored</em> means a partner paid for the placement (we don&apos;t currently have any). Read the full{" "}
          <Link href="/affiliate-disclosure" className="underline">affiliate disclosure</Link>.
        </p>
      </div>
    </>
  );
}
