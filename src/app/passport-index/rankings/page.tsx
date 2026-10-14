import Link from "next/link";
import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { CoverageBar, PI, SubNav, h2, profileHref } from "@/components/passport/shared";
import { currentMethodology, flagOf, jurisdictions, rankingStatus, scorePassport, ruleRecords, sources, DATASET } from "@/lib/passport";
import { buildCoverageReport } from "@/lib/passport/coverage";
import { passportReadiness } from "@/lib/passport/readiness";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Global Passport Rankings: Publication Status",
  description: "The Uncle Jetlag Global Mobility Ranking is published only when enough passports are verified on official sources. See progress towards the first ranking.",
  path: `${PI}/rankings`,
  ogKicker: "World Passport Index",
});

export default function RankingsPage() {
  const status = rankingStatus();
  const evidence = buildCoverageReport(ruleRecords, sources, DATASET);
  const readiness = passportReadiness(evidence, currentMethodology.passportCoverageThreshold);
  const needsReview = readiness.filter((p) => p.reviewDue > 0 || p.disputed > 0 || p.pending > 0);
  const topGaps = readiness.filter((p) => p.verified + p.reviewDue > 0).slice(0, 10);
  const jurisdictionByCode = new Map(jurisdictions.map((j) => [j.code, j]));
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
        <section aria-labelledby="readiness">
          <h2 id="readiness" className={h2}>Evidence readiness dashboard</h2>
          <p className="mt-3">An audit of official-source coverage, not a passport strength ranking. Unknown destinations mean evidence has not been verified, not that a visa is required. Dataset {DATASET.version}, evaluated {DATASET.asOf}.</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Verified pairs", evidence.totals.verified.toLocaleString()],
              ["Unknown pairs", evidence.totals.unknown.toLocaleString()],
              ["Passports ready to score", `${readiness.filter((p) => p.readyForScoring).length} / ${readiness.length}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-5 ring-1 ring-line"><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-2xl font-semibold text-ink">{value}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm">Coverage counts include evidence due for re-review, which is tracked separately. The published global ranking remains unavailable until the methodology's worldwide threshold is met.</p>
          <h3 className="mt-8 text-lg font-semibold text-ink">Closest to scoring threshold</h3>
          <p className="mt-2 text-sm">Ordered by fewest remaining verified destinations, not passport strength. Only passports with some existing evidence are shown.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-sand/60 text-ink"><tr><th scope="col" className="p-3">Passport</th><th scope="col" className="p-3">Verified / total</th><th scope="col" className="p-3">Still needed</th><th scope="col" className="p-3">Evidence status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {topGaps.map((p) => {
                  const j = jurisdictionByCode.get(p.code)!;
                  return <tr key={p.code}><td className="p-3"><Link href={profileHref(j.slug)} className="font-semibold text-sky underline">{flagOf(p.code)} {j.name}</Link></td><td className="p-3">{p.verified + p.reviewDue} / {p.universe}</td><td className="p-3">{p.remainingToThreshold}</td><td className="p-3">{p.disputed ? "Disputed evidence" : p.reviewDue ? "Review due" : p.pending ? "Pending checks" : "No flagged records"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">{needsReview.length} passports have records flagged as review-due, disputed or pending. No unknown destination is treated as a confirmed restriction.</p>
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
