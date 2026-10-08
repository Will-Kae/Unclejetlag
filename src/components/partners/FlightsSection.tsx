import { TravelpayoutsFlightsWidget } from "@/components/partners/TravelpayoutsFlightsWidget";

/** Flights block (Jetlag Guides hub and Flights topic page): official Travelpayouts flight search. */
export function FlightsSection({ className = "mt-20" }: { className?: string }) {
  return (
    <section id="flights" aria-labelledby="flights-heading" className={`container-uj scroll-mt-24 ${className}`}>
      <p className="label-mono mb-3 text-jet-ink">Book &amp; go</p>
      <h2 id="flights-heading" className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.08] text-ink">
        Flights
      </h2>
      <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
        Discover your next destination. Search and compare flights worldwide.
      </p>

      <div className="mt-8">
        <TravelpayoutsFlightsWidget />
      </div>

      <p className="mt-4 text-sm text-muted">
        Uncle Jetlag may earn a commission when you book through our partner links, at no additional cost to you.{" "}
        <a href="/affiliate-disclosure" className="underline">How this works</a>
      </p>
    </section>
  );
}
