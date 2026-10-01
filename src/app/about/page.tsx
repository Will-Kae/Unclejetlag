import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { LogoMark } from "@/components/ui/Logo";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Uncle Jetlag",
  description: "International travel is more than cheap flights. Uncle Jetlag figures out the visas, money, banking, connectivity and local rules, and explains them simply.",
  path: "/about",
  ogKicker: "About",
});

const checklist = [
  ["Visas", "Can your passport get in, for how long, and what does the application actually involve?"],
  ["Money", "Which card works, what the exchange really costs, and when cash still wins."],
  ["Banking", "Whether you can open an account, receive money, or just avoid getting frozen out."],
  ["Connectivity", "eSIM or local SIM, what roaming costs, and which apps you need on day one."],
  ["Insurance", "What a policy covers, what it doesn't, and when you're required to have one."],
  ["Transport", "Getting from the airport to your bed without the tourist tax."],
  ["Local costs", "What a normal day costs at a budget, mid-range or comfortable pace."],
  ["Rules", "Customs, local laws and etiquette that are cheaper to learn before landing."],
];

export default function AboutPage() {
  return (
    <>
      <section className="container-uj pt-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "About", href: "/about" }]} />
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="animate-rise">
            <p className="label-mono text-jet-ink">About Uncle Jetlag</p>
            <h1 className="mt-4 text-[clamp(2.5rem,1.5rem+4.2vw,4.8rem)] font-semibold leading-[1] tracking-[-0.025em]">
              Cheap flights are the <span className="italic text-jet">easy</span> part.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted">
              International travel is everything that happens around the flight: the visa, the card that gets declined, the bank that won&apos;t talk to
              foreigners, the SIM that doesn&apos;t work, the taxi that costs triple. Uncle Jetlag exists to figure those things out and explain them simply.
            </p>
          </div>
          <div className="relative rounded-[2rem] bg-ink p-8 text-paper">
            <LogoMark className="h-24 w-24" />
            <blockquote className="mt-6 font-display text-2xl leading-snug">
              &ldquo;Every family has one relative who&apos;s been everywhere, made every mistake, and now tells you exactly what to do. That&apos;s the job.&rdquo;
            </blockquote>
            <p className="label-mono mt-6 text-paper/60">Willard Munyaradzi Kachere · Uncle Jetlag</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="what" className="container-uj mt-24">
        <h2 id="what" className="max-w-2xl text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] font-semibold leading-[1.1]">What travellers actually need to understand</h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-[1.75rem] bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
          {checklist.map(([t, b], i) => (
            <li key={t} className="bg-paper p-6">
              <span className="font-mono text-sm text-jet-ink">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 font-display text-xl font-semibold">{t}</p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="how" className="container-uj mt-24 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 id="how" className="text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] font-semibold leading-[1.1]">Personality, yes. Guesswork, no.</h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">
            Uncle Jetlag writes like a person, not a brochure. But the facts come from primary sources: government immigration portals, embassy
            pages, card-network and bank documentation, provider terms. Every guide shows when it was last updated, and anything we can&apos;t
            verify is labelled, never dressed up as certain.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            We pay particular attention to travellers who are usually an afterthought, especially African passport holders, for whom the answer
            to &ldquo;do I need a visa?&rdquo; is rarely a simple no.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/editorial-policy" variant="dark">Our editorial policy</ButtonLink>
            <ButtonLink href="/contact" variant="ghost">Get in touch</ButtonLink>
          </div>
        </div>
        <div className="space-y-4">
          {[
            ["What we are", "A travel-media and travel-intelligence publication: guides, explainers, comparisons and briefs."],
            ["What we're not", "A travel agency, visa agent, bank, lawyer or financial adviser. We don't process applications or sell visas."],
            ["How we make money", "Advertising and clearly disclosed affiliate links (currently Holafly, Saily, NordVPN, NordPass and Dukascopy). Partners never get to edit, approve or rank our recommendations."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <p className="font-semibold text-ink">{t}</p>
              <p className="mt-1.5 leading-relaxed text-muted">{b}</p>
            </div>
          ))}
          <div className="rounded-2xl bg-ink p-6 text-paper">
            <p className="label-mono text-paper/60">Who is Uncle Jetlag?</p>
            <p className="mt-2 leading-relaxed text-paper/85">
              Uncle Jetlag is the pen name of <strong className="text-paper">Willard Munyaradzi Kachere</strong>, the founder and editor of this
              publication. Every guide goes out under his name and to his standards.
            </p>
            <Link href="/authors/uncle-jetlag" className="mt-3 inline-block font-semibold text-[#ffb59e] underline">About Willard Munyaradzi Kachere</Link>
          </div>
        </div>
      </section>

      <div className="mt-24"><NewsletterSection source="about" /></div>
    </>
  );
}
