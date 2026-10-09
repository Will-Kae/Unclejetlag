import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ContextCTA } from "@/components/partners/ContextCTA";
import { JsonLd } from "@/components/ui/JsonLd";
import { Wallet, Globe, Shield, Alert, ArrowUpRight, Check } from "@/components/ui/icons";
import { goHref } from "@/data/partners";
import { InstitutionTable } from "@/components/banking/InstitutionTable";
import { countryHref } from "@/components/banking/countrySlug";
import { institutionsIn } from "@/lib/banking/directory";
import { countryName, flag } from "@/lib/banking/iso-countries";
import { buildMetadata, faqLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

const REVIEWED = "2026-10-09";

export const metadata: Metadata = buildMetadata({
  title: "Banking for Travellers: Multi-Currency Accounts, SWIFT Codes & FAQs",
  description:
    "A second account for travel, how to receive money from abroad, SWIFT/BIC codes for major South African, Zimbabwean, Kenyan, Nigerian and Zambian banks, and plain answers to common banking questions.",
  path: "/banking",
  ogKicker: "Banking",
});

const sections = [
  { id: "second-account", label: "Why a second account" },
  { id: "dukascopy", label: "Dukascopy Bank" },
  { id: "receive", label: "Receiving money from abroad" },
  { id: "swift", label: "SWIFT/BIC explained" },
  { id: "codes", label: "SWIFT codes by bank" },
  { id: "fees", label: "Fees to watch" },
  { id: "faq", label: "Banking FAQ" },
];

const faqs = [
  { q: "What is a SWIFT or BIC code?", a: "It's an international code that identifies a bank in cross-border payments. SWIFT code and BIC (Business Identifier Code) mean the same thing. It's 8 or 11 characters long: bank, country, location and, optionally, branch." },
  { q: "Is a SWIFT code the same as an IBAN?", a: "No. The SWIFT/BIC identifies the bank. The IBAN identifies your individual account, in the countries that use IBANs, such as most of Europe and the Middle East. South Africa and many other African countries don't use IBANs: senders use your account number plus the bank's SWIFT code." },
  { q: "Does the SWIFT code end in XXX matter?", a: "An 11-character code ending in XXX points to the bank's head office, so it means the same as the 8-character version. ABSAZAJJ and ABSAZAJJXXX are the same destination." },
  { q: "What details does someone abroad need to send me money?", a: "Usually your full name as it appears on the account, your account number (or IBAN), your bank's name and address, and its SWIFT/BIC code. Some banks also ask for a branch code or a reference. Get the exact details from your bank's app or website rather than a directory." },
  { q: "Why did I receive less than was sent?", a: "International transfers can pass through one or more intermediary (correspondent) banks, which may each take a fee, and the receiving bank may charge too. If the money is converted, the exchange rate can include a margin as well. Ask the sender which fee option they chose and check your bank's incoming payment fees." },
  { q: "Should I tell my bank I'm travelling?", a: "Check your bank's app first. Many banks no longer need travel notices and use your card activity instead, but some still let you add trip dates. Turn on instant transaction alerts so you spot a blocked or fraudulent payment straight away." },
  { q: "Can I open a Swiss bank account as a South African or Zimbabwean?", a: "Dukascopy Bank says its Multi-Currency Account can be opened by residents of most countries, except a listed set that includes the United States, Japan and Russia. Check the current list on Dukascopy's FAQ before applying. South African residents also need to follow the South African Reserve Bank's rules on moving money offshore." },
  { q: "How much money can a South African take offshore?", a: "Since 8 April 2026, adult South African residents have a single discretionary allowance of R2 million per calendar year, up from R1 million. It covers travel spending abroad and gifts, and can be used for offshore investment. Ask your bank or a registered tax practitioner before moving larger amounts." },
];

export default function BankingHub() {
  const countries = ["ZA", "ZW", "KE", "NG", "ZM"];
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-uj pb-14 pt-6 sm:pb-20 sm:pt-8">
          <div className="[&_a]:text-paper/80 [&_span]:text-paper/60">
            <Breadcrumbs items={[{ name: "Banking", href: "/banking" }]} />
          </div>
          <div className="mt-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={goHref("dukascopy", { placement: "banking-hero" })}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 font-semibold text-[#101c30] shadow-lg shadow-black/20 ring-1 ring-white/20 transition hover:-translate-y-0.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101c30] text-white"><Shield className="h-4 w-4" /></span>
                Dukascopy Bank
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="text-sm text-paper/70">
                Our banking partner.{" "}
                <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>
              </p>
            </div>
            <p className="label-mono mt-8 text-[#ffb59e]">Uncle Jetlag Banking</p>
            <h1 className="mt-4 text-[clamp(2.4rem,1.4rem+4.4vw,4.8rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">
              Your money should travel as easily as you do.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">
              A backup account on a different bank, the right details for receiving money from abroad, and SWIFT codes you can trust.
              Plain answers, checked against the banks&apos; own websites.
            </p>
            <p className="mt-6 text-sm text-paper/55">Last reviewed {formatDate(REVIEWED)}</p>
          </div>
        </div>
      </section>

      <div className="container-uj mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="label-mono text-muted">On this page</p>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="block rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line hover:bg-sand lg:rounded-lg lg:bg-transparent lg:px-2 lg:ring-0">{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-[48rem] space-y-16 text-[1.05rem] leading-relaxed text-ink-2">
          <section id="second-account" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Wallet className="h-7 w-7 text-jet" /> Why travellers keep a second account</h2>
            <p className="mt-4">
              Cards get blocked, swallowed by ATMs or refused abroad, and some local cards simply don&apos;t work well outside their home
              country. The fix is boring and effective: a second account and card <strong className="text-ink">from a different bank</strong>, kept
              separately from your main one.
            </p>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">A different bank, not just a different card.</strong> If your bank&apos;s systems go down or flag your card, a second card from the same bank often fails too.</li>
              <li><strong className="text-ink">Hold the currency you&apos;ll spend.</strong> A multi-currency account lets you receive and keep euros, dollars or pounds without converting every time.</li>
              <li><strong className="text-ink">Keep them apart.</strong> Carry the backup card in a different bag from your main wallet.</li>
            </ul>
            <p className="mt-4">More on building this setup in <Link href="/money/best-ways-to-pay-while-traveling" className="text-sky underline">the best ways to pay while travelling</Link>.</p>
          </section>

          <section id="dukascopy" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Shield className="h-7 w-7 text-jet" /> Dukascopy Bank: a Swiss account opened by video call</h2>
            <p className="mt-4">
              Dukascopy Bank is a Swiss bank in Geneva, regulated by FINMA. Its <strong className="text-ink">Multi-Currency Account</strong> gives you
              Swiss IBANs in 24 currencies and prepaid Visa and Mastercard cards, and you open it from home on a short video call.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-palm-soft/60 p-5">
                <p className="label-mono text-palm">What it&apos;s good for</p>
                <ul className="mt-2 space-y-1 text-[0.95rem]">
                  <li>A backup account on a different bank</li>
                  <li>Receiving and holding money in 24 currencies</li>
                  <li>Open from most countries, including many in Africa</li>
                  <li>Free to open; free to maintain with 5+ DUK+ tokens</li>
                  <li>Deposits insured up to CHF 100,000, the bank says</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-jet-soft/60 p-5">
                <p className="label-mono text-jet-ink">Know before you apply</p>
                <ul className="mt-2 space-y-1 text-[0.95rem]">
                  <li>Cards are prepaid, not debit or credit</li>
                  <li>Card FX mark-up of 1.5% to 2%</li>
                  <li>In-account exchange from 1% up to USD 10,000</li>
                  <li>Not available to residents of some countries, including the US</li>
                  <li>Heavy dormancy charge if the bank loses contact with you</li>
                </ul>
              </div>
            </div>
            <ContextCTA slug="dukascopy" placement="banking-dukascopy" kicker="Our banking partner" title="Open a Swiss Multi-Currency Account from home" className="mt-6">
              Check that your country of residence is eligible, then apply in the Dukascopy app or online and verify your identity by video call.
              You&apos;ll need a passport. Read <Link href="/money/dukascopy-multi-currency-account-review" className="underline">our full Dukascopy review</Link> for every fee, including the downsides.
            </ContextCTA>
            <p className="mt-4 text-[0.95rem]">
              <strong className="text-ink">South African residents:</strong> moving money into a foreign account falls under the Reserve Bank&apos;s rules.
              Read our guide to the <Link href="/money/sarb-single-discretionary-allowance-r2-million" className="text-sky underline">R2 million single discretionary allowance</Link>.
            </p>
          </section>

          <section id="receive" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink"><Globe className="h-7 w-7 text-jet" /> Receiving money from abroad</h2>
            <p className="mt-4">Whether it&apos;s a client, family or a refund, the sender usually needs:</p>
            <ul className="mt-4 space-y-2">
              {[
                "Your full name exactly as it appears on the account",
                "Your account number, or IBAN in countries that use them",
                "Your bank's name and address",
                "Your bank's SWIFT/BIC code",
                "Any reference or branch code your bank asks for",
              ].map((i) => (
                <li key={i} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-palm" /><span>{i}</span></li>
              ))}
            </ul>
            <p className="mt-4">
              <strong className="text-ink">Take these details from your bank&apos;s app or website,</strong> not from a directory or an old email.
              Many banks have an &ldquo;international payments&rdquo; or &ldquo;receive money from abroad&rdquo; page with the exact format they want.
            </p>
          </section>

          <section id="swift" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">SWIFT/BIC codes, explained</h2>
            <p className="mt-4">A SWIFT code, also called a BIC, identifies a bank in international payments. It has 8 or 11 characters:</p>
            <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <div className="grid grid-cols-4 text-center font-mono text-lg font-semibold text-ink sm:text-2xl">
                <div className="border-r border-line p-4">ABSA</div>
                <div className="border-r border-line p-4">ZA</div>
                <div className="border-r border-line p-4">JJ</div>
                <div className="p-4 text-muted">XXX</div>
              </div>
              <div className="grid grid-cols-4 border-t border-line text-center text-xs text-muted sm:text-sm">
                <div className="border-r border-line p-3">Bank</div>
                <div className="border-r border-line p-3">Country</div>
                <div className="border-r border-line p-3">Location</div>
                <div className="p-3">Branch (optional)</div>
              </div>
            </div>
            <p className="mt-4">
              An 11-character code ending in <span className="font-mono">XXX</span> means the head office, so it&apos;s the same as the 8-character
              code. A SWIFT code is <strong className="text-ink">not</strong> your account number and not an IBAN.
            </p>
          </section>

          <section id="codes" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">SWIFT codes for major banks</h2>
            <p className="mt-4">
              Each code below was read on the bank&apos;s own website or an official central-bank list. Follow the link to see it at the source.
              For more countries, search the <Link href="/tools/bank-directory" className="text-sky underline">full bank directory</Link> or use
              our <Link href="/tools/swift-code-checker" className="text-sky underline">SWIFT/BIC checker</Link>.
            </p>
            <div className="mt-5 rounded-2xl border border-jet/30 bg-jet-soft/50 p-5 text-[0.95rem]">
              <p className="flex items-start gap-3"><Alert className="mt-0.5 h-5 w-5 shrink-0 text-jet" /><span><strong className="text-ink">Always confirm with your own bank before sending money.</strong> Some banks use a different code for specific currencies or branches, and codes can change after mergers. A wrong code can delay or misdirect a payment.</span></p>
            </div>
            <div className="mt-6 space-y-8">
              {countries.map((c) => {
                const href = countryHref(c);
                return (
                  <div key={c}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-xl font-semibold text-ink">{flag(c)} {countryName(c)}</h3>
                      {href && <Link href={href} className="text-sm font-semibold text-sky underline">Banking in {countryName(c)}</Link>}
                    </div>
                    <div className="mt-3"><InstitutionTable items={institutionsIn(c)} /></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-line">
              <p className="font-display text-xl font-semibold text-ink">Bank not listed?</p>
              <p className="mt-2 text-[0.95rem]">We only list codes we can trace to an official source. For any other bank:</p>
              <ul className="mt-4 space-y-3">
                <li><Link href="/tools/global-banking" className="font-semibold text-sky underline">Uncle Jetlag Global Banking</Link><span className="block text-sm text-muted">Our directory for 15 countries, plus the SWIFT/BIC checker and IBAN validator.</span></li>
                <li><a href="https://www2.swift.com/bsl/index.faces" target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1.5 font-semibold text-sky underline">SWIFT&apos;s official BIC search<ArrowUpRight className="h-4 w-4" /></a><span className="block text-sm text-muted">The official lookup from SWIFT itself.</span></li>
                <li><span className="font-semibold text-ink">Your bank&apos;s app or statement</span><span className="block text-sm text-muted">The most reliable source for your own account&apos;s details.</span></li>
              </ul>
            </div>
          </section>

          <section id="fees" className="scroll-mt-28">
            <h2 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Fees to watch on international transfers</h2>
            <ul className="mt-4 space-y-2">
              <li><strong className="text-ink">Sending fee.</strong> What the sender&apos;s bank charges to send the payment.</li>
              <li><strong className="text-ink">Intermediary fees.</strong> Payments can pass through correspondent banks that each take a cut, so less arrives than was sent.</li>
              <li><strong className="text-ink">Receiving fee.</strong> Many banks charge to credit an incoming international payment.</li>
              <li><strong className="text-ink">Exchange-rate margin.</strong> If the money is converted, the rate you get may be worse than the mid-market rate. See <Link href="/money/how-foreign-exchange-fees-work" className="text-sky underline">how foreign exchange fees work</Link>, and check rates in our <a href="https://converter.qefxmoney.com" className="text-sky underline">currency converter</a>.</li>
            </ul>
          </section>

          <section id="faq" aria-labelledby="bank-faq" className="scroll-mt-28">
            <h2 id="bank-faq" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">Banking FAQ</h2>
            <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">{f.q}</summary>
                  <p className="px-5 pb-5 text-[0.98rem] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <p className="text-sm text-muted">
            General information, not financial advice. Dukascopy Bank is an affiliate partner: we may earn a referral commission if you open an
            account through our links, and it doesn&apos;t change your fees. See our <Link href="/affiliate-disclosure" className="underline">affiliate disclosure</Link>.
          </p>
        </article>
      </div>
      <JsonLd data={faqLd(faqs)} />
    </>
  );
}
