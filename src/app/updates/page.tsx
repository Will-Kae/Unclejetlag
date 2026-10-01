import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getUpdates } from "@/lib/content";
import { sections } from "@/data/taxonomy";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Latest Travel Rule Changes & Updates",
    description:
      "Dated, sourced updates on changes that affect travellers: border and visa rules, cash and currency limits, fees and new requirements. Every update links to an official source.",
    path: "/updates",
    ogKicker: "Updates",
  }),
  alternates: { canonical: "/updates", types: { "application/rss+xml": "/updates/rss.xml" } },
};

export default function UpdatesPage() {
  const updates = getUpdates();
  return (
    <section className="container-uj pb-10 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ name: "Updates", href: "/updates" }]} />
      <header className="mt-10 max-w-3xl">
        <p className="label-mono text-jet-ink">Updates</p>
        <h1 className="mt-3 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02]">What changed for travellers</h1>
        <p className="mt-4 text-lg text-muted">
          Short, dated updates on rules, limits and fees that affect your trip. Each one links to at least one official source, and we only
          post when something has actually changed. <Link href="/updates/rss.xml" className="font-semibold text-sky underline">RSS feed</Link>
        </p>
      </header>

      <ol className="mt-12 max-w-3xl divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {updates.length === 0 && <li className="p-6 text-muted">No updates yet.</li>}
        {updates.map((u) => (
          <li key={u.slug} className="group relative p-5 sm:p-6 hover:bg-paper">
            <p className="label-mono text-jet-ink !text-[0.66rem]">
              {sections[u.category].label}
              <span className="mx-2 text-ink/20">•</span>
              <time dateTime={u.publishedDate}>{formatDate(u.publishedDate)}</time>
              {u.effectiveDate && (
                <>
                  <span className="mx-2 text-ink/20">•</span>
                  Effective <time dateTime={u.effectiveDate}>{formatDate(u.effectiveDate)}</time>
                </>
              )}
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
              <Link href={u.url} className="after:absolute after:inset-0 group-hover:text-jet-ink">
                {u.title}
              </Link>
            </h2>
            <p className="mt-2 text-ink-2">{u.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
