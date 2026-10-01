import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BeforeYouFly, type BYFData } from "@/components/tools/BeforeYouFly";
import { countries } from "@/data/countries";
import { esimDestinations } from "@/data/esim";
import { getAllArticles, getAllDestinations, getAllVisaBriefs } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Before You Fly: Travel Preparation Checklist",
  description:
    "Build a travel checklist for your destination, passport and trip length: passport, visa, insurance, eSIM, money, health, plugs, apps and emergency info, linked to official sources.",
  path: "/tools/before-you-fly",
  ogKicker: "Travel Tools",
});

const OFFICIAL = /gov|ministry|government|department|home affairs|immigration|consul|embassy|legislative|federal|official/i;

export default function BeforeYouFlyPage() {
  const articles = getAllArticles();
  const url = (slug: string) => articles.find((a) => a.slug === slug)?.url;
  const data: BYFData = {
    countries: [...countries].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ slug: c.slug, name: c.name })),
    guides: Object.fromEntries(
      getAllDestinations().map((d) => [
        d.country,
        {
          url: d.url,
          name: d.countryName,
          updated: d.updatedDate,
          currency: `${d.currency.name} (${d.currency.code})`,
          plugs: `Type ${d.plugTypes.join(", ")} · ${d.voltage}`,
          airports: d.airports.map((a) => `${a.name} (${a.code})`),
          emergency: d.emergency.map((e) => `${e.label}: ${e.number}`),
          official: d.sources.filter((s) => OFFICIAL.test(`${s.publisher ?? ""} ${s.url}`)).slice(0, 3).map((s) => ({ title: s.title, url: s.url })),
        },
      ]),
    ),
    briefs: Object.fromEntries(getAllVisaBriefs().map((v) => [`${v.passport}--${v.destination}`, { url: v.url, verified: v.verifiedDate ?? v.updatedDate, title: `${v.destinationName} for ${v.passportDemonym} passports` }])),
    esim: esimDestinations.map((e) => e.slug),
    links: {
      passport: url("passport-validity-six-month-rule"),
      apps: url("travel-apps-to-download-before-you-fly"),
      power: url("power-adapters-voltage-explained"),
      pay: url("best-ways-to-pay-while-traveling"),
      jetlag: url("how-to-beat-jet-lag"),
    },
  };

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-sand/70 to-paper">
        <div className="container-uj pb-12 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ name: "Travel Tools", href: "/tools" }, { name: "Before You Fly", href: "/tools/before-you-fly" }]} />
          <div className="mt-10 max-w-3xl">
            <p className="label-mono text-jet-ink">Travel Tools · Checklist</p>
            <h1 className="mt-3 text-[clamp(2.4rem,1.5rem+3.8vw,4.4rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">Before you fly</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Tell us where you&apos;re going and which passport you hold. We&apos;ll build the checklist, link our verified guides where we have them, and
              point you to official sources where we don&apos;t. We never guess immigration, health or legal requirements.
            </p>
          </div>
        </div>
      </section>
      <div className="container-uj mt-10">
        <BeforeYouFly data={data} />
      </div>
    </>
  );
}
