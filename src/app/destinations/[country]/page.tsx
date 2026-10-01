import { ConverterCTA } from "@/components/tools/ConverterCTA";
import { EsimCTA } from "@/components/esim/EsimCTA";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleShell } from "@/components/article/ArticleShell";
import { DestinationFacts } from "@/components/pages/DestinationFacts";
import { JsonLd } from "@/components/ui/JsonLd";
import { MdxContent } from "@/lib/content/mdx";
import { getAllDestinations, getArticlesForCountry, getDestination, getVisaBriefsForDestination, isIndexable, toSummary, getTrendingArticles } from "@/lib/content";
import { getAuthor } from "@/data/authors";
import { getRegion } from "@/data/countries";
import { articleLd, buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { SITE_URL } from "@/data/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDestinations().map((d) => ({ country: d.country }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[country]">): Promise<Metadata> {
  const d = getDestination((await params).country);
  if (!d) return {};
  return buildMetadata({
    title: d.seoTitle ?? d.title,
    description: d.seoDescription ?? d.description,
    path: d.url,
    type: "article",
    ogKicker: `Destination · ${d.countryName}`,
    image: d.featuredImage?.src,
    publishedTime: d.publishedDate,
    modifiedTime: d.updatedDate,
    tags: d.tags,
    noindex: !isIndexable(d),
  });
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[country]">) {
  const d = getDestination((await params).country);
  if (!d) notFound();
  const region = getRegion(d.region)!;
  const author = getAuthor(d.author);
  const briefs = getVisaBriefsForDestination(d.country);
  const related = getArticlesForCountry(d.country, 3);
  const relatedFill = related.length >= 3 ? related : [...related, ...getTrendingArticles(6).filter((a) => !related.includes(a))].slice(0, 3);

  return (
    <>
      <ArticleShell
        crumbs={[{ name: "Destinations", href: routes.destinations() }, { name: region.label, href: routes.region(region.key) }, { name: d.countryName, href: d.url }]}
        kicker={{ label: `${region.label} · Destination guide`, href: routes.region(region.key), tone: "palm" }}
        title={d.title}
        description={d.description}
        author={author}
        publishedDate={d.publishedDate}
        updatedDate={d.updatedDate}
        readingTime={d.readingTime}
        cover={{ seed: d.countryName, code: d.iso2, src: d.featuredImage?.src, alt: d.featuredImage?.alt ?? `${d.countryName} travel guide`, palette: region.hue, credit: d.featuredImage?.credit }}
        headings={d.headings}
        faqs={d.faqs}
        sources={d.sources}
        contentStatus={d.contentStatus}
        hasAffiliateLinks={d.hasAffiliateLinks}
        url={d.url}
        beforeBody={<DestinationFacts d={d} briefs={briefs} />}
        afterBody={
          <>
            <EsimCTA place={d.countryName} destKey={d.country} className="mt-10" />
            <ConverterCTA currency={`${d.currency.name} (${d.currency.code})`} className="mt-6" />
          </>
        }
        related={relatedFill.map(toSummary)}
        relatedTitle={`More for your ${d.countryName} trip`}
      >
        <MdxContent source={d.body} />
      </ArticleShell>
      <JsonLd
        data={[
          articleLd({ title: d.title, description: d.description, url: d.url, publishedDate: d.publishedDate, updatedDate: d.updatedDate, author, image: d.featuredImage?.src, section: "Destinations", tags: d.tags }),
          { "@context": "https://schema.org", "@type": "Country", name: d.countryName, url: `${SITE_URL}${d.url}`, identifier: d.iso2 },
        ]}
      />
    </>
  );
}
