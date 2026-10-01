import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AffiliateDisclosure } from "@/components/mdx/Affiliate";
import { EsimFinder } from "@/components/esim/EsimFinder";
import { EsimCompare } from "@/components/esim/EsimCompare";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { ContextCTA } from "@/components/partners/ContextCTA";
import { JsonLd } from "@/components/ui/JsonLd";
import { esimDestinations, getEsimDestination, ESIM_FACTS_CHECKED, usageProfiles } from "@/data/esim";
import { getDestination } from "@/lib/content";
import { buildMetadata, faqLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const dynamicParams = false;

const wk = (perDay: number) => Math.round(perDay * 7);

export function generateStaticParams() {
  return esimDestinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/esim/[slug]">): Promise<Metadata> {
  const e = getEsimDestination((await params).slug);
  if (!e) return {};
  const where = e.longName ?? e.name;
  return buildMetadata({
    title: `Best eSIM for ${e.name}: Data, Coverage & Codes`,
    description: `Choosing an eSIM for ${where}: how much data you'll need, Holafly vs Saily plan types compared, coverage tips and how to install before you fly.`,
    path: `/esim/${e.slug}`,
    ogKicker: `eSIM · ${e.name}`,
    // Pages backed by a full destination guide carry enough unique value to index. The rest wait.
    noindex: !e.guide,
  });
}

export default async function EsimDestinationPage({ params }: PageProps<"/esim/[slug]">) {
  const e = getEsimDestination((await params).slug);
  if (!e) notFound();
  const g = e.guide ? getDestination(e.guide) : undefined;
  const where = e.longName ?? e.name;

  const faqs = [
    {
      q: `Do I need an eSIM for ${where}?`,
      a: `No, but it's the easiest way to have data from the moment you land: no SIM counter, no paperwork, no roaming bill. The alternatives are a local SIM bought on arrival or your home network's roaming package.`,
    },
    {
      q: `How much data do I need for a week in ${where}?`,
      a: `As an Uncle Jetlag rule of thumb, light users (messaging and maps) get by on ${wk(usageProfiles.light.gbPerDay[0])}–${wk(usageProfiles.light.gbPerDay[1])} GB a week, regular users ${wk(usageProfiles.regular.gbPerDay[0])}–${wk(usageProfiles.regular.gbPerDay[1])} GB, and heavy users much more. Check your phone's data-usage screen for your real number.`,
    },
    {
      q: `Holafly or Saily for ${where}?`,
      a: `Holafly sells unlimited-data plans by the day, which suit heavy users who don't want to count gigabytes. Saily sells fixed-data plans you can top up, plus unlimited plans in selected destinations. Check both for your dates: availability and prices vary by destination.`,
    },
    {
      q: "When should I install the eSIM?",
      a: "At home, on Wi-Fi, a day or two before you fly. Keep it switched off for data until you land, and check when the plan's validity starts.",
    },
  ];

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-sand/70 to-paper">
        <div className="container-uj pb-12 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ name: "eSIM", href: "/esim" }, { name: e.name, href: `/esim/${e.slug}` }]} />
          <div className="mt-10 max-w-3xl">
            <p className="label-mono text-jet-ink"><span aria-hidden="true">{e.flag}</span> eSIM guide · {e.name}</p>
            <h1 className="mt-3 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02] text-balance">Best eSIMs for {where}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{e.note} Here&apos;s how to choose, how much data to buy, and what to sort before you fly.</p>
            <p className="mt-4 text-sm text-muted">Last checked: {formatDate(ESIM_FACTS_CHECKED)}</p>
          </div>
        </div>
      </section>

      <div className="container-uj">
        {/* QUICK RECOMMENDATION */}
        <section aria-labelledby="quick" className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 id="quick" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">Quick recommendation</h2>
            <ul className="mt-5 space-y-3 text-ink-2">
              <li><strong className="text-ink">Heavy user, or don&apos;t want to think about it?</strong> Look at an unlimited plan, and read the fair-use and hotspot rules.</li>
              <li><strong className="text-ink">Mostly maps and messages?</strong> A fixed-data plan that you can top up usually means paying only for what you use.</li>
              <li><strong className="text-ink">Not sure?</strong> Use the finder below for a rough estimate, then compare the total cost for your dates on each provider&apos;s site.</li>
            </ul>
            <p className="mt-5 text-sm text-muted">We don&apos;t name a winner because we can&apos;t see live prices or network performance for {where}. That&apos;s deliberate.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PartnerCard slug="holafly" placement={`esim-${e.slug}`} destination={e.slug} why={["Unlimited data by the day", "Reusable 5% reader code"]} />
            <PartnerCard slug="saily" placement={`esim-${e.slug}`} destination={e.slug} why={["Fixed-data plans with top-ups", "Hotspot sharing allowed"]} />
          </div>
        </section>

        {/* FINDER */}
        <section aria-labelledby="data" className="mt-16">
          <h2 id="data" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">How much data do you need?</h2>
          <div className="mt-6"><EsimFinder initialDestination={e.slug} placement={`esim-${e.slug}-finder`} /></div>
        </section>

        {/* COMPARE */}
        <section aria-labelledby="compare" className="mt-16">
          <h2 id="compare" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">Compare providers</h2>
          <div className="mt-6"><EsimCompare placement={`esim-${e.slug}-compare`} destination={e.slug} /></div>
        </section>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* CONNECTIVITY */}
          <section aria-labelledby="coverage">
            <h2 id="coverage" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">Staying connected in {where}</h2>
            <ul className="mt-5 space-y-3 text-ink-2">
              {e.tips.map((t) => (
                <li key={t} className="flex gap-3"><span aria-hidden="true" className="mt-1 text-jet">●</span><span>{t}</span></li>
              ))}
            </ul>
            <h3 className="mt-10 font-display text-2xl font-semibold">Installing your eSIM</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-2">
              <li>Check your phone supports eSIM and is unlocked (look for &ldquo;Add eSIM&rdquo; in settings).</li>
              <li>Buy the plan and install it at home on Wi-Fi, using the QR code or the provider&apos;s app.</li>
              <li>Label it (e.g. &ldquo;Travel&rdquo;) and leave data roaming off on your home SIM.</li>
              <li>When you land, switch mobile data to the travel eSIM and turn on data roaming for that eSIM only.</li>
              <li>Keep your home SIM active for bank SMS codes, but not for data.</li>
            </ol>
            <ContextCTA
              slug="nordvpn"
              placement={`esim-${e.slug}-vpn`}
              kicker="Before you use hotel or airport Wi-Fi"
              title="Your eSIM covers data. Public Wi-Fi is a separate risk."
              className="mt-10"
            >
              Mobile data is generally safer than open Wi-Fi, but you&apos;ll still join hotel and café networks. A VPN encrypts traffic between your
              device and the VPN server on networks you don&apos;t control. It doesn&apos;t make you anonymous. <Link href="/security" className="underline">Read our travel security guide</Link>.
            </ContextCTA>
          </section>

          {/* QUICK FACTS */}
          <aside aria-label={`${e.name} quick facts`} className="lg:pt-2">
            {g ? (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
                <p className="label-mono text-muted">{g.countryName} essentials</p>
                <dl className="mt-4 space-y-3 text-[0.95rem]">
                  <div><dt className="text-muted">Currency</dt><dd className="font-semibold text-ink">{g.currency.name} ({g.currency.code})</dd></div>
                  <div><dt className="text-muted">Plugs</dt><dd className="font-semibold text-ink">Type {g.plugTypes.join(", ")} · {g.voltage}</dd></div>
                  <div><dt className="text-muted">Main airports</dt><dd className="font-semibold text-ink">{g.airports.map((a) => a.code).join(", ")}</dd></div>
                  <div><dt className="text-muted">Emergency</dt><dd className="font-semibold text-ink">{g.emergency.map((x) => `${x.label}: ${x.number}`).join(" · ")}</dd></div>
                </dl>
                <Link href={g.url} className="mt-5 inline-block font-semibold text-sky underline">Full {g.countryName} travel guide</Link>
                <p className="mt-2 text-xs text-muted">Guide updated {formatDate(g.updatedDate)}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/20 p-6">
                <p className="font-semibold text-ink">Full {e.name} guide coming</p>
                <p className="mt-2 text-sm text-muted">We publish destination guides only after checking official sources. Until then, check entry rules with the official government site.</p>
                <Link href="/tools/before-you-fly" className="mt-3 inline-block text-sm font-semibold text-sky underline">Build your Before You Fly checklist</Link>
              </div>
            )}
          </aside>
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-16 max-w-3xl">
          <h2 id="faq" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold">FAQs</h2>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">{f.q}</summary>
                <p className="px-5 pb-5 leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 max-w-3xl"><AffiliateDisclosure /></div>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
