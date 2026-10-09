import Link from "next/link";
import type { Metadata } from "next";
import { BankSearch } from "@/components/banking/BankSearch";
import { InstitutionTable } from "@/components/banking/InstitutionTable";
import { ToolHero, Disclaimer } from "@/components/banking/ToolHero";
import { countryHref } from "@/components/banking/countrySlug";
import { directoryCountries, institutions, institutionsIn } from "@/lib/banking/directory";
import { countryName, flag } from "@/lib/banking/iso-countries";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Bank Directory: Verified SWIFT/BIC Codes by Country",
  description:
    "SWIFT/BIC codes for banks in South Africa, Zimbabwe, Kenya, Nigeria, the UK, US and more, each taken from the bank's own website or a central bank, with the source and date checked.",
  path: "/tools/bank-directory",
  ogKicker: "Bank directory",
});

export default function BankDirectoryPage() {
  const countries = directoryCountries();
  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "Global Banking", href: "/tools/global-banking" }, { name: "Bank directory", href: "/tools/bank-directory" }]}
        kicker="Uncle Jetlag Global Banking"
        title="Bank directory"
        intro={<>{institutions.length} banks in {countries.length} countries. Every code was read on the bank&apos;s own website or an official central-bank list, and we show the source and the date we checked.</>}
      >
        <div className="mt-8 max-w-3xl rounded-[var(--radius-card)] bg-paper p-4 text-ink sm:p-6">
          <BankSearch />
        </div>
      </ToolHero>

      <div className="container-uj mt-12">
        <nav aria-label="Countries in the directory">
          <ul className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <li key={c}><a href={`#${c.toLowerCase()}`} className="block rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line hover:bg-sand">{flag(c)} {countryName(c)}</a></li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 max-w-[56rem] space-y-12">
          {countries.map((c) => {
            const href = countryHref(c);
            return (
              <section key={c} id={c.toLowerCase()} aria-labelledby={`h-${c}`} className="scroll-mt-28">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 id={`h-${c}`} className="text-2xl font-semibold text-ink">{flag(c)} {countryName(c)}</h2>
                  {href && <Link href={href} className="text-sm font-semibold text-sky underline">Banking in {countryName(c)}</Link>}
                </div>
                <div className="mt-4"><InstitutionTable items={institutionsIn(c)} /></div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 max-w-[48rem] rounded-2xl bg-white p-6 ring-1 ring-line text-[0.98rem] text-ink-2">
          <p className="font-display text-xl font-semibold text-ink">Bank not listed?</p>
          <p className="mt-2">We only add a bank when we can trace its code to an official source. For any other bank, check its app, statement or international-payments page, or use <a href="https://www2.swift.com/bsl/index.faces" target="_blank" rel="noopener nofollow" className="text-sky underline">SWIFT&apos;s official BIC search</a>. Our <Link href="/tools/swift-code-checker" className="text-sky underline">SWIFT/BIC checker</Link> still tells you whether any code is correctly formed.</p>
        </div>
        <div className="max-w-[48rem]"><Disclaimer /></div>
      </div>
    </>
  );
}
