import type { Metadata } from "next";
import Link from "next/link";
import { ToolHero } from "@/components/banking/ToolHero";
import { PI, SubNav, h2 } from "@/components/passport/shared";
import { DATASET, ruleRecords, sources } from "@/lib/passport";
import { buildCoverageReport } from "@/lib/passport/coverage";
import { buildReviewQueue } from "@/lib/passport/review-queue";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Passport Evidence Review Queue",
    description: "Evidence maintenance queue for the Uncle Jetlag World Passport Index.",
    path: `${PI}/evidence-review`,
    ogKicker: "World Passport Index",
  }),
  robots: { index: false, follow: false },
};

const kindLabels = {
  conflict: "Conflicting official evidence",
  "source-overdue": "Overdue source review",
  "source-upcoming": "Upcoming source review",
  "pending-pair": "Pending evidence verification",
};

export default function EvidenceReviewPage() {
  const report = buildCoverageReport(ruleRecords, sources, DATASET);
  const tasks = buildReviewQueue(report);
  const counts = {
    critical: tasks.filter((t) => t.priority === "critical").length,
    high: tasks.filter((t) => t.priority === "high").length,
    normal: tasks.filter((t) => t.priority === "normal").length,
  };
  return (
    <>
      <ToolHero
        crumbs={[{ name: "World Passport Index", href: PI }, { name: "Evidence review", href: `${PI}/evidence-review` }]}
        kicker={`Dataset ${DATASET.version} · ${DATASET.asOf}`}
        title="Evidence review queue"
        intro="Read-only verification worklist generated from the current dataset. It does not confirm visa access or change any published passport scores."
      />
      <SubNav current={`${PI}/evidence-review`} />
      <main className="container-uj mt-12 max-w-[60rem] space-y-10 pb-16 text-ink-2">
        <section aria-labelledby="review-overview">
          <h2 id="review-overview" className={h2}>Review priorities</h2>
          <p className="mt-3">As of {DATASET.asOf}. Source reviews are flagged when due within 30 days. This is a dataset snapshot, not a live monitoring service.</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            {([["Critical", counts.critical], ["High", counts.high], ["Normal", counts.normal]] as const).map(([label, count]) => (
              <div key={label} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <dt className="text-sm text-muted">{label} priority</dt>
                <dd className="mt-1 text-2xl font-semibold text-ink">{count}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="review-tasks">
          <h2 id="review-tasks" className={h2}>Open verification tasks</h2>
          <p className="mt-3">These tasks require manual review of official government or embassy evidence. Unknown destinations remain unknown until verified.</p>
          {tasks.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-line">No review tasks are due in this dataset snapshot.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <span>{task.priority} priority</span><span aria-hidden="true">·</span><span>{kindLabels[task.kind]}</span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{task.label}</p>
                  <p className="mt-1 text-sm">{task.dueOn ? `Review due: ${task.dueOn}` : "Manual verification required"}</p>
                  {task.sourceIds.length > 0 && (
                    <p className="mt-2 text-sm">Sources: {task.sourceIds.join(", ")}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-5 text-sm">For the published evidence trail, see <Link className="text-sky underline" href={`${PI}/data-sources`}>official data sources</Link>. This page is unindexed but not access-controlled; do not enter private review notes here.</p>
        </section>
      </main>
    </>
  );
}
