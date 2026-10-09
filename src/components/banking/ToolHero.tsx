import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

/** Dark hero used across the Global Banking pages (matches /security, /insurance, /banking). */
export function ToolHero({ crumbs, kicker, title, intro, children }: { crumbs: { name: string; href: string }[]; kicker: string; title: React.ReactNode; intro: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="bg-ink text-paper">
      <div className="container-uj pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="[&_a]:text-paper/80 [&_span]:text-paper/60">
          <Breadcrumbs items={crumbs} />
        </div>
        <div className="mt-10 max-w-3xl">
          <p className="label-mono text-[#ffb59e]">{kicker}</p>
          <h1 className="mt-4 text-[clamp(2.2rem,1.4rem+3.6vw,4.2rem)] font-semibold leading-[1] tracking-[-0.03em]">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-paper/80">{intro}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function Faq({ items, title = "Questions" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <section aria-labelledby="gb-faq" className="mt-16">
      <h2 id="gb-faq" className="text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold text-ink">{title}</h2>
      <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {items.map((f) => (
          <details key={f.q}>
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ink hover:bg-paper [&::-webkit-details-marker]:hidden">{f.q}</summary>
            <p className="px-5 pb-5 text-[0.98rem] leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Disclaimer() {
  return (
    <p className="mt-10 text-sm text-muted">
      Uncle Jetlag Global Banking is a free reference tool, not a bank or payment service. It can&apos;t confirm that an account exists, who owns it, or that a
      payment will arrive. Always confirm payment details with your bank or the recipient before sending money. Never share online banking passwords, PINs
      or one-time codes with anyone.
    </p>
  );
}
