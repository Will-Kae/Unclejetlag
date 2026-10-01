import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { AuthorAvatar } from "@/components/article/AuthorBox";
import { JsonLd } from "@/components/ui/JsonLd";
import { authors } from "@/data/authors";
import { getAllArticles, toSummary } from "@/lib/content";
import { buildMetadata, personLd } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(authors).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/authors/[slug]">): Promise<Metadata> {
  const a = authors[(await params).slug];
  if (!a) return {};
  const title = a.legalName ? `${a.legalName} (${a.name}): Founder of Uncle Jetlag` : `${a.name}, author profile`;
  return buildMetadata({ title, description: a.shortBio, path: routes.author(a.slug), ogKicker: "Founder & editor" });
}

export default async function AuthorPage({ params }: PageProps<"/authors/[slug]">) {
  const a = authors[(await params).slug];
  if (!a) notFound();
  const posts = getAllArticles().filter((p) => p.author === a.slug).map(toSummary);
  return (
    <>
      <section className="container-uj pt-6 sm:pt-8">
        <Breadcrumbs items={[{ name: "Authors", href: "/about" }, { name: a.legalName ?? a.name, href: routes.author(a.slug) }]} />
        <div className="mt-10 grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
          <AuthorAvatar className="h-28 w-28" />
          <div className="max-w-2xl">
            <p className="label-mono text-jet-ink">{a.role}</p>
            <h1 className="mt-2 text-[clamp(2.4rem,1.6rem+3vw,3.8rem)] font-semibold leading-none">{a.legalName ?? a.name}</h1>
            {a.legalName && <p className="mt-3 font-display text-2xl italic text-jet-ink">better known as {a.name}</p>}
            {a.bio.map((b) => <p key={b} className="mt-4 text-lg leading-relaxed text-ink-2">{b}</p>)}
            <ul className="mt-6 flex flex-wrap gap-2">
              {a.expertise.map((e) => <li key={e} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line">{e}</li>)}
            </ul>
          </div>
        </div>
      </section>
      <section aria-labelledby="by-author" className="container-uj mt-16">
        <h2 id="by-author" className="text-3xl font-semibold">Latest from {a.name}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <ArticleCard key={p.url} a={p} />)}
        </div>
      </section>
      <JsonLd data={personLd(a)} />
    </>
  );
}
