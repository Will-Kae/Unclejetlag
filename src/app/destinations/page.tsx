import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CountryCard } from "@/components/cards/CountryCard";
import { HeroSearch } from "@/components/search/HeroSearch";
import { JsonLd } from "@/components/ui/JsonLd";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { Arrow } from "@/components/ui/icons";
import { regions, countriesInRegion } from "@/data/countries";
import { getAllDestinations, destinationSlugs } from "@/lib/content";
import { buildMetadata, collectionLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata: Metadata = buildMetadata({
  title: "Destinations: country travel guides by region",
  description: "Practical country guides covering entry requirements, money, eSIMs, transport, costs, safety and customs, organised by region.",
  path: "/destinations",
  ogKicker: "Destinations",
});

export default function DestinationsPage() {
  const guides = getAllDestinations();
  const has = destinationSlugs();
  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-sand/70 to-paper">
        <div className="container-uj pb-14 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ name: "Destinations", href: "/destinations" }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="animate-rise">
              <p className="label-mono text-jet-ink">Destinations</p>
              <h1 className="mt-3 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02]">Understand the destination before you land.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                Every country guide answers the same practical questions: can I get in, how do I pay, how do I get online, what does it cost, and what should I know on arrival.
              </p>
            </div>
            <HeroSearch />
          </div>
        </div>
      </section>

      <section aria-labelledby="guides" className="container-uj mt-14">
        <h2 id="guides" className="text-3xl font-semibold">Full country guides</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {guides.map((d) => (
            <CountryCard key={d.country} name={d.countryName} href={d.url} iso2={d.iso2} region={d.region} meta={d.currency.code} updatedDate={d.updatedDate} src={d.featuredImage?.src} />
          ))}
        </div>
      </section>

      <section aria-labelledby="regions" className="container-uj mt-20">
        <h2 id="regions" className="text-3xl font-semibold">Browse by region</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {regions.map((r) => {
            const list = countriesInRegion(r.key);
            return (
              <div key={r.key} className="overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line">
                <div className="flex items-end justify-between p-5 text-white" style={{ background: `linear-gradient(120deg, ${r.hue[0]}, ${r.hue[1]})` }}>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">
                      <Link href={routes.region(r.key)} className="hover:underline">{r.label}</Link>
                    </h3>
                    <p className="mt-1 text-sm text-white/85">{r.blurb}</p>
                  </div>
                  <Link href={routes.region(r.key)} aria-label={`All ${r.label} destinations`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 hover:bg-white/35">
                    <Arrow className="h-5 w-5" />
                  </Link>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-2 p-5 text-[0.95rem]">
                  {list.map((c) => (
                    <li key={c.slug}>
                      {has.has(c.slug) ? (
                        <Link href={routes.destination(c.slug)} className="font-semibold text-ink underline decoration-jet decoration-2 underline-offset-4 hover:text-jet-ink">{c.name}</Link>
                      ) : (
                        <span className="text-muted">{c.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted">Underlined countries have a full guide. The rest are on the research list.</p>
      </section>

      <div className="mt-24"><NewsletterSection source="destinations" /></div>
      <JsonLd data={collectionLd("Destinations", "Country travel guides", "/destinations", guides.map((d) => ({ name: d.title, url: d.url })))} />
    </>
  );
}
