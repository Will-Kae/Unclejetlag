import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { MdxContent } from "@/lib/content/mdx";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export function policyMetadata(slug: string): Metadata {
  const p = getPage(slug);
  if (!p) return {};
  return buildMetadata({ title: p.title, description: p.description, path: p.url, ogKicker: "Uncle Jetlag" });
}

export async function PolicyPage({ slug }: { slug: string }) {
  const p = getPage(slug);
  if (!p) notFound();
  return (
    <article className="container-uj pb-10 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ name: p.title, href: p.url }]} />
      <header className="mt-10 max-w-3xl">
        <h1 className="text-[clamp(2.2rem,1.5rem+3vw,3.4rem)] font-semibold leading-[1.05]">{p.title}</h1>
        <p className="mt-4 text-lg text-muted">{p.description}</p>
        <p className="label-mono mt-5 text-muted">Last updated <time dateTime={p.updatedDate}>{formatDate(p.updatedDate)}</time></p>
        {p.isTemplate && (
          <p role="note" className="mt-5 rounded-xl border border-dashed border-amber/50 bg-amber-soft px-4 py-3 text-sm text-ink-2">
            <strong className="text-amber">Template.</strong> This policy is a starting draft, not legal advice. Have it reviewed by a qualified
            lawyer for the jurisdictions you operate in and the tools you actually use before launch.
          </p>
        )}
      </header>
      <div className="prose-uj mt-10">
        <MdxContent source={p.body} ads={false} />
      </div>
    </article>
  );
}
