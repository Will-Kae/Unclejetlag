import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { CategoryPill, PI, SubNav, h2 } from "@/components/passport/shared";
import { categoryMeta, currentMethodology as m, jurisdictions, type AccessCategory } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { ScrollRegion } from "@/components/ui/ScrollRegion";

export const metadata: Metadata = buildMetadata({
  title: "Passport Index Methodology: How We Score and Rank Passports",
  description: "How the Uncle Jetlag Global Mobility Ranking and Passport Power Score are calculated: scope, access categories, weights, coverage thresholds and tie handling.",
  path: `${PI}/methodology`,
  ogKicker: "World Passport Index",
});

export default function MethodologyPage() {
  const w = m.powerWeights;
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Methodology", href: `${PI}/methodology` }]} kicker={`Methodology v${m.id} · ${m.status} · effective ${formatDate(m.effective)}`} title="How we score passports" intro="Two measures, both calculated only from verified official sources, both versioned so you can see exactly what changed and when." />
      <SubNav current={`${PI}/methodology`} />
      <article className="container-uj mt-12 max-w-[48rem] space-y-12 text-[1.05rem] leading-relaxed text-ink-2">
        <section>
          <h2 className={h2}>Scope</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li><strong className="text-ink">Passports:</strong> ordinary passports held by adult citizens. Diplomatic, official, service, refugee and emergency documents are excluded.</li>
            <li><strong className="text-ink">Trip:</strong> a short tourist visit.</li>
            <li><strong className="text-ink">Universe:</strong> {jurisdictions.length} jurisdictions: the 193 UN member states, the Holy See and Palestine, Kosovo, Taiwan, and Hong Kong and Macao. Each passport is measured against the other {jurisdictions.length - 1}; its own country is excluded.</li>
            <li><strong className="text-ink">Territories</strong> outside this list (for example overseas territories) are not counted in v{m.id}.</li>
          </ul>
        </section>
        <section>
          <h2 className={h2}>Access categories</h2>
          <ul className="mt-4 space-y-3">
            {(Object.keys(categoryMeta) as AccessCategory[]).map((c) => (
              <li key={c} className="flex flex-wrap items-start gap-3"><CategoryPill category={c} /><span className="min-w-0 flex-1 text-[0.98rem]">{DESCR[c]}</span></li>
            ))}
          </ul>
          <p className="mt-4">When several verified rules apply to the same passport and destination, the destination still counts once. A conditional route (for example, visa-free only if you already hold a US visa) never upgrades a passport&apos;s category: it&apos;s shown as a note. An entry restriction overrides other rules.</p>
        </section>
        <section>
          <h2 className={h2}>A. Global Mobility Ranking</h2>
          <p className="mt-4">The number of destinations a passport can enter without a visa obtained before departure: <strong className="text-ink">visa-free, visa on arrival, or an electronic travel authorisation (ETA)</strong>. eVisas need approval in advance, so they don&apos;t count. Each destination adds at most one point.</p>
          <p className="mt-3">Ties share a rank (standard competition ranking: 1, 1, 3). Alphabetical order inside a tie is not a ranking.</p>
        </section>
        <section>
          <h2 className={h2}>B. Passport Power Score (0–100)</h2>
          <ScrollRegion label="Passport Power Score components table" className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[30rem] text-left text-[0.95rem]">
              <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Component</th><th scope="col" className="px-4 py-3">Weight</th><th scope="col" className="px-4 py-3">Measured as</th></tr></thead>
              <tbody className="divide-y divide-line">
                <tr><td className="px-4 py-3">Visa-free access</td><td className="px-4 py-3">{w.visaFree}%</td><td className="px-4 py-3">Share of verified destinations that are visa-free</td></tr>
                <tr><td className="px-4 py-3">Visa on arrival</td><td className="px-4 py-3">{w.visaOnArrival}%</td><td className="px-4 py-3">Share with visa on arrival</td></tr>
                <tr><td className="px-4 py-3">Electronic authorisation</td><td className="px-4 py-3">{w.eta}%</td><td className="px-4 py-3">Share needing only an ETA</td></tr>
                <tr><td className="px-4 py-3">Entry convenience</td><td className="px-4 py-3">{w.entryConvenience}%</td><td className="px-4 py-3">Share with no advance visa <em>and</em> a stated stay of 30 days or more</td></tr>
                <tr><td className="px-4 py-3">Regional mobility</td><td className="px-4 py-3">{w.regional}%</td><td className="px-4 py-3">Share of the passport&apos;s own region reachable with no advance visa</td></tr>
              </tbody>
            </table>
          </ScrollRegion>
          <p className="mt-4">These are starting weights. Before the first ranking we&apos;ll publish a sensitivity test showing how ranks move when weights change. Any change creates a new methodology version; old scores keep the version they were calculated under.</p>
        </section>
        <section>
          <h2 className={h2}>Coverage and unknowns</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>An unverified destination is <strong className="text-ink">never counted as zero</strong>. It&apos;s shown as &ldquo;Not yet verified&rdquo;.</li>
            <li>A passport is scored only when at least <strong className="text-ink">{m.passportCoverageThreshold * 100}%</strong> of its destinations are verified.</li>
            <li>The worldwide ranking is published only when <strong className="text-ink">{m.rankingPublicationThreshold * 100}%</strong> of passports are scored.</li>
            <li>Records are re-verified at least every <strong className="text-ink">{m.freshnessDays} days</strong>, and sooner when a source changes.</li>
          </ul>
        </section>
        <section>
          <h2 className={h2}>What this index is not</h2>
          <p className="mt-4">It measures travel access, not the prosperity or prestige of a country, and it isn&apos;t legal advice. Individual circumstances (residence permits, previous visas, purpose of travel) can change what applies to you.</p>
        </section>
        <section>
          <h2 className={h2}>Change log</h2>
          <ul className="mt-4 list-disc space-y-1 pl-5">{m.changelog.map((c) => <li key={c}>v{m.id}: {c}</li>)}</ul>
        </section>
      </article>
    </>
  );
}

const DESCR: Record<AccessCategory, string> = {
  "visa-free": "Enter with just a passport, no prior authorisation.",
  "visa-on-arrival": "A visa issued at the border on arrival.",
  eta: "A mandatory online authorisation that is not a visa (for example the UK ETA or Kenya's ETA).",
  evisa: "A visa applied for and approved online before travel.",
  "visa-required": "A visa applied for in advance through an embassy, consulate or sponsor.",
  conditional: "Exemption only under specific conditions, such as holding another country's visa or residence permit.",
  restricted: "Entry or visa issuance suspended or restricted for most travellers with this passport.",
  unknown: "We haven't verified this destination on an official source yet. Never counted as zero.",
};
