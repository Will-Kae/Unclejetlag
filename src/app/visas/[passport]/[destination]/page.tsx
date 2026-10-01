import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleShell } from "@/components/article/ArticleShell";
import { VisaSummary } from "@/components/visas/VisaSummary";
import { JsonLd } from "@/components/ui/JsonLd";
import { MdxContent } from "@/lib/content/mdx";
import { getAllVisaBriefs, getVisaBrief, getArticlesForCountry, getArticlesBySection, isIndexable, toSummary } from "@/lib/content";
import { getAuthor } from "@/data/authors";
import { getCountry, getRegion } from "@/data/countries";
import { articleLd, buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllVisaBriefs().map((v) => ({ passport: v.passport, destination: v.destination }));
}

export async function generateMetadata({ params }: PageProps<"/visas/[passport]/[destination]">): Promise<Metadata> {
  const { passport, destination } = await params;
  const v = getVisaBrief(passport, destination);
  if (!v) return {};
  return buildMetadata({
    title: v.seoTitle ?? v.title,
    description: v.seoDescription ?? v.description,
    path: v.url,
    type: "article",
    ogKicker: `${v.passportName} passport → ${v.destinationName}`,
    publishedTime: v.publishedDate,
    modifiedTime: v.updatedDate,
    tags: v.tags,
    noindex: !isIndexable(v),
  });
}

export default async function VisaBriefPage({ params }: PageProps<"/visas/[passport]/[destination]">) {
  const { passport, destination } = await params;
  const v = getVisaBrief(passport, destination);
  if (!v) notFound();
  const author = getAuthor(v.author);
  const dest = getCountry(v.destination)!;
  const pass = getCountry(v.passport)!;
  const related = [...getArticlesForCountry(v.destination, 2), ...getArticlesBySection("visas")].filter((a, i, arr) => arr.indexOf(a) === i).slice(0, 3);

  return (
    <>
      <ArticleShell
        crumbs={[
          { name: "Visas & Passports", href: routes.visas() },
          { name: `${v.passportName} passport`, href: routes.visaPassport(v.passport) },
          { name: v.destinationName, href: v.url },
        ]}
        kicker={{ label: `Visa brief · ${pass.iso2} → ${dest.iso2}`, href: routes.visaPassport(v.passport), tone: "amber" }}
        title={v.title}
        description={v.description}
        author={author}
        publishedDate={v.publishedDate}
        updatedDate={v.updatedDate}
        verifiedDate={v.verifiedDate}
        readingTime={v.readingTime}
        cover={{ seed: `${v.passport}-${v.destination}`, code: `${pass.iso2}→${dest.iso2}`, src: v.featuredImage?.src, alt: v.featuredImage?.alt ?? `${v.passportName} passport holders travelling to ${v.destinationName}`, credit: v.featuredImage?.credit, palette: getRegion(dest.region)?.hue }}
        headings={v.headings}
        faqs={v.faqs}
        sources={[...v.officialResources, ...v.sources]}
        sourcesTitle="Official sources & references"
        contentStatus={v.contentStatus}
        url={v.url}
        beforeBody={<VisaSummary v={v} />}
        related={related.map(toSummary)}
        relatedTitle={`Before you go to ${v.destinationName}`}
      >
        <MdxContent source={v.body} />
      </ArticleShell>
      <JsonLd data={articleLd({ title: v.title, description: v.description, url: v.url, publishedDate: v.publishedDate, updatedDate: v.updatedDate, author, section: "Visas & Passports", tags: v.tags })} />
    </>
  );
}
