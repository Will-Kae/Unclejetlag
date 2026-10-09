import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BicChecker } from "@/components/banking/BicChecker";
import { IbanValidator } from "@/components/banking/IbanValidator";
import { InstitutionTable } from "@/components/banking/InstitutionTable";
import { ToolHero, Disclaimer } from "@/components/banking/ToolHero";
import { Check } from "@/components/ui/icons";
import { countryGuides, getCountryGuide, ibanSummary } from "@/lib/banking/countries";
import { institutionsIn } from "@/lib/banking/directory";
import { ibanCountryUsage } from "@/lib/banking/iban";
import { countryName, flag } from "@/lib/banking/iso-countries";
import { buildMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return countryGuides.map((g) => ({ country: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/banks/[country]">): Promise<Metadata> {
  const g = getCountryGuide((await params).country);
  if (!g) return {};
  const name = countryName(g.code);
  return buildMetadata({
    title: `Banking in ${name}: SWIFT/BIC Codes, IBAN and Receiving Money`,
    description: `${ibanSummary(g.code)} What a sender needs to pay you in ${name}, the domestic bank identifiers, and SWIFT/BIC codes verified on official sources.`,
    path: `/banks/${g.slug}`,
    ogKicker: `Global Banking · ${name}`,
  });
}

export default async function CountryBankingPage({ params }: PageProps<"/banks/[country]">) {
  const g = getCountryGuide((await params).country);
  if (!g) notFound();
  const name = countryName(g.code);
  const banks = institutionsIn(g.code);
  const iban = ibanCountryUsage(g.code);
  const h2 = "text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold text-ink";

  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "Global Banking", href: "/tools/global-banking" }, { name, href: `/banks/${g.slug}` }]}
        kicker={`Uncle Jetlag Global Banking · ${flag(g.code)} ${name}`}
        title={`Banking in ${name}`}
        intro={g.intro}
      >
        <dl className="mt-8 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl bg-paper/15 sm:grid-cols-3">
          {[
            ["Currency", g.currency],
            ["IBAN", iban.usesIban ? `Yes · ${iban.length} characters` : "Not used"],
            ["Verified banks", `${banks.length} in our directory`],
          ].map(([k, v]) => (
            <div key={k} className="bg-ink p-4">
              <dt className="label-mono text-[0.65rem] text-paper/60">{k}</dt>
              <dd className="mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </ToolHero>

      <div className="container-uj mt-12">
        <article className="max-w-[52rem] space-y-14 text-[1.05rem] leading-relaxed text-ink-2">
          <section aria-labelledby="receive">
            <h2 id="receive" className={h2}>Receiving money in {name}</h2>
            <p className="mt-3">A sender abroad usually needs:</p>
            <ul className="mt-4 space-y-2">
              {g.receiving.map((r) => <li key={r} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-palm" /><span>{r}</span></li>)}
            </ul>
            <p className="mt-4">Take these details from your bank&apos;s app or statement, not from a directory.</p>
          </section>

          <section aria-labelledby="domestic">
            <h2 id="domestic" className={h2}>Domestic bank identifiers</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
              <table className="w-full min-w-[30rem] text-left text-[0.95rem]">
                <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
                  <tr><th scope="col" className="px-4 py-3 font-semibold">Identifier</th><th scope="col" className="px-4 py-3 font-semibold">Format</th><th scope="col" className="px-4 py-3 font-semibold">Used for</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {g.domestic.map((d) => (
                    <tr key={d.name} className="align-top"><td className="px-4 py-3 font-semibold text-ink">{d.name}</td><td className="px-4 py-3">{d.format}</td><td className="px-4 py-3">{d.use}</td></tr>
                  ))}
                  <tr className="align-top"><td className="px-4 py-3 font-semibold text-ink">IBAN</td><td className="px-4 py-3">{iban.usesIban ? `${iban.length} characters, starts with ${g.code}` : "Not used"}</td><td className="px-4 py-3">{iban.usesIban ? "International and SEPA payments into an account." : `Payments into ${name} use the account number and SWIFT/BIC instead.`}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="codes">
            <h2 id="codes" className={h2}>SWIFT/BIC codes we&apos;ve verified</h2>
            {banks.length > 0 ? (
              <>
                <p className="mt-3">Each code was read on the bank&apos;s own website or an official central-bank list. Always confirm with your own bank before sending money.</p>
                <div className="mt-4"><InstitutionTable items={banks} /></div>
              </>
            ) : (
              <p className="mt-3">We haven&apos;t verified any codes for {name} yet. Ask the bank, or use <a href="https://www2.swift.com/bsl/index.faces" target="_blank" rel="noopener nofollow" className="text-sky underline">SWIFT&apos;s official BIC search</a>.</p>
            )}
            <p className="mt-4 text-[0.95rem]">Bank not listed? We only list codes we can trace to an official source. Check your bank&apos;s app or statement, or see the <Link href="/tools/bank-directory" className="text-sky underline">full directory</Link>.</p>
          </section>

          {g.tips.length > 0 && (
            <section aria-labelledby="tips">
              <h2 id="tips" className={h2}>Good to know</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5">{g.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          )}

          <section aria-labelledby="check">
            <h2 id="check" className={h2}>Check a code</h2>
            <div className="mt-4 space-y-6">
              <BicChecker />
              {iban.usesIban && <IbanValidator />}
            </div>
          </section>

          <Disclaimer />
        </article>
      </div>
    </>
  );
}
