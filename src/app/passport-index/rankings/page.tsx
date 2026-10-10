import Link from "next/link";
import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { CoverageBar, PI, SubNav, h2, profileHref } from "@/components/passport/shared";
import { currentMethodology, flagOf, jurisdictions, rankingStatus, scorePassport } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Global Passport Rankings: Publication Status",
  description: "The Uncle Jetlag Global Mobility Ranking is published only when enough passports are verified on official sources. See progress towards the first ranking.",
  path: `${PI}/rankings`,
  ogKicker: "World Passport Index",
});

export default function RankingsPage() {
  const status = rankingStatus();
  const progress = jurisdictions.map((j) => ({ j, s: scorePassport(j.code) })).filter((x) => x.s.verified > 0).sort((a, b) => a.j.name.localeCompare(b.j.name));
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Rankings", href: `${PI}/rankings` }]} kicker="World Passport Index" title="Global passport rankings" intro="Our ranking isn't live yet. Publishing a worldwide ranking from partial data would make passports look weaker or stronger than they are, so we wait until the evidence is there." />
      <SubNav current={`${PI}/rankings`} />
      <div className="container-uj mt-12 max-w-[56rem] space-y-12 text-[1.05rem] leading-relaxed text-ink-2">
        <section aria-labelledby="when">
          <h2 id="when" className={h2}>When will the ranking go live?</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>A passport gets a score once <strong className="text-ink">{currentMethodology.passportCoverageThreshold * 100}%</strong> of its {jurisdictions.length - 1} destinations are verified on official sources.</li>
            <li>The worldwide ranking is published when <strong className="text-ink">{status.required} of {status.totalPassports}</strong> passports have a score. Scored today: <strong className="text-ink">{status.scoredPassports}</strong>.</li>
            <li>Ties will share a rank (1, 1, 3), and every ranking will show its date, dataset version and methodology version.</li>
          </ul>
          <p className="mt-4">Read the <Link href={`${PI}/methodology`} className="text-sky underline">methodology</Link>.</p>
        </section>
        <section aria-labelledby="progress">
          <h2 id="progress" className={h2}>Verification progress</h2>
          <p className="mt-3">Listed alphabetically. This is coverage, not a ranking.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {progress.map(({ j, s }) => (
              <li key={j.code} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                <Link href={profileHref(j.slug)} className="font-semibold text-ink hover:underline">{flagOf(j.code)} {j.name}</Link>
                <div className="mt-2"><CoverageBar value={s.coverage} label={`${s.verified} of ${s.universe} verified`} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
