import Link from "next/link";
import type { Metadata } from "next";
import { BankSearch } from "@/components/banking/BankSearch";
import { BicChecker } from "@/components/banking/BicChecker";
import { IbanValidator } from "@/components/banking/IbanValidator";
import { ToolHero, Faq, Disclaimer } from "@/components/banking/ToolHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { countryGuides } from "@/lib/banking/countries";
import { institutions, institutionsIn } from "@/lib/banking/directory";
import { ibanCountryUsage } from "@/lib/banking/iban";
import { countryName, flag } from "@/lib/banking/iso-countries";
import { buildMetadata, faqLd } from "@/lib/seo";
import { SITE_URL } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Global Banking: SWIFT/BIC Checker, IBAN Validator & Bank Directory",
  description:
    "Check SWIFT/BIC codes, validate IBANs and look up verified bank codes for South Africa, Zimbabwe, the UK, US and more. Free, private and sourced from banks' own websites.",
  path: "/tools/global-banking",
  ogKicker: "Uncle Jetlag Global Banking",
});

const faqs = [
  { q: "Is Uncle Jetlag Global Banking free?", a: "Yes. The SWIFT/BIC checker, IBAN validator and bank directory are free to use, with no sign-up." },
  { q: "Where do your bank codes come from?", a: "Each code in our directory was read on the bank's own website or an official central-bank publication, and we show the source and the date we checked it. We don't copy third-party directories." },
  { q: "Why isn't my bank listed?", a: "We only list codes we can trace to an official source, so coverage is limited and growing. The SWIFT/BIC checker still tells you whether any code is correctly formed, and the IBAN validator works for every IBAN country." },
  { q: "Does a valid result mean my payment will arrive?", a: "No. A valid format or checksum means the code or IBAN is well formed. It doesn't confirm that an account exists, who owns it, or that a payment will succeed. Confirm details with the recipient or your bank." },
  { q: "Do you store what I type?", a: "No. The checks run in your browser. We don't send, store or log the codes or IBANs you enter." },
];

export default function GlobalBankingPage() {
  const banks = institutions.length;
  const codes = institutions.reduce((n, i) => n + i.identifiers.length, 0);
  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "Global Banking", href: "/tools/global-banking" }]}
        kicker="Uncle Jetlag Global Banking · Find Banks. Verify Codes. Move Globally."
        title="Global Banking, Made Simple."
        intro="Search international banks, check SWIFT/BIC codes, validate IBANs and find the banking information you need, all in one place."
      >
        <div className="mt-8 max-w-3xl rounded-[var(--radius-card)] bg-paper p-4 text-ink sm:p-6">
          <BankSearch autoFocus={false} />
        </div>
        <p className="mt-4 text-sm text-paper/60">{banks} banks and {codes} codes in {countryGuides.length} countries, each traced to an official source. Coverage is growing.</p>
      </ToolHero>

      <div className="container-uj">
        <section aria-labelledby="tools-heading" className="mt-16">
          <h2 id="tools-heading" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Check a code</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-semibold text-ink">SWIFT/BIC checker</h3>
                <Link href="/tools/swift-code-checker" className="text-sm font-semibold text-sky underline">How it works</Link>
              </div>
              <BicChecker />
            </div>
            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-semibold text-ink">IBAN validator</h3>
                <Link href="/tools/iban-validator" className="text-sm font-semibold text-sky underline">How it works</Link>
              </div>
              <IbanValidator />
            </div>
          </div>
        </section>

        <section id="countries" aria-labelledby="countries-heading" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="countries-heading" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Banking by country</h2>
            <Link href="/tools/bank-directory" className="text-sm font-semibold text-sky underline">Full bank directory</Link>
          </div>
          <p className="mt-2 max-w-2xl text-muted">What to ask for when receiving money, which identifiers each country uses, and the bank codes we&apos;ve verified.</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countryGuides.map((g) => {
              const n = institutionsIn(g.code).length;
              const iban = ibanCountryUsage(g.code);
              return (
                <li key={g.code}>
                  <Link href={`/banks/${g.slug}`} className="flex h-full items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-card">
                    <span className="text-3xl" aria-hidden="true">{flag(g.code)}</span>
                    <span>
                      <span className="block font-semibold text-ink">{countryName(g.code)}</span>
                      <span className="block text-sm text-muted">{n} verified {n === 1 ? "bank" : "banks"} · {iban.usesIban ? "uses IBAN" : "no IBAN"}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="learn-heading" className="mt-16">
          <h2 id="learn-heading" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Learn the basics</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { t: "What is a SWIFT/BIC code?", b: "The 8 or 11-character code that identifies a bank in international payments.", h: "/tools/swift-code-checker#explained" },
              { t: "SWIFT vs IBAN", b: "One identifies the bank, the other your account. Many countries don't use IBANs at all.", h: "/tools/iban-validator#swift-vs-iban" },
              { t: "Receiving money from abroad", b: "The exact details a sender needs, and the fees that eat into transfers.", h: "/banking#receive" },
            ].map((x) => (
              <Link key={x.t} href={x.h} className="rounded-2xl bg-white p-5 ring-1 ring-line transition hover:shadow-card">
                <p className="font-display text-lg font-semibold text-ink">{x.t}</p>
                <p className="mt-2 text-[0.95rem] text-ink-2">{x.b}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="max-w-[48rem]">
          <Faq items={faqs} />
          <Disclaimer />
        </div>
      </div>
      <JsonLd data={faqLd(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Uncle Jetlag Global Banking",
          url: `${SITE_URL}/tools/global-banking`,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: "SWIFT/BIC checker, IBAN validator and verified bank directory.",
        }}
      />
    </>
  );
}
