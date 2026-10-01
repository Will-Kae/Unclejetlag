import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { VisaFinder } from "@/components/visas/VisaFinder";
import { VisaDisclaimer } from "@/components/visas/VisaSummary";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { Badge } from "@/components/ui/Badge";
import { Arrow } from "@/components/ui/icons";
import { countries } from "@/data/countries";
import { sections } from "@/data/taxonomy";
import { getAllVisaBriefs, getArticlesBySection, destinationSlugs, passportsWithBriefs, toSummary } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/utils";

const s = sections.visas;
export const metadata: Metadata = buildMetadata({ title: "Visas & Passports: entry requirements by passport", description: s.description, path: "/visas", ogKicker: s.label });

export default function VisasPage() {
  const briefs = getAllVisaBriefs();
  const guides = getArticlesBySection("visas").map(toSummary);
  const opts = [...countries].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-amber-soft/70 to-paper">
        <div className="container-uj pb-14 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ name: s.label, href: "/visas" }]} />
          <div className="mt-10 max-w-3xl animate-rise">
            <p className="label-mono text-amber">{s.kicker}</p>
            <h1 className="mt-3 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02] text-balance">{s.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{s.description}</p>
          </div>
          <div id="finder" className="mt-10 scroll-mt-28 rounded-[1.75rem] bg-white p-5 shadow-card ring-1 ring-line sm:p-7">
            <p className="font-display text-xl font-semibold">Visa finder</p>
            <p className="mb-5 mt-1 text-sm text-muted">Pick your passport and destination. We&apos;ll take you to the brief, or tell you where to check officially.</p>
            <VisaFinder countries={opts} pairs={briefs.map((b) => `${b.passport}/${b.destination}`)} guides={[...destinationSlugs()]} />
          </div>
        </div>
      </section>

      <section aria-labelledby="briefs" className="container-uj mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="briefs" className="text-3xl font-semibold">Passport × destination briefs</h2>
          <p className="text-sm text-muted">Browse by passport: {passportsWithBriefs().map((p, i) => (
            <span key={p}>{i > 0 && " · "}<Link href={routes.visaPassport(p)} className="font-medium text-sky underline">{countries.find((c) => c.slug === p)?.name}</Link></span>
          ))}</p>
        </div>
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((b) => (
            <li key={b.url}>
              <Link href={b.url} className="card-lift flex h-full flex-col rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-line">
                <span className="flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-ink">
                    {countries.find((c) => c.slug === b.passport)?.iso2} <Arrow className="inline h-4 w-4 text-jet" /> {countries.find((c) => c.slug === b.destination)?.iso2}
                  </span>
                  {b.contentStatus === "demo" && <Badge tone="amber">Demo</Badge>}
                </span>
                <span className="mt-3 font-display text-lg font-semibold leading-snug text-ink">{b.destinationName} for {b.passportName} passport holders</span>
                <span className="mt-auto pt-4 text-sm text-muted">Updated {formatDate(b.updatedDate)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="guides" aria-labelledby="visa-guides" className="container-uj mt-16 scroll-mt-28">
        <h2 id="visa-guides" className="text-3xl font-semibold">Visa basics</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((a) => <ArticleCard key={a.url} a={a} />)}
        </div>
        <div className="max-w-3xl"><VisaDisclaimer /></div>
      </section>

      <div className="mt-20"><NewsletterSection source="visas" /></div>
    </>
  );
}
