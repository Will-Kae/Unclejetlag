import Link from "next/link";
import type { Metadata } from "next";
import { ToolHero } from "@/components/banking/ToolHero";
import { CategoryPill, PI, SubNav, h2, profileHref } from "@/components/passport/shared";
import { accessFor, africaSubregions, flagOf, getJurisdiction, jName, jurisdictions, SPRINT_1_PASSPORTS } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "African Passports: Visa Access for Southern, East and West African Travellers",
  description: "Verified visa rules for African passports, starting with South Africa, Zimbabwe, Botswana, Kenya, Nigeria, Ghana and others, from official government sources.",
  path: `${PI}/africa`,
  ogKicker: "World Passport Index · Africa",
});

/** Destinations shown in the matrix: those verified for every sprint-1 passport. */
const MATRIX_DESTS = ["ZA", "GB", "US", "CA", "IE", "FR"];

export default function AfricaPage() {
  const sprint = SPRINT_1_PASSPORTS.map((c) => getJurisdiction(c)!).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "Africa", href: `${PI}/africa` }]} kicker="World Passport Index · Africa" title="African passports" intro="Africa is where we started. Our first research sprint covers 15 passports from Southern, East and West Africa. Regional membership (SADC, EAC, ECOWAS) never counts as proof of visa-free entry here: only the destination's own published rules do." />
      <SubNav current={`${PI}/africa`} />
      <div className="container-uj mt-12 space-y-14">
        <section aria-labelledby="matrix">
          <h2 id="matrix" className={h2}>At a glance: key destinations</h2>
          <p className="mt-3 max-w-2xl text-ink-2">France stands for all 29 Schengen states plus Bulgaria, Romania and Cyprus, which share the EU visa list.</p>
          <div className="mt-5 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
                <tr><th scope="col" className="px-3 py-3">Passport</th>{MATRIX_DESTS.map((d) => <th key={d} scope="col" className="px-3 py-3">{flagOf(d)} {d === "FR" ? "Schengen" : jName(d)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sprint.map((j) => {
                  const acc = new Map(accessFor(j.code).map((a) => [a.destination, a]));
                  return (
                    <tr key={j.code}>
                      <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink"><Link href={profileHref(j.slug)} className="hover:underline">{flagOf(j.code)} {j.name}</Link></th>
                      {MATRIX_DESTS.map((d) => {
                        const a = acc.get(d);
                        return <td key={d} className="px-3 py-2.5">{d === j.code ? <span className="text-muted">Home</span> : a ? <span className="inline-flex flex-col gap-1"><CategoryPill category={a.category} />{a.rule?.maxStayDays && a.category === "visa-free" ? <span className="text-xs text-muted">{a.rule.maxStayDays} days</span> : null}</span> : null}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="regions">
          <h2 id="regions" className={h2}>Passports by African region</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {africaSubregions.map((r) => (
              <div key={r.key} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <h3 className="font-semibold text-ink">{r.label}</h3>
                <ul className="mt-3 space-y-1 text-[0.95rem]">
                  {jurisdictions.filter((j) => j.africaSubregion === r.key).map((j) => (
                    <li key={j.code}><Link href={profileHref(j.slug)} className="hover:underline">{flagOf(j.code)} {j.name}</Link>{SPRINT_1_PASSPORTS.includes(j.code) && <span className="ml-2 text-xs font-semibold text-palm">sprint 1</span>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Regions follow the African Union&apos;s five regions.</p>
        </section>

        <section aria-labelledby="next" className="max-w-[48rem] text-[1.05rem] leading-relaxed text-ink-2">
          <h2 id="next" className={h2}>What we&apos;re verifying next</h2>
          <p className="mt-3">Intra-African travel first: Botswana, Namibia, Zambia, Zimbabwe, Mozambique, Kenya, Tanzania, Rwanda, Ghana, Nigeria, Mauritius and Seychelles as destinations, then the Gulf and Asia. Many African governments publish their rules only as PDFs or on portals that are hard to read, so we add each one when we can confirm it.</p>
        </section>
      </div>
    </>
  );
}
