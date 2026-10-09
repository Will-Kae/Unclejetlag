import Link from "next/link";
import type { Metadata } from "next";
import { BicChecker } from "@/components/banking/BicChecker";
import { ToolHero, Faq, Disclaimer } from "@/components/banking/ToolHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { buildMetadata, faqLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "SWIFT/BIC Code Checker: Decode and Check Any SWIFT Code",
  description:
    "Check whether a SWIFT/BIC code is correctly formed, decode its bank, country, location and branch, and see if it matches a bank code verified on an official source.",
  path: "/tools/swift-code-checker",
  ogKicker: "SWIFT/BIC checker",
});

const faqs = [
  { q: "What is a SWIFT code?", a: "A SWIFT code, also called a BIC (Business Identifier Code), identifies a bank or financial institution in international payments. It has 8 or 11 characters." },
  { q: "Is a BIC the same as a SWIFT code?", a: "Yes. BIC is the official name in the ISO 9362 standard; most people and banks call it a SWIFT code." },
  { q: "What does XXX at the end mean?", a: "XXX is the branch code for a bank's head office. An 11-character code ending in XXX points to the same place as the 8-character code without it." },
  { q: "My code says 'valid format' but not 'found'. Is it wrong?", a: "Not necessarily. It means the structure is correct, but the code isn't in our verified directory, so we can't tell you which bank owns it. Confirm it with the bank or with SWIFT's official BIC search." },
  { q: "Can I find my own bank's SWIFT code here?", a: "If your bank is in our directory, yes. The most reliable place is always your bank's app, statement or 'international payments' page." },
];

export default function SwiftCheckerPage() {
  return (
    <>
      <ToolHero
        crumbs={[{ name: "Travel Tools", href: "/tools" }, { name: "Global Banking", href: "/tools/global-banking" }, { name: "SWIFT/BIC checker", href: "/tools/swift-code-checker" }]}
        kicker="Uncle Jetlag Global Banking"
        title="SWIFT/BIC code checker"
        intro="Paste a SWIFT or BIC code to check its structure, see what each part means, and find out whether it matches a bank we've verified on an official source."
      />
      <div className="container-uj mt-10">
        <div className="max-w-3xl"><BicChecker /></div>

        <article className="mt-16 max-w-[48rem] space-y-12 text-[1.05rem] leading-relaxed text-ink-2">
          <section id="explained" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">How a SWIFT/BIC code is built</h2>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">Characters 1–4: institution.</strong> Usually letters taken from the bank&apos;s name, such as ABSA or CHAS.</li>
              <li><strong className="text-ink">Characters 5–6: country.</strong> The ISO country code: ZA for South Africa, ZW for Zimbabwe, GB for the UK.</li>
              <li><strong className="text-ink">Characters 7–8: location.</strong> Identifies the city or region of the head office.</li>
              <li><strong className="text-ink">Characters 9–11: branch (optional).</strong> XXX means the head office.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">What our results mean</h2>
            <ul className="mt-4 space-y-3">
              <li><strong className="text-ink">Found in our directory:</strong> the code matches a bank whose code we read on its own website or an official central-bank list. We show that source and the date we checked.</li>
              <li><strong className="text-ink">Valid format, not in our directory:</strong> the structure follows the ISO 9362 standard, but we can&apos;t say which bank owns it, or whether it&apos;s in use.</li>
              <li><strong className="text-ink">Invalid format:</strong> the code breaks the standard, for example the wrong length or a country code that doesn&apos;t exist.</li>
            </ul>
            <p className="mt-4">A correct format never proves a code is active or able to receive payments. Only the bank can confirm that.</p>
          </section>
          <section>
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Find your bank&apos;s code</h2>
            <p className="mt-4">Search our <Link href="/tools/bank-directory" className="text-sky underline">verified bank directory</Link>, browse <Link href="/tools/global-banking#countries" className="text-sky underline">banking by country</Link>, or check your bank&apos;s app or statement.</p>
          </section>
          <Faq items={faqs} />
          <Disclaimer />
        </article>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
