import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Clock } from "@/components/ui/icons";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";
import { ShareBar } from "./ShareBar";
import { AuthorBox, AuthorAvatar } from "./AuthorBox";
import { FaqSection } from "./FaqSection";
import { SourcesList } from "./SourcesList";
import { ContentStatusBanner, UpdatedStamp } from "./ContentStatus";
import { AffiliateDisclosure } from "@/components/mdx/Affiliate";
import { AdSlot } from "@/components/monetization/AdSlot";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import type { ArticleSummary, Heading } from "@/lib/content";
import type { Faq, Source } from "@/lib/content/schema";
import type { Author } from "@/data/authors";
import type { Crumb } from "@/lib/seo";
import { SITE_URL } from "@/data/site";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/utils";

export type ArticleShellProps = {
  crumbs: Crumb[];
  kicker: { label: string; href: string; tone?: Tone };
  title: string;
  description: string;
  author: Author;
  publishedDate: string;
  updatedDate: string;
  verifiedDate?: string;
  readingTime: number;
  cover: { seed: string; code?: string; src?: string; alt: string; palette?: [string, string]; credit?: string };
  headings: Heading[];
  children: React.ReactNode;
  faqs?: Faq[];
  sources?: Source[];
  sourcesTitle?: string;
  contentStatus: "verified" | "review" | "demo";
  hasAffiliateLinks?: boolean;
  url: string;
  beforeBody?: React.ReactNode;
  afterBody?: React.ReactNode;
  related?: ArticleSummary[];
  relatedTitle?: string;
};

export function ArticleShell(p: ArticleShellProps) {
  const absolute = `${SITE_URL}${p.url}`;
  return (
    <>
      <ReadingProgress />
      <article className="pb-6">
        <div className="container-uj pt-6 sm:pt-8">
          <Breadcrumbs items={p.crumbs} />

          <header className="mt-6 max-w-4xl animate-rise sm:mt-10">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={p.kicker.href}><Badge tone={p.kicker.tone ?? "jet"}>{p.kicker.label}</Badge></Link>
              {p.contentStatus === "demo" && <Badge tone="amber">Demo content</Badge>}
            </div>
            <h1 className="mt-4 text-[clamp(2.1rem,1.4rem+3vw,3.7rem)] font-semibold leading-[1.04] text-ink text-balance">{p.title}</h1>
            <p className="mt-5 max-w-3xl text-[clamp(1.1rem,1rem+0.4vw,1.3rem)] leading-relaxed text-muted">{p.description}</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <AuthorAvatar className="h-10 w-10" />
                <div className="text-sm leading-tight">
                  <p>By <Link href={routes.author(p.author.slug)} rel="author" className="font-semibold text-ink hover:text-jet-ink">{p.author.name}</Link></p>
                  <p className="mt-0.5 text-muted">
                    Published <time dateTime={p.publishedDate}>{formatDate(p.publishedDate)}</time>
                    <span aria-hidden="true"> · </span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.readingTime} min read</span>
                  </p>
                </div>
              </div>
              <UpdatedStamp date={p.updatedDate} verifiedDate={p.verifiedDate} />
            </div>
          </header>

          <figure className="mt-8 sm:mt-10">
            <CoverArt {...p.cover} size="lg" priority className="aspect-[16/9] w-full rounded-[1.75rem] sm:aspect-[21/9] lg:aspect-[3/1]" sizes="(min-width: 1280px) 1216px, 100vw" />
            {p.cover.credit && (
              <figcaption className="mt-2 text-xs text-muted">
                {p.cover.credit} ·{" "}
                <Link href="/photo-credits" className="underline hover:text-ink">
                  Photo credits
                </Link>
              </figcaption>
            )}
          </figure>
        </div>

        <div className="container-uj mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18.5rem] xl:gap-16">
          <div className="min-w-0">
            <div className="max-w-[44rem] space-y-3">
              <ContentStatusBanner status={p.contentStatus} />
              {p.hasAffiliateLinks && <AffiliateDisclosure compact />}
              <TableOfContents headings={p.headings} collapsible />
            </div>

            {p.beforeBody}

            <div id="article-body" className="prose-uj mt-8">
              {p.children}
            </div>

            <div className="max-w-[44rem]">
              {p.afterBody}
              <AdSlot position="end-of-article" />
              <FaqSection faqs={p.faqs ?? []} />
              <SourcesList sources={p.sources ?? []} title={p.sourcesTitle} />
              <div className="perforation my-10" />
              <ShareBar url={absolute} title={p.title} />
              <AuthorBox author={p.author} />
            </div>
          </div>

          <aside className="hidden lg:block" aria-label="Article sidebar">
            <div className="sticky top-24 space-y-8">
              <TableOfContents headings={p.headings} />
              <div className="rounded-2xl bg-ink p-5 text-paper">
                <p className="font-display text-lg font-semibold leading-snug">Don&apos;t get caught at the border.</p>
                <p className="mt-1.5 text-sm text-paper/70">Visa changes and money tips, straight to your inbox.</p>
                <NewsletterForm source="article-sidebar" tone="dark" stacked className="mt-4" />
              </div>
              <AdSlot position="sidebar" className="!my-0" />
            </div>
          </aside>
        </div>
      </article>

      {p.related && p.related.length > 0 && (
        <section aria-labelledby="related" className="container-uj mt-12">
          <h2 id="related" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">{p.relatedTitle ?? "Keep reading"}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {p.related.map((a) => <ArticleCard key={a.url} a={a} />)}
          </div>
        </section>
      )}
    </>
  );
}
