import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AffiliateDisclosure } from "@/components/mdx/Affiliate";
import { CodeCopy } from "@/components/esim/CodeCopy";
import { EsimFinder } from "@/components/esim/EsimFinder";
import { EsimCompare } from "@/components/esim/EsimCompare";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { ESIM_CODE, ESIM_DISCOUNT, esimDestinations } from "@/data/esim";
import { buildMetadata, faqLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Uncle Jetlag eSIM Finder: Land Connected (Holafly Code UNCLEJETLAG)",
  description:
    "Work out how much data your trip needs, compare Holafly and Saily travel eSIMs on the features that matter, and save 5% on Holafly with code UNCLEJETLAG.",
  path: "/esim",
  ogKicker: "eSIM Finder",
});

const faqs = [
  {
    q: "What is a travel eSIM?",
    a: "A digital SIM you download to your phone instead of inserting a plastic card. You buy a data plan online, install it with a QR code or the provider's app, and it connects to local networks when you arrive.",
  },
  {
    q: "Will an eSIM work on my phone?",
    a: "Only if your phone supports eSIM and is carrier-unlocked. Most flagship phones from about 2019 onwards support eSIM, but not every model or regional version. Look for an 'Add eSIM' option in your phone's settings and check the provider's compatibility list before you buy.",
  },
  {
    q: "How much data do I need?",
    a: "It depends on how you use your phone. Use the eSIM Finder above for a rough estimate, then check the mobile-data screen in your phone's settings for your real usage during a normal week.",
  },
  {
    q: "Is 'unlimited' data really unlimited?",
    a: "Not without conditions. Holafly applies a fair usage policy and caps hotspot sharing on the plans we checked. Saily's unlimited plans give 5 GB of high-speed data per 24 hours, then 1 Mbps. Fine for maps and messaging; heavy streaming may be slowed.",
  },
  {
    q: "Does the code UNCLEJETLAG work more than once?",
    a: "Yes. Holafly confirmed the code can be reused on future travel eSIM purchases, so keep it for your next trip. Discounts are set by Holafly and can change; check the price at checkout.",
  },
  {
    q: "Does Uncle Jetlag earn money from this?",
    a: "Yes. Holafly and Saily are affiliate partners: if you buy through our links we may earn a commission, at no extra cost to you. It doesn't change what we tell you, including the downsides, and we don't rank providers by commission.",
  },
];

