import { ExpediaStaysWidget } from "@/components/partners/ExpediaStaysWidget";

/** Hotels & Stays block on the Jetlag Guides hub: official Expedia Group stays search. */
export function HotelsStaysSection() {
  return (
    <section id="hotels-stays" aria-labelledby="hotels-stays-heading" className="container-uj mt-20 scroll-mt-24">
      <p className="label-mono mb-3 text-jet-ink">Book &amp; go</p>
      <h2 id="hotels-stays-heading" className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.08] text-ink">
        Hotels &amp; Stays
      </h2>
      <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">Find your next home away from home.</p>

      <div className="mt-8">
        <ExpediaStaysWidget />
      </div>

      <p className="mt-4 text-sm text-muted">
        Uncle Jetlag may earn a commission when you book through our partner links, at no additional cost to you.{" "}
        <a href="/affiliate-disclosure" className="underline">How this works</a>
      </p>
    </section>
  );
}
