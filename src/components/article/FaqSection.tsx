import type { Faq } from "@/lib/content/schema";
import { JsonLd } from "@/components/ui/JsonLd";
import { faqLd } from "@/lib/seo";
import { Chevron } from "@/components/ui/icons";

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <section aria-labelledby="faq" className="mt-14">
      <h2 id="faq" className="text-[clamp(1.55rem,1.2rem+1.2vw,2rem)] font-semibold text-ink">Frequently asked questions</h2>
      <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {faqs.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <Chevron className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqLd(faqs)} />
    </section>
  );
}
