import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TravelInsuranceSection } from "@/components/partners/TravelInsuranceSection";
import { JsonLd } from "@/components/ui/JsonLd";
import { Shield, Alert, Passport, ListCheck, Check } from "@/components/ui/icons";
import { buildMetadata, faqLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

const REVIEWED = "2026-10-09";

export const metadata: Metadata = buildMetadata({
  title: "Travel Insurance Explained: What It Covers & Where It's Required",
  description:
    "What travel insurance usually covers, the common exclusions, declaring medical conditions, and the destinations that require cover, including Schengen visas, Georgia, Tanzania and Qatar.",
  path: "/insurance",
  ogKicker: "Travel Insurance",
});

const sections = [
  { id: "why", label: "Why it matters" },
  { id: "covers", label: "What it usually covers" },
  { id: "exclusions", label: "Common exclusions" },
  { id: "conditions", label: "Medical conditions" },
  { id: "required", label: "Where it's required" },
  { id: "choose", label: "How to compare" },
  { id: "partners", label: "Our partners" },
  { id: "faq", label: "Questions" },
];

const required = [
  { place: "Schengen short-stay visa", rule: "Travel medical insurance of at least €30,000, valid across the Schengen area for the whole stay, covering emergency treatment, hospital care and repatriation.", source: "EU Visa Code, Article 15", href: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02009R0810-20240628" },
  { place: "Georgia", rule: "Health and accident insurance of at least 30,000 GEL for the whole stay, for all visitors, since 1 January 2026.", source: "UK FCDO travel advice", href: "https://www.gov.uk/foreign-travel-advice/georgia/entry-requirements" },
  { place: "Tanzania (mainland and Zanzibar)", rule: "Non-resident visitors must buy the government-provided inbound travel insurance, even if they already have a policy. You may be refused entry without it.", source: "UK FCDO travel advice", href: "https://www.gov.uk/foreign-travel-advice/tanzania/entry-requirements" },
  { place: "Qatar", rule: "Visitors staying more than 30 days must buy health insurance from a provider registered with Qatar's Ministry of Public Health (standard premium QAR 50 per person per month).", source: "UK FCDO travel advice", href: "https://www.gov.uk/foreign-travel-advice/qatar/entry-requirements" },
];

const faqs = [
  { q: "Do I need travel insurance?", a: "Some destinations require it: a Schengen visa needs at least €30,000 of medical cover, and Georgia, Tanzania and Qatar (for stays over 30 days) have their own rules. Elsewhere it's optional, but medical treatment and emergency transport abroad can be very expensive, which is why governments such as the UK's advise getting it before you travel." },
  { q: "What does travel insurance usually cover?", a: "It depends on the policy. Common sections include emergency medical treatment, hospital care, emergency transport and repatriation, trip cancellation and curtailment, delays, and lost or stolen belongings. Always read the policy wording for limits and excess." },
  { q: "Do I have to declare medical conditions?", a: "Yes. UK government guidance says failing to declare an existing condition, or pending tests or treatment, may invalidate your insurance. If you're unsure whether something counts, ask the insurer before you buy." },
  { q: "Is a GHIC or EHIC enough for Europe?", a: "No. The UK GHIC and EHIC give access to state healthcare in the EU and some other countries, but the UK government and NHS say they're not a substitute for travel insurance: they don't cover private treatment or medical repatriation." },
  { q: "When should I buy travel insurance?", a: "Soon after you book, if you want cancellation cover. Many policies only cover cancellation from the date you buy, so check when your cover starts." },
  { q: "Does Uncle Jetlag sell insurance?", a: "No. Uncle Jetlag is a publisher, not an insurer or broker. We link to partner insurers and may earn a commission. Cover, eligibility, exclusions and terms are set by each provider." },
];

export default function InsuranceHub() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-uj pb-14 pt-6 sm:pb-20 sm:pt-8">
          <div className="[&_a]:text-paper/80 [&_span]:text-paper/60">
            <Breadcrumbs items={[{ name: "Travel Insurance", href: "/insurance" }]} />
          </div>
          <div className="mt-10 max-w-3xl">
            <p className="text-sm text-paper/70">
              Partners: World Nomads and Genki. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>
            </p>
            <p className="label-mono mt-8 text-[#ffb59e]">Uncle Jetlag Travel Insurance</p>
            <h1 className="mt-4 text-[clamp(2.4rem,1.4rem+4.4vw,4.8rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">
              The one travel document you hope you never use.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">
              What travel insurance usually covers, what it doesn&apos;t, and the places that won&apos;t let you in without it. Read the fine print
              before you need it, not in a hospital waiting room.
            </p>
            <a href="#partners" className="mt-7 inline-flex h-11 items-center rounded-full bg-white px-5 font-semibold text-[#101c30] hover:bg-white/90">Compare our insurance partners</a>
            <p className="mt-6 text-sm text-paper/55">Last reviewed {formatDate(REVIEWED)}</p>
          </div>
        </div>
      </section>

      <div className="container-uj mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="label-mono text-muted">On this page</p>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="block rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line hover:bg-sand lg:rounded-lg lg:bg-transparent lg:px-2 lg:ring-0">{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-[48rem] space-y-16 text-[1.05rem] leading-relaxed text-ink-2">
          <section id="why" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Shield className="h-7 w-7 text-jet" /> Why it matters</h2>
            <p className="mt-4">
              Your medical aid or home health cover may not pay abroad, or may pay only part of the bill. Emergency treatment, a hospital stay or a
              medical flight home can cost far more than the whole trip. Travel insurance is how most people turn that risk into a known, small cost.
            </p>
            <p className="mt-4">For some trips it isn&apos;t optional at all. <a href="#required" className="text-sky underline">See where it&apos;s required</a>.</p>
          </section>

          <section id="covers" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">What a policy usually covers</h2>
            <p className="mt-4">Every policy is different, but the UK government&apos;s guidance says to check that yours covers:</p>
            <ul className="mt-4 space-y-2">
              {[
                "The full length of your trip",
                "Hospital and medical treatment",
                "Emergency transport and repatriation (getting you home)",
                "The activities you plan to do",
                "Every country you visit, including transit stops",
              ].map((i) => (
                <li key={i} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-palm" /><span>{i}</span></li>
              ))}
            </ul>
            <p className="mt-4">Many policies also cover cancellation, delays, and lost or stolen belongings. Check the limit and the excess for each section.</p>
          </section>

          <section id="exclusions" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Alert className="h-7 w-7 text-jet" /> Common exclusions</h2>
            <p className="mt-4">Claims are most often refused for things people didn&apos;t realise were excluded. Common ones, according to UK and Australian government guidance:</p>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">Alcohol or drugs.</strong> Incidents after drinking heavily or taking drugs.</li>
              <li><strong className="text-ink">Risky activities</strong> such as bungee jumping, skydiving, winter sports, off-piste skiing, or riding mopeds and quad bikes, unless you add them.</li>
              <li><strong className="text-ink">Travel against government advice.</strong> Going somewhere your government advises against can invalidate cover.</li>
              <li><strong className="text-ink">Unattended belongings.</strong> Bags left alone, or valuables left in a car.</li>
              <li><strong className="text-ink">Undeclared medical conditions.</strong> See below.</li>
            </ul>
          </section>

          <section id="conditions" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Declaring medical conditions</h2>
            <p className="mt-4">
              Declare every existing medical condition, and any tests or treatment you&apos;re waiting for. UK government guidance warns that
              failing to declare something <strong className="text-ink">may invalidate your insurance</strong>.
            </p>
            <p className="mt-4">
              A &ldquo;pre-existing condition&rdquo; is usually anything you&apos;ve seen a doctor about or been treated for recently, often in the
              last two years. Insurers&apos; definitions differ, so if you&apos;re unsure, ask before you buy, not after you claim.
            </p>
          </section>

          <section id="required" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Passport className="h-7 w-7 text-jet" /> Where insurance is required</h2>
            <p className="mt-4">These destinations require proof of insurance, checked on {formatDate(REVIEWED)}. Rules change, so confirm on the official source before you travel.</p>
            <div className="mt-5 space-y-3">
              {required.map((r) => (
                <div key={r.place} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                  <p className="font-semibold text-ink">{r.place}</p>
                  <p className="mt-1 text-[0.98rem]">{r.rule}</p>
                  <a href={r.href} target="_blank" rel="noopener" className="mt-2 inline-block text-sm text-sky underline">Source: {r.source}</a>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[0.95rem]">More detail: <Link href="/guides/tanzania-mandatory-inbound-travel-insurance" className="text-sky underline">Tanzania&apos;s mandatory inbound insurance</Link> and our <Link href="/destinations/georgia" className="text-sky underline">Georgia guide</Link>.</p>
          </section>

          <section id="choose" className="scroll-mt-28 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
            <h2 className="flex items-center gap-3 text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold text-ink"><ListCheck className="h-7 w-7 text-jet" /> How to compare policies</h2>
            <ul className="mt-4 space-y-2">
              {[
                "Medical cover meets any entry requirement (for example €30,000 for a Schengen visa)",
                "Every country on your route, including transit stops, is covered",
                "Emergency evacuation and repatriation are included",
                "Your planned activities are covered, or can be added",
                "You're eligible from your country of residence",
                "You've declared all medical conditions",
                "You know the excess and the claim limits for each section",
                "You've saved the policy number and 24-hour emergency line offline",
              ].map((i) => (
                <li key={i} className="flex gap-3"><input type="checkbox" className="mt-1.5 h-4 w-4 accent-[var(--color-jet,#cf3d17)]" aria-label={i} /><span>{i}</span></li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">Building your trip list? <Link href="/tools/before-you-fly" className="font-semibold text-sky underline">Use the Before You Fly checklist</Link>.</p>
          </section>
        </article>
      </div>

      <div id="partners" className="scroll-mt-24">
        <TravelInsuranceSection className="mt-20" />
      </div>

      <div className="container-uj mt-16">
        <section id="faq" aria-labelledby="ins-faq" className="max-w-[48rem] scroll-mt-28 lg:ml-[calc(14rem+3rem)]">
          <h2 id="ins-faq" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Questions</h2>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">{f.q}</summary>
                <p className="px-5 pb-5 text-[0.98rem] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            General information, not insurance advice. Uncle Jetlag is not an insurer or broker. World Nomads and Genki are affiliate partners;
            see our <Link href="/affiliate-disclosure" className="underline">affiliate disclosure</Link>.
          </p>
        </section>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
