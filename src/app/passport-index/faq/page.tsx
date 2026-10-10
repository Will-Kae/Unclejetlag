import type { Metadata } from "next";
import { Faq } from "@/components/banking/ToolHero";
import { ToolHero } from "@/components/banking/ToolHero";
import { PI, SubNav } from "@/components/passport/shared";
import { JsonLd } from "@/components/ui/JsonLd";
import { buildMetadata, faqLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "World Passport Index FAQ",
  description: "How the Uncle Jetlag World Passport Index works, where its data comes from, and why rankings aren't published yet.",
  path: `${PI}/faq`,
  ogKicker: "World Passport Index",
});

const faqs = [
  { q: "Why isn't there a ranking yet?", a: "Because we only use rules we've verified on official government sources, and we don't have enough of them yet to rank passports fairly. A ranking built on partial data would mislead. It goes live when 90% of passports have at least 95% of their destinations verified." },
  { q: "How is this different from other passport indexes?", a: "Every rule links to the destination government's own source and shows when we checked it. Unknown destinations are labelled as unknown rather than counted as visa-required. We don't copy any other index." },
  { q: "Which passports are covered first?", a: "Fifteen African passports: South Africa, Zimbabwe, Botswana, Namibia, Zambia, Malawi, Mozambique, Lesotho, Eswatini, Kenya, Tanzania, Uganda, Rwanda, Nigeria and Ghana." },
  { q: "Does SADC or ECOWAS membership mean visa-free travel?", a: "Not automatically. Regional agreements are implemented differently by each country, so we only record visa-free access when the destination publishes it." },
  { q: "What's the difference between an eVisa and an ETA?", a: "An eVisa is a visa you apply for online and must be approved before you travel. An ETA is a lighter electronic authorisation for travellers who don't need a visa. Our mobility count includes ETAs but not eVisas." },
  { q: "Can I rely on this for my trip?", a: "Use it as a starting point. Border officials decide entry, and personal circumstances can change the rules. Always check the official source linked on each record before you book." },
  { q: "Do you collect my passport details?", a: "No. You only choose a nationality from a list. We never ask for passport numbers, scans or dates of birth." },
  { q: "Is it free?", a: "Yes, with no sign-up." },
];

export default function FaqPage() {
  return (
    <>
      <ToolHero crumbs={[{ name: "World Passport Index", href: PI }, { name: "FAQ", href: `${PI}/faq` }]} kicker="World Passport Index" title="Questions" intro="How the index works, and what it can and can't tell you." />
      <SubNav current={`${PI}/faq`} />
      <div className="container-uj max-w-[48rem]"><Faq items={faqs} title="Frequently asked questions" /></div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
