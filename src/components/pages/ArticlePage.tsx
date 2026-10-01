import { ConverterCTA } from "@/components/tools/ConverterCTA";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleShell } from "@/components/article/ArticleShell";
import { JsonLd } from "@/components/ui/JsonLd";
import { MdxContent } from "@/lib/content/mdx";
import { getArticle, getArticlesBySection, getRelatedArticles, isIndexable, toSummary, type Article } from "@/lib/content";
import { sections, type SectionKey } from "@/data/taxonomy";
import { getAuthor } from "@/data/authors";
import { articleLd, buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

const tones = { money: "jet", "travel-tech": "sky", guides: "palm", visas: "amber" } as const;
const codes = { money: "FX", "travel-tech": "SIM", guides: "UJ", visas: "VISA" } as const;

export function articleStaticParams(section: SectionKey) {
  return getArticlesBySection(section).map((a) => ({ slug: a.slug }));
}

export function articleMetadata(section: SectionKey, slug: string): Metadata {
  const a = getArticle(section, slug);
  if (!a) return {};
  return buildMetadata({
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.description,
    path: a.url,
    type: "article",
    ogKicker: sections[section].label,
    image: a.featuredImage?.src,
    publishedTime: a.publishedDate,
    modifiedTime: a.updatedDate,
    authors: [getAuthor(a.author).name],
    tags: a.tags,
    noindex: !isIndexable(a),
  });
}

function topicCrumb(a: Article) {
  const s = sections[a.category];
  const t = s.topics.find((x) => x.slug === a.subcategory);
  return t && a.category !== "visas" ? [{ name: t.label, href: routes.topic(a.category, t.slug) }] : [];
}

export async function ArticlePage({ section, slug }: { section: SectionKey; slug: string }) {
  const a = getArticle(section, slug);
  if (!a) notFound();
  const s = sections[section];
  const author = getAuthor(a.author);
  const related = getRelatedArticles(a, 3).map(toSummary);
  const topic = s.topics.find((x) => x.slug === a.subcategory);

  return (
    <>
      <ArticleShell
        crumbs={[{ name: s.label, href: s.path }, ...topicCrumb(a), { name: a.title, href: a.url }]}
        kicker={
          a.kind === "update"
            ? { label: a.effectiveDate ? `Update · effective ${formatDate(a.effectiveDate)}` : "Update", href: "/updates", tone: tones[section] }
            : { label: topic?.label ?? s.label, href: topic && section !== "visas" ? routes.topic(section, topic.slug) : s.path, tone: tones[section] }
        }
        title={a.title}
        description={a.description}
        author={author}
        publishedDate={a.publishedDate}
        updatedDate={a.updatedDate}
        readingTime={a.readingTime}
        cover={{ seed: a.slug, code: codes[section], src: a.featuredImage?.src, alt: a.featuredImage?.alt ?? a.title, credit: a.featuredImage?.credit }}
        headings={a.headings}
        faqs={a.faqs}
        sources={a.sources}
        contentStatus={a.contentStatus}
        hasAffiliateLinks={a.hasAffiliateLinks}
        url={a.url}
        related={related}
        beforeBody={section === "money" ? <ConverterCTA strip className="mt-6 max-w-[44rem]" /> : undefined}
        afterBody={section === "money" ? <ConverterCTA className="mt-10" /> : undefined}
      >
        <MdxContent source={a.body} />
      </ArticleShell>
      <JsonLd
        data={articleLd({
          title: a.title,
          description: a.description,
          url: a.url,
          publishedDate: a.publishedDate,
          updatedDate: a.updatedDate,
          author,
          image: a.featuredImage?.src,
          section: s.label,
          tags: a.tags,
        })}
      />
    </>
  );
}
