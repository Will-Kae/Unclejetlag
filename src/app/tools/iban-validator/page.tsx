import Link from "next/link";
import type { Metadata } from "next";
import { IbanValidator } from "@/components/banking/IbanValidator";
import { ToolHero, Faq, Disclaimer } from "@/components/banking/ToolHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { buildMetadata, faqLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "IBAN Validator: Check an IBAN's Format and Checksum",
  description:
    "Validate an IBAN in your browser: country, length, format and the MOD-97 checksum, plus the bank and branch identifiers where the country includes them. Nothing is stored.",
  path: "/tools/iban-validator",
  ogKicker: "IBAN validator",
});

const faqs = [
  { q: "What is an IBAN?", a: "An International Bank Account Number identifies a specific bank account across borders. It starts with a two-letter country code and two check digits, followed by the country's domestic account details." },
  { q: "How do you check an IBAN?", a: "We check the country code, the length for that country, the country's format, and the two check digits using the MOD-97 calculation from the ISO 13616 standard. A single wrong or swapped digit almost always fails the checksum." },
  { q: "Does a valid IBAN mean the account exists?", a: "No. It means the IBAN is well formed. It doesn't confirm that the account is open, who owns it, or that a payment will succeed." },
  { q: "Does South Africa use IBANs?", a: "No. South Africa, the United States, Canada, Australia, India and many African countries don't use IBANs. Payments from abroad use the account number and the bank's SWIFT/BIC code." },
  { q: "Is it safe to enter an IBAN here?", a: "The check runs in your browser. We don't send, store or log the IBAN." },
];

export default function IbanValidatorPage() {
  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "Global Banking", href: "/tools/global-banking" }, { name: "IBAN validator", href: "/tools/iban-validator" }]}
        kicker="Uncle Jetlag Global Banking"
        title="IBAN validator"
        intro="Check an IBAN's country, length, format and checksum before you send or share it. The check runs in your browser and nothing is stored."
      />
      <div className="container-uj mt-10">
        <div className="max-w-3xl"><IbanValidator /></div>

        <article className="mt-16 max-w-[48rem] space-y-12 text-[1.05rem] leading-relaxed text-ink-2">
          <section>
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">What we check</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              <li><strong className="text-ink">Country:</strong> that the first two letters are a country that uses IBANs.</li>
              <li><strong className="text-ink">Length:</strong> each country has a fixed IBAN length, from 15 characters (Norway) to over 30.</li>
              <li><strong className="text-ink">Format:</strong> that letters and digits sit where that country requires them.</li>
              <li><strong className="text-ink">Checksum:</strong> the two check digits are recalculated with MOD-97 (ISO 13616). This catches most typos and swapped digits.</li>
            </ol>
            <p className="mt-4">Country formats come from the open-source <a href="https://github.com/Simplify/ibantools" target="_blank" rel="noopener" className="text-sky underline">ibantools</a> library, which follows SWIFT&apos;s official IBAN Registry.</p>
          </section>
          <section id="swift-vs-iban" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">SWIFT/BIC vs IBAN</h2>
            <p className="mt-4">The <strong className="text-ink">SWIFT/BIC</strong> identifies the bank. The <strong className="text-ink">IBAN</strong> identifies your account, in the countries that use IBANs, mostly in Europe and the Middle East. For a payment into a European account you often need both; inside the euro SEPA area, the IBAN alone is usually enough.</p>
            <p className="mt-4">Countries without IBANs, such as South Africa and the United States, use an account number plus the bank&apos;s SWIFT/BIC code. <Link href="/tools/swift-code-checker" className="text-sky underline">Check a SWIFT/BIC code</Link>.</p>
          </section>
          <Faq items={faqs} />
          <Disclaimer />
        </article>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
