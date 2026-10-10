import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { PI, SubNav, h2 } from "@/components/passport/shared";
import { datasetStats, rules, sources } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Passport Index Data Sources: Every Official Source We Use",
  description: "The official government, embassy and legislative sources behind every rule in the Uncle Jetlag World Passport Index, with the dates we checked them.",
  path: `${PI}/data-sources`,
  ogKicker: "World Passport Index",
});

const TYPE: Record<string, string> = { legislation: "Legislation", government: "Government website", "official-portal": "Official portal", embassy: "Embassy / mission" };

export default function DataSourcesPage() {
  const stats = datasetStats();
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Data sources", href: `${PI}/data-sources` }]} kicker={`Dataset ${stats.datasetVersion}`} title="Data sources" intro="Every rule in the index cites one of these sources. We read each one ourselves, record the date, and recheck it on a schedule." />
      <SubNav current={`${PI}/data-sources`} />
      <div className="container-uj mt-12 max-w-[56rem] space-y-12 text-[1.05rem] leading-relaxed text-ink-2">
        <section>
          <h2 className={h2}>Our rules for sources</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li><strong className="text-ink">Accepted:</strong> the destination government&apos;s immigration or foreign-affairs website, its embassies, official e-visa and ETA portals, and published legislation.</li>
            <li><strong className="text-ink">Not accepted as evidence:</strong> other passport indexes, Wikipedia, visa agencies, travel blogs and news reports. We may use them to find an official page, never as the source.</li>
            <li><strong className="text-ink">Conflicts:</strong> when two official sources disagree, the record is held for review. We never pick the more favourable answer.</li>
            <li><strong className="text-ink">Not used yet:</strong> IATA Timatic, which is commercially licensed.</li>
          </ul>
        </section>
        <section>
          <h2 className={h2}>Sources in use ({sources.length})</h2>
          <ul className="mt-5 space-y-3">
            {sources.map((s) => (
              <li key={s.id} className="rounded-2xl bg-white p-5 ring-1 ring-line text-[0.95rem]">
                <a href={s.url} target="_blank" rel="noopener nofollow" className="font-semibold text-sky underline">{s.title}</a>
                <p className="mt-1 text-ink-2">{s.publisher} · {TYPE[s.type]}</p>
                <p className="mt-1 text-muted">Checked {formatDate(s.checked)}{s.sourceUpdated && <> · source dated {formatDate(s.sourceUpdated)}</>} · used in {rules.filter((r) => r.sourceId === s.id).length} rules</p>
                {s.note && <p className="mt-2 text-ink-2">{s.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
