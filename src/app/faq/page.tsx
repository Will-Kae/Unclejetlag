import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { Chevron } from "@/components/ui/icons";
import { faqGroups } from "@/data/faq";
import { buildMetadata, faqLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Got questions? Uncle Jetlag has answers. Visas, money, banking, destinations, connectivity and life abroad: the things travellers ask us most.",
  path: "/faq",
  ogKicker: "FAQ",
});

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function FaqPage() {
  const all = faqGroups.flatMap((g) => g.items.map(({ q, a }) => ({ q, a })));
  return (
    <section className="container-uj pb-10 pt-6 sm:pt-8">
      <Breadcrumbs items={[{ name: "FAQ", href: "/faq" }]} />
      <header className="mt-10 max-w-3xl">
        <p className="label-mono text-jet-ink">FAQ</p>
        <h1 className="mt-3 text-[clamp(2.3rem,1.5rem+3.5vw,4rem)] font-semibold leading-[1.02]">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-muted">
          Got questions? Uncle Jetlag has answers. From visas and money to destinations, connectivity and navigating life abroad, here are
          some of the things travellers ask us most.
        </p>
        <nav aria-label="FAQ sections" className="mt-6 flex flex-wrap gap-2">
          {faqGroups.map((g) => (
            <a key={g.title} href={`#${slug(g.title)}`} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-line hover:bg-paper">
              {g.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-12 max-w-3xl space-y-12">
        {faqGroups.map((g) => (
          <section key={g.title} id={slug(g.title)} aria-labelledby={`${slug(g.title)}-h`} className="scroll-mt-24">
            <h2 id={`${slug(g.title)}-h`} className="text-[clamp(1.55rem,1.2rem+1.2vw,2rem)] font-semibold text-ink">
              {g.title}
            </h2>
            <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              {g.items.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">
                    <span>{f.q}</span>
                    <Chevron className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 leading-relaxed text-ink-2">
                    <p>{f.a}</p>
                    {f.link && (
                      <p className="mt-3">
                        <Link href={f.link.href} className="font-semibold text-sky underline">
                          {f.link.label} →
                        </Link>
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 max-w-3xl text-muted">
        Still stuck? <Link href="/contact" className="font-semibold text-sky underline">Get in touch</Link> and we&apos;ll point you in the
        right direction.
      </p>
      <JsonLd data={faqLd(all)} />
    </section>
  );
}
