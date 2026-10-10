import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolHero } from "@/components/banking/ToolHero";
import { CategoryPill, CoverageBar, NotRanked, PI, SubNav, h2, profileHref } from "@/components/passport/shared";
import { accessFor, categoryMeta, flagOf, getJurisdiction, getJurisdictionBySlug, getSource, jName, jurisdictions, regions, rules, SPRINT_1_PASSPORTS, scorePassport, type AccessCategory } from "@/lib/passport";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  return jurisdictions.map((j) => ({ country: j.slug }));
}

export async function generateMetadata({ params }: PageProps<"/passport-index/passports/[country]">): Promise<Metadata> {
  const j = getJurisdictionBySlug((await params).country);
  if (!j) return {};
  const s = scorePassport(j.code);
  return buildMetadata({
    title: `${j.name} Passport: Visa Requirements & Ranking`,
    description: s.verified
      ? `Visa requirements for ${j.name} passport holders in ${s.verified} destinations, each checked on an official government source. Uncle Jetlag World Passport Index.`
      : `${j.name} passport on the Uncle Jetlag World Passport Index. Visa rules for this passport are not yet verified.`,
    path: profileHref(j.slug),
    ogKicker: "World Passport Index",
    noindex: s.verified === 0,
  });
}

const ORDER: AccessCategory[] = ["visa-free", "visa-on-arrival", "eta", "evisa", "conditional", "visa-required", "restricted", "unknown"];

export default async function PassportProfile({ params }: PageProps<"/passport-index/passports/[country]">) {
  const j = getJurisdictionBySlug((await params).country);
  if (!j) notFound();
  const s = scorePassport(j.code);
  const access = accessFor(j.code).filter((a) => a.rule).sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category) || jName(a.destination).localeCompare(jName(b.destination)));
  const checked = access.map((a) => getSource(a.rule!.sourceId)?.checked).filter(Boolean).sort().at(-1);
  const compareWith = SPRINT_1_PASSPORTS.filter((c) => c !== j.code && rules.some((r) => r.passport === c)).slice(0, 4);

  return (
    <>
      <ToolHero
        crumbs={[{ name: "World Passport Index", href: PI }, { name: "Passports", href: `${PI}/passports` }, { name: j.name, href: profileHref(j.slug) }]}
        kicker={`${flagOf(j.code)} Ordinary passport · ${regions.find((r) => r.key === j.region)?.label}`}
        title={`${j.name} passport`}
        intro={s.verified ? `Verified entry rules for ${j.name} passport holders travelling for short-stay tourism, each linked to the destination government's own source.` : `We haven't verified any entry rules for ${j.name} passports yet. Check the destination's official immigration website before you travel.`}
      >
        <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-paper/15 sm:grid-cols-4">
          {[
            ["Global rank", s.scored ? "—" : "Not yet ranked"],
            ["Passport Power Score", s.powerScore != null ? String(s.powerScore) : "Pending"],
            ["Verified destinations", `${s.verified} of ${s.universe}`],
            ["Last verified", checked ? formatDate(checked) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="bg-ink p-4"><dt className="label-mono text-[0.65rem] text-paper/60">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
          ))}
        </dl>
      </ToolHero>
      <SubNav current={`${PI}/passports`} />

      <div className="container-uj mt-12 max-w-[60rem] space-y-14">
        {!s.scored && <NotRanked />}

        <section aria-labelledby="breakdown">
          <h2 id="breakdown" className={h2}>Access breakdown</h2>
          <div className="mt-5"><CoverageBar value={s.coverage} label={`Coverage: ${s.verified} of ${s.universe} destinations verified`} /></div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ORDER.map((c) => (
              <li key={c} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                <p className="font-display text-3xl font-semibold text-ink">{s.counts[c]}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-2"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: categoryMeta[c].colour }} />{categoryMeta[c].label}</p>
              </li>
            ))}
          </ul>
        </section>

        {access.length > 0 && (
          <section aria-labelledby="destinations">
            <h2 id="destinations" className={h2}>Verified destinations</h2>
            <div className="mt-5 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
              <table className="w-full min-w-[40rem] text-left text-[0.95rem]">
                <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
                  <tr><th scope="col" className="px-4 py-3">Destination</th><th scope="col" className="px-4 py-3">Access</th><th scope="col" className="px-4 py-3">Stay</th><th scope="col" className="px-4 py-3">Source</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {access.map((a) => {
                    const src = getSource(a.rule!.sourceId)!;
                    return (
                      <tr key={a.destination} className="align-top">
                        <td className="px-4 py-3 font-semibold text-ink">{flagOf(a.destination)} {jName(a.destination)}</td>
                        <td className="px-4 py-3"><CategoryPill category={a.category} />{a.rule!.conditions && <span className="mt-1.5 block text-sm text-ink-2">{a.rule!.conditions}</span>}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{a.rule!.maxStayDays ? `${a.rule!.maxStayDays} days` : "—"}</td>
                        <td className="px-4 py-3 text-sm"><a href={src.url} target="_blank" rel="noopener nofollow" className="text-sky underline">{src.publisher}</a><span className="block text-muted">Checked {formatDate(src.checked)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section aria-labelledby="regions">
          <h2 id="regions" className={h2}>By region</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[30rem] text-left text-[0.95rem]">
              <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Region</th><th scope="col" className="px-4 py-3">Verified</th><th scope="col" className="px-4 py-3">No visa needed in advance</th></tr></thead>
              <tbody className="divide-y divide-line">
                {regions.map((r) => {
                  const inRegion = accessFor(j.code).filter((a) => getJurisdiction(a.destination)?.region === r.key);
                  const ver = inRegion.filter((a) => a.category !== "unknown");
                  return (
                    <tr key={r.key}><td className="px-4 py-3 font-semibold text-ink">{r.label}</td><td className="px-4 py-3">{ver.length} of {inRegion.length}</td><td className="px-4 py-3">{ver.filter((a) => categoryMeta[a.category].noAdvanceVisa).length}</td></tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {compareWith.length > 0 && (
          <section aria-labelledby="compare">
            <h2 id="compare" className={h2}>Compare with</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {compareWith.map((c) => <li key={c}><Link href={`${PI}/compare?a=${j.code}&b=${c}`} className="block rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-line hover:bg-sand">{j.name} vs {jName(c)}</Link></li>)}
            </ul>
          </section>
        )}

        <section aria-labelledby="important" className="rounded-2xl bg-white p-6 ring-1 ring-line text-[0.98rem] text-ink-2">
          <h2 id="important" className="text-xl font-semibold text-ink">Before you travel</h2>
          <p className="mt-2">These rules cover ordinary passports for short tourist visits. Border officials decide entry on the day, and your circumstances (residence, previous visas, purpose of trip, passport validity) can change what applies. Check the destination government&apos;s official site, and our <Link href="/visas" className="text-sky underline">visa guides</Link>, before you book.</p>
        </section>
      </div>
    </>
  );
}
