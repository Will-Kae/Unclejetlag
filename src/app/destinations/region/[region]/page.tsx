import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CountryCard } from "@/components/cards/CountryCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { regions, getRegion, countriesInRegion } from "@/data/countries";
import { getAllDestinations } from "@/lib/content";
import { buildMetadata, collectionLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return regions.map((r) => ({ region: r.key }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/region/[region]">): Promise<Metadata> {
  const r = getRegion((await params).region);
  if (!r) return {};
  const hasGuides = getAllDestinations().some((d) => d.region === r.key);
  return buildMetadata({
    title: `${r.label} travel guides`,
    description: `${r.blurb} Practical Uncle Jetlag guides to visas, money, connectivity and costs across ${r.label}.`,
    path: routes.region(r.key),
    ogKicker: "Destinations",
    noindex: !hasGuides,
  });
}

export default async function RegionPage({ params }: PageProps<"/destinations/region/[region]">) {
  const r = getRegion((await params).region);
  if (!r) notFound();
  const guides = new Map(getAllDestinations().filter((d) => d.region === r.key).map((d) => [d.country, d]));
  const list = countriesInRegion(r.key).sort((a, b) => Number(guides.has(b.slug)) - Number(guides.has(a.slug)));

  return (
    <>
      <section className="text-white" style={{ background: `linear-gradient(120deg, ${r.hue[0]}, ${r.hue[1]})` }}>
        <div className="container-uj pb-14 pt-6 sm:pt-8 [&_nav_*]:!text-white/85">
          <Breadcrumbs items={[{ name: "Destinations", href: routes.destinations() }, { name: r.label, href: routes.region(r.key) }]} />
          <p className="label-mono mt-10 text-white/80">Region</p>
          <h1 className="mt-2 text-[clamp(2.6rem,1.5rem+4vw,4.5rem)] font-semibold leading-none">{r.label}</h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">{r.blurb}</p>
        </div>
      </section>
      <section className="container-uj mt-12" aria-labelledby="region-countries">
        <h2 id="region-countries" className="sr-only">{r.label} countries</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => {
            const g = guides.get(c.slug);
            return (
              <CountryCard
                key={c.slug}
                name={c.name}
                href={g ? g.url : routes.search(c.name)}
                iso2={c.iso2}
                region={c.region}
                meta={g ? `${g.currency.code} · Full guide` : undefined}
                comingSoon={!g}
                updatedDate={g?.updatedDate}
                src={g?.featuredImage?.src}
              />
            );
          })}
        </div>
      </section>
      <JsonLd data={collectionLd(`${r.label} travel guides`, r.blurb, routes.region(r.key), [...guides.values()].map((d) => ({ name: d.title, url: d.url })))} />
    </>
  );
}
