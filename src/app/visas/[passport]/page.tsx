import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { VisaDisclaimer } from "@/components/visas/VisaSummary";
import { Badge } from "@/components/ui/Badge";
import { getCountry } from "@/data/countries";
import { getVisaBriefsForPassport, passportsWithBriefs, isIndexable } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return passportsWithBriefs().map((passport) => ({ passport }));
}

export async function generateMetadata({ params }: PageProps<"/visas/[passport]">): Promise<Metadata> {
  const { passport } = await params;
  const c = getCountry(passport);
  if (!c) return {};
  return buildMetadata({
    title: `Travel with a ${c.name} passport: visa briefs`,
    description: `Entry requirements and visa briefs for ${c.demonym ?? c.name} passport holders, with links to official government sources.`,
    path: routes.visaPassport(passport),
    ogKicker: "Visas & Passports",
    noindex: !getVisaBriefsForPassport(passport).some(isIndexable),
  });
}

export default async function PassportPage({ params }: PageProps<"/visas/[passport]">) {
  const { passport } = await params;
  const c = getCountry(passport);
  if (!c) notFound();
  const briefs = getVisaBriefsForPassport(passport);
  return (
    <section className="container-uj pb-10 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ name: "Visas & Passports", href: "/visas" }, { name: `${c.name} passport`, href: routes.visaPassport(passport) }]} />
      <p className="label-mono mt-10 text-amber">Passport · {c.iso2}</p>
      <h1 className="mt-3 text-[clamp(2.2rem,1.5rem+3vw,3.6rem)] font-semibold leading-[1.04]">Travelling on a {c.name} passport</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">Destination briefs written for {c.demonym ?? c.name} passport holders. Each one links to the official source you should verify with.</p>
      <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {briefs.map((b) => (
          <li key={b.url}>
            <Link href={b.url} className="card-lift block h-full rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-line">
              <span className="flex justify-between"><span className="font-display text-xl font-semibold">{b.destinationName}</span>{b.contentStatus === "demo" && <Badge tone="amber">Demo</Badge>}</span>
              <span className="mt-2 block text-sm text-muted">{b.description}</span>
              <span className="mt-3 block text-xs text-muted">Updated {formatDate(b.updatedDate)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="max-w-3xl"><VisaDisclaimer /></div>
      <Link href="/visas#finder" className="font-semibold text-sky underline">Check another destination</Link>
    </section>
  );
}
