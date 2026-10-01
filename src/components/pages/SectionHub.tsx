import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { ConverterCTA } from "@/components/tools/ConverterCTA";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { JsonLd } from "@/components/ui/JsonLd";
import { sections, type SectionKey } from "@/data/taxonomy";
import { getArticlesBySection, getArticlesByTopic, toSummary } from "@/lib/content";
import { collectionLd } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = { section: Exclude<SectionKey, "visas">; topic?: string };

export function SectionHub({ section, topic }: Props) {
  const s = sections[section];
  const t = topic ? s.topics.find((x) => x.slug === topic) : undefined;
  const list = (t ? getArticlesByTopic(section, t.slug) : getArticlesBySection(section)).map(toSummary);
  const [lead, ...rest] = list;
  const counts = Object.fromEntries(s.topics.map((x) => [x.slug, getArticlesByTopic(section, x.slug).length]));
  const url = t ? routes.topic(section, t.slug) : s.path;
  // QeFX converter sits above the articles on the Money Abroad hub and every Money Abroad topic page.
  const showConverter = section === "money";

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-sand/70 to-paper">
        <div className="container-uj pb-12 pt-6 sm:pt-8">
          <Breadcrumbs items={t ? [{ name: s.label, href: s.path }, { name: t.label, href: url }] : [{ name: s.label, href: s.path }]} />
          <div className="mt-10 max-w-3xl animate-rise">
            <p className="label-mono text-jet-ink">{t ? s.label : s.kicker}</p>
            <h1 className="mt-3 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02] text-balance">{t ? t.label : s.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t ? `${t.description} ${s.description}` : s.description}</p>
          </div>
          <nav aria-label={`${s.label} topics`} className="scrollbar-none -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={s.path} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-line", !t ? "bg-ink text-paper" : "bg-white hover:bg-sand")} aria-current={!t ? "page" : undefined}>
              All
            </Link>
            {s.topics.map((x) => (
              <Link
                key={x.slug}
                href={routes.topic(section, x.slug)}
                aria-current={t?.slug === x.slug ? "page" : undefined}
                className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-line", t?.slug === x.slug ? "bg-ink text-paper" : "bg-white hover:bg-sand")}
              >
                {x.label}
                {counts[x.slug] > 0 && <span className="ml-1.5 font-mono text-xs opacity-60">{counts[x.slug]}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {showConverter && (
        <div className="container-uj mt-10">
          <ConverterCTA feature />
        </div>
      )}

      <section className="container-uj mt-12" aria-label="Articles">
        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/20 p-10 text-center">
            <p className="font-display text-2xl font-semibold">Guides for this topic are being researched.</p>
            <p className="mx-auto mt-2 max-w-md text-muted">Uncle Jetlag doesn&apos;t publish until the fine print has been read. Join the list to hear when it lands.</p>
            <Link href={s.path} className="mt-5 inline-block font-semibold text-sky underline">Browse all {s.label}</Link>
          </div>
        ) : (
          <>
            {lead && <ArticleCard a={lead} variant="feature" priority headingLevel="h2" />}
            {rest.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => <ArticleCard key={a.url} a={a} headingLevel="h2" />)}
              </div>
            )}
          </>
        )}
      </section>

      <div className="mt-24"><NewsletterSection source={`hub-${section}`} /></div>
      <JsonLd data={collectionLd(t ? `${t.label} | ${s.label}` : s.label, t?.description ?? s.description, url, list.map((a) => ({ name: a.title, url: a.url })))} />
    </>
  );
}
