import { DiscoverCarsWidget } from "@/components/partners/DiscoverCarsWidget";
import { goHref } from "@/data/partners";

/** Car Rentals block (Jetlag Guides hub and Car Rentals topic page): DiscoverCars search plus a plain affiliate link. */
export function CarRentalsSection({ className = "mt-20" }: { className?: string }) {
  const href = goHref("discovercars", { placement: "guides-car-rentals" });
  return (
    <section id="car-rentals" aria-labelledby="car-rentals-heading" className={`container-uj scroll-mt-24 ${className}`}>
      <p className="label-mono mb-3 text-jet-ink">Book &amp; go</p>
      <h2 id="car-rentals-heading" className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.08] text-ink">
        Car Rentals
      </h2>
      <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">Find and compare rental cars for your next adventure.</p>

      <div className="mt-8">
        <DiscoverCarsWidget fallbackHref={href} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={href}
          rel="sponsored nofollow noopener"
          target="_blank"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#101c30] px-6 py-3 font-semibold text-white hover:opacity-90 sm:w-auto"
        >
          Explore Car Rentals Worldwide
        </a>
        <p className="text-sm text-muted">
          Affiliate partner: Uncle Jetlag may earn a commission from qualifying bookings, at no extra cost to you.{" "}
          <a href="/affiliate-disclosure" className="underline">How this works</a>
        </p>
      </div>
    </section>
  );
}