export default function EsimHubPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-ink text-paper">
        <div className="container-uj pb-12 pt-6 sm:pb-16 sm:pt-8">
          <div className="[&_a]:text-paper/80 [&_span]:text-paper/60">
            <Breadcrumbs items={[{ name: "eSIM", href: "/esim" }]} />
          </div>
          <div className="mt-10 max-w-3xl">
            <p className="label-mono text-[#ffb59e]">Uncle Jetlag eSIM Finder · Don&apos;t roam. Jetlag.</p>
            <h1 className="mt-4 text-[clamp(2.8rem,1.6rem+5vw,5.5rem)] font-semibold uppercase leading-[0.92] tracking-[-0.03em]">
              Land <span className="text-[#ff7a52]">connected.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[clamp(1.1rem,1rem+0.6vw,1.4rem)] leading-relaxed text-paper/85">
              Find the right eSIM before your plane touches down. No physical SIM, no surprise roaming bill, no airport SIM-card mission.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-paper/70">
              <span>Holafly readers save {ESIM_DISCOUNT}:</span>
              <CodeCopy code={ESIM_CODE} dark placement="esim-hero" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-uj">
        {/* FINDER */}
        <section aria-labelledby="finder" className="-mt-2 pt-10">
          <h2 id="finder" className="sr-only">eSIM Finder</h2>
          <EsimFinder />
        </section>

        {/* COMPARE */}
        <section aria-labelledby="compare" id="compare" className="mt-20 scroll-mt-28">
          <p className="label-mono text-jet-ink">Compare providers</p>
          <h2 className="mt-3 max-w-3xl text-[clamp(1.7rem,1.3rem+1.5vw,2.4rem)] font-semibold leading-tight">
            Plan types, side by side. No made-up winners.
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            We compare what each provider actually offers, checked on their own pages. Prices change daily, so we send you to the provider for the
            current price instead of guessing it.
          </p>
          <div className="mt-8">
            <EsimCompare />
          </div>
        </section>

        {/* PARTNERS */}
        <section aria-labelledby="partners" className="mt-20">
          <h2 id="partners" className="text-[clamp(1.7rem,1.3rem+1.5vw,2.4rem)] font-semibold">Which one fits your trip?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <PartnerCard
              slug="holafly"
              placement="esim-hub-card"
              why={["You want unlimited data and don't want to count gigabytes", "Simple day-based plans", "Confirmed 5% reader code, reusable on future trips"]}
            />
            <PartnerCard
              slug="saily"
              placement="esim-hub-card"
              why={["You'd rather pay for the data you use with a fixed plan", "Top up in the app if you run low", "Hotspot sharing allowed"]}
            />
          </div>
        </section>

        {/* DESTINATIONS */}
        <section aria-labelledby="dest" className="mt-20">
          <h2 id="dest" className="text-[clamp(1.7rem,1.3rem+1.5vw,2.4rem)] font-semibold">Where are you landing?</h2>
          <p className="mt-3 max-w-2xl text-muted">Destination eSIM guides: what to expect from coverage, how much data you&apos;ll use, and what to sort before you fly.</p>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
            {esimDestinations.map((d) => (
              <li key={d.slug} className="bg-white">
                <Link href={`/esim/${d.slug}`} className="group flex h-full flex-col p-5 transition hover:bg-paper">
                  <span className="text-3xl" aria-hidden="true">{d.flag}</span>
                  <span className="mt-3 font-display text-lg font-semibold text-ink group-hover:text-jet-ink">Best eSIM for {d.name}</span>
                  <span className="mt-1 flex-1 text-sm text-ink-2">{d.note}</span>
                  <span className="mt-3 text-sm font-semibold text-sky">Read the guide →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* HOW IT WORKS */}
        <section aria-labelledby="how" className="mt-20">
          <h2 id="how" className="text-[clamp(1.7rem,1.3rem+1.5vw,2.4rem)] font-semibold">How it works</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line md:grid-cols-3">
            {[
              ["01", "Pick your destination", "Choose the country or region and how many days you need."],
              ["02", "Install at home", "Scan the QR code or use the provider's app on Wi-Fi, before you fly."],
              ["03", "Land connected", "Switch the eSIM on when you land. Maps, messages and rides, straight away."],
            ].map(([n, t, d]) => (
              <li key={n} className="bg-white p-6">
                <p className="font-mono text-3xl font-semibold text-jet">{n}</p>
                <p className="mt-3 font-display text-xl font-semibold text-ink">{t}</p>
                <p className="mt-2 text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* KEEP THE CODE */}
        <section aria-labelledby="code" className="mt-20 rounded-[1.75rem] bg-jet-soft/60 p-8 ring-1 ring-jet/15 sm:p-10">
          <p className="label-mono text-jet-ink">Save {ESIM_DISCOUNT.replace(/ off$/, "")} · Code: {ESIM_CODE}</p>
          <h2 id="code" className="mt-3 text-[clamp(1.6rem,1.2rem+1.5vw,2.2rem)] font-semibold">Keep the code. Use it again on your next trip.</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-2">
            {ESIM_CODE} gives you {ESIM_DISCOUNT} Holafly travel eSIMs, and it isn&apos;t a one-trip deal. Save it with your passport details.
          </p>
          <CodeCopy code={ESIM_CODE} className="mt-6" placement="esim-keep-code" />
        </section>

        {/* BEFORE YOU BUY */}
        <section aria-labelledby="check" className="mt-20 max-w-3xl">
          <h2 id="check" className="text-[clamp(1.7rem,1.3rem+1.5vw,2.4rem)] font-semibold">Check these before you buy</h2>
          <ul className="mt-6 space-y-4 text-ink-2">
            <li><strong className="text-ink">Your phone must support eSIM and be unlocked.</strong> A phone locked to your home network won&apos;t accept another provider&apos;s eSIM.</li>
            <li><strong className="text-ink">&quot;Unlimited&quot; comes with conditions.</strong> Read the fair-use and hotspot rules for your destination before you rely on it for work.</li>
            <li><strong className="text-ink">Install on Wi-Fi before you fly.</strong> Then switch it on when you land. Check when your plan&apos;s validity starts.</li>
            <li><strong className="text-ink">Keep your home SIM for SMS codes.</strong> Leave it installed with data roaming off so you can still receive bank verification texts.</li>
            <li><strong className="text-ink">Public Wi-Fi is the other half of staying connected.</strong> Read our <Link href="/security" className="font-semibold text-sky underline">travel security guide</Link> before you join the airport network.</li>
          </ul>
          <p className="mt-6 text-ink-2">
            Want the full picture, including when a local SIM is cheaper?{" "}
            <Link href="/travel-tech/best-esim-options-international-travelers" className="font-semibold text-sky underline">Read our guide to choosing a travel eSIM</Link>.
          </p>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-20 max-w-3xl">
          <h2 id="faq" className="text-[clamp(1.7rem,1.3rem+1.5vw,2.4rem)] font-semibold">Questions</h2>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {faqs.map((f) => (
              <details key={f.q} className="group">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">{f.q}</summary>
                <p className="px-5 pb-5 leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 max-w-3xl pb-10">
          <AffiliateDisclosure />
        </div>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
