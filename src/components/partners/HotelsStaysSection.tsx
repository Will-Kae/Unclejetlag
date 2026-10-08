import { ExpediaWidget } from "@/components/partners/ExpediaWidget";

/** Hotels & Stays block (Jetlag Guides hub and Hotels topic page): official Expedia Group stays search. */
export function HotelsStaysSection({ className = "mt-20" }: { className?: string }) {
  return (
    <section id="hotels-stays" aria-labelledby="hotels-stays-heading" className={`container-uj scroll-mt-24 ${className}`}>
      <p className="label-mono mb-3 text-jet-ink">Book &amp; go</p>
      <h2 id="hotels-stays-heading" className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.08] text-ink">
        Hotels &amp; Stays
      </h2>
      <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">Find your next home away from home.</p>

      <div className="mt-8">
        <ExpediaWidget product="stays" />
      </div>

      <p className="mt-4 text-sm text-muted">
        Uncle Jetlag may earn a commission when you book through our partner links, at no additional cost to you.{" "}
        <a href="/affiliate-disclosure" className="underline">How this works</a>
      </p>
    </section>
  );
}
