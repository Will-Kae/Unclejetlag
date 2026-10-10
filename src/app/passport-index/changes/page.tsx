import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { PI, SubNav } from "@/components/passport/shared";
import { flagOf, getSource, jName, policyChanges } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Passport Policy Changes: Verified Visa Rule Changes",
  description: "Verified changes to visa rules that affect passport holders, each with the previous rule, new rule, effective date and official source.",
  path: `${PI}/changes`,
  ogKicker: "World Passport Index",
});

export default function ChangesPage() {
  const list = [...policyChanges].sort((a, b) => b.effective.localeCompare(a.effective));
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Changes", href: `${PI}/changes` }]} kicker="World Passport Index" title="Policy change tracker" intro="Changes we've confirmed on an official source. We don't list announcements, rumours or proposals until the destination government publishes the rule." />
      <SubNav current={`${PI}/changes`} />
      <div className="container-uj mt-12 max-w-[52rem] space-y-5">
        {list.map((c) => {
          const s = getSource(c.sourceId)!;
          return (
            <article key={c.id} className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <p className="text-sm text-muted">Effective {formatDate(c.effective)} · {flagOf(c.destination)} {jName(c.destination)}</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">{c.headline}</h2>
              <dl className="mt-4 grid gap-3 text-[0.95rem] sm:grid-cols-2">
                <div><dt className="text-muted">Affected passports</dt><dd className="text-ink">{c.passports.map((p) => `${flagOf(p)} ${jName(p)}`).join(", ")}</dd></div>
                <div><dt className="text-muted">Verified</dt><dd className="text-ink">{formatDate(c.verified)}</dd></div>
                <div><dt className="text-muted">Previous rule</dt><dd className="text-ink">{c.previous}</dd></div>
                <div><dt className="text-muted">New rule</dt><dd className="text-ink">{c.next}</dd></div>
              </dl>
              <p className="mt-4 text-sm">Source: <a href={s.url} target="_blank" rel="noopener nofollow" className="text-sky underline">{s.title}</a> ({s.publisher})</p>
            </article>
          );
        })}
      </div>
    </>
  );
}
