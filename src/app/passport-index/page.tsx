import Link from "next/link";
import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { PassportPicker } from "@/components/passport/PassportPicker";
import { CoverageBar, PI, SubNav, h2, profileHref } from "@/components/passport/shared";
import { JsonLd } from "@/components/ui/JsonLd";
import { currentMethodology, datasetStats, flagOf, getJurisdiction, jurisdictions, policyChanges, rankingStatus, SPRINT_1_PASSPORTS, scorePassport } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { SITE_URL } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Uncle Jetlag World Passport Index: How Far Can Your Passport Take You?",
  description: "An independent passport index built only from official government sources. See verified visa rules for your passport, compare passports and follow policy changes, starting with African passports.",
  path: PI,
  ogKicker: "World Passport Index",
});

export default function PassportIndexHome() {
  const stats = datasetStats();
  const status = rankingStatus();
  const options = jurisdictions.map((j) => ({ slug: j.slug, label: `${flagOf(j.code)} ${j.name}` }));
  const sprint = SPRINT_1_PASSPORTS.map((c) => ({ j: getJurisdiction(c)!, s: scorePassport(c) })).sort((a, b) => a.j.name.localeCompare(b.j.name));

  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "World Passport Index", href: PI }]}
        kicker="Uncle Jetlag World Passport Index"
        title="How Far Can Your Passport Take You?"
        intro="Discover the power of your passport. Check where it takes you, compare passports, and find visa-access information for destinations around the world, every rule checked against an official government source."
      >
        <div className="mt-8 max-w-3xl rounded-[var(--radius-card)] bg-paper p-4 text-ink sm:p-6">
          <PassportPicker options={options} />
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href={`${PI}/rankings`} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-line hover:bg-sand">View global rankings</Link>
            <Link href={`${PI}/compare`} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-line hover:bg-sand">Compare passports</Link>
            <Link href={`${PI}/africa`} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-line hover:bg-sand">African passports</Link>
          </div>
        </div>
      </ToolHero>
      <SubNav current={PI} />

      <div className="container-uj mt-12 space-y-16">
        <section aria-labelledby="status" className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 id="status" className={h2}>Where the index stands</h2>
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2">
              We&apos;re building this index rule by rule from destination governments&apos; own websites, embassies and legislation, and we show you the source for every one.
              That takes time, so we publish what&apos;s verified now and switch on worldwide rankings only when coverage is high enough to be fair.
            </p>
            <p className="mt-4 rounded-2xl bg-amber-soft/60 p-4 text-[0.95rem] text-ink-2">
              <strong className="text-ink">Worldwide rankings: not yet published.</strong> A passport is scored once 95% of its destinations are verified, and the ranking goes live when {status.required} of {status.totalPassports} passports are scored. Today: {status.scoredPassports}.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-2xl bg-line ring-1 ring-line">
            {[
              ["Verified passport–destination rules", stats.verifiedPairs.toLocaleString("en")],
              ["Passports covered so far", String(stats.passportsWithData)],
              ["Destinations with verified rules", String(stats.destinationsWithData)],
              ["Official sources cited", String(stats.sources)],
              ["Jurisdictions in scope", String(jurisdictions.length)],
              ["Last checked", formatDate(stats.lastChecked)],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-4">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="africa-first">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="africa-first" className={h2}>Africa first: our first 15 passports</h2>
            <Link href={`${PI}/africa`} className="text-sm font-semibold text-sky underline">African passport hub</Link>
          </div>
          <p className="mt-3 max-w-2xl text-ink-2">Our first research sprint covers Southern, East and West African passports. Bars show how much of each passport&apos;s 198 destinations is verified so far.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sprint.map(({ j, s }) => (
              <li key={j.code}>
                <Link href={profileHref(j.slug)} className="block rounded-2xl bg-white p-4 ring-1 ring-line transition hover:shadow-card">
                  <p className="font-semibold text-ink">{flagOf(j.code)} {j.name}</p>
                  <div className="mt-3"><CoverageBar value={s.coverage} label={`${s.verified} of ${s.universe} destinations verified`} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {policyChanges.length > 0 && (
          <section aria-labelledby="changes">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="changes" className={h2}>Latest verified changes</h2>
              <Link href={`${PI}/changes`} className="text-sm font-semibold text-sky underline">All changes</Link>
            </div>
            <ul className="mt-5 space-y-3">
              {policyChanges.slice(0, 3).map((c) => (
                <li key={c.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                  <p className="text-sm text-muted">Effective {formatDate(c.effective)}</p>
                  <p className="mt-1 font-semibold text-ink">{c.headline}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="how" className="grid gap-4 sm:grid-cols-3">
          <h2 id="how" className="sr-only">How the index works</h2>
          {[
            { t: "Official sources only", b: "Every rule links to the destination government, its embassy or the law itself. No copied indexes, no Wikipedia.", h: `${PI}/data-sources` },
            { t: "Unknown is not zero", b: "If we haven't verified a destination, we say so. It never quietly lowers a passport's score.", h: `${PI}/methodology` },
            { t: `Methodology v${currentMethodology.id}`, b: "Two measures: a simple Global Mobility count and a weighted Passport Power Score, both versioned.", h: `${PI}/methodology` },
          ].map((x) => (
            <Link key={x.t} href={x.h} className="rounded-2xl bg-white p-5 ring-1 ring-line transition hover:shadow-card">
              <p className="font-display text-lg font-semibold text-ink">{x.t}</p>
              <p className="mt-2 text-[0.95rem] text-ink-2">{x.b}</p>
            </Link>
          ))}
        </section>
      </div>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", name: "Uncle Jetlag World Passport Index: verified visa-access rules", description: "Visa-access rules for ordinary passports, each linked to an official government source and the date it was checked. Coverage is partial and growing.", url: `${SITE_URL}${PI}`, creator: { "@type": "Organization", name: "Uncle Jetlag" }, isAccessibleForFree: true, dateModified: stats.lastChecked, version: stats.datasetVersion }} />
    </>
  );
}
