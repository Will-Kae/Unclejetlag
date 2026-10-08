"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DiscoverCarsWidget } from "@/components/partners/DiscoverCarsWidget";
import { ExpediaWidget } from "@/components/partners/ExpediaWidget";
import { TravelpayoutsFlightsWidget } from "@/components/partners/TravelpayoutsFlightsWidget";
import { goHref } from "@/data/partners";
import { Bed, Car, Plane } from "@/components/ui/icons";

/**
 * Homepage booking panel: Book a flight / Book a hotel / Book a car.
 * Each partner search mounts the first time its tab opens and then stays mounted (just hidden),
 * so switching back and forth never reloads a widget or creates a duplicate.
 * Flights = Travelpayouts, hotels = Expedia, cars = DiscoverCars.
 * Links to #book-flights, #book-hotels or #book-cars (the hero shortcuts) open that tab and scroll here.
 */
type TabKey = "flights" | "hotels" | "cars";

const TABS: { key: TabKey; label: string; Icon: typeof Plane }[] = [
  { key: "flights", label: "Book a flight", Icon: Plane },
  { key: "hotels", label: "Book a hotel", Icon: Bed },
  { key: "cars", label: "Book a car", Icon: Car },
];

export function BookingTabs() {
  const [active, setActive] = useState<TabKey>("flights");
  const [opened, setOpened] = useState<Set<TabKey>>(() => new Set<TabKey>(["flights"]));
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ flights: null, hotels: null, cars: null });

  const open = (k: TabKey, focus = false) => {
    setActive(k);
    setOpened((prev) => (prev.has(k) ? prev : new Set(prev).add(k)));
    if (focus) tabRefs.current[k]?.focus();
  };

  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#book-(flights|hotels|cars)$/);
      if (!m) return;
      const k = m[1] as TabKey;
      setActive(k);
      setOpened((prev) => (prev.has(k) ? prev : new Set(prev).add(k)));
      document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = TABS.length;
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % n;
    else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = n - 1;
    if (j >= 0) {
      e.preventDefault();
      open(TABS[j].key, true);
    }
  };

  return (
    <div className="rounded-[calc(var(--radius-card)+6px)] bg-[#101c30] p-2 shadow-card sm:p-3">
      <div role="tablist" aria-label="Book your trip" className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {TABS.map(({ key, label, Icon }, i) => {
          const selected = active === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              id={`book-tab-${key}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`book-panel-${key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => open(key)}
              onKeyDown={(e) => onKey(e, i)}
              data-track="booking_tab"
              data-tool={label}
              className={`flex flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] px-2 py-3 text-center text-sm font-semibold transition sm:flex-row sm:gap-2 sm:py-3.5 sm:text-base ${
                selected ? "bg-white text-[#101c30]" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 sm:mt-3">
        <div id="book-panel-flights" role="tabpanel" aria-labelledby="book-tab-flights" hidden={active !== "flights"}>
          {opened.has("flights") && <TravelpayoutsFlightsWidget />}
        </div>

        <div id="book-panel-hotels" role="tabpanel" aria-labelledby="book-tab-hotels" hidden={active !== "hotels"}>
          {opened.has("hotels") && <ExpediaWidget product="stays" />}
        </div>

        <div id="book-panel-cars" role="tabpanel" aria-labelledby="book-tab-cars" hidden={active !== "cars"}>
          {opened.has("cars") && <DiscoverCarsWidget fallbackHref={goHref("discovercars", { placement: "home-booking-tabs" })} />}
        </div>
      </div>

      <p className="px-2 pb-1 pt-3 text-xs text-white/60">
        Flights by Travelpayouts, hotels by Expedia, car hire by DiscoverCars. We may earn a commission, at no extra cost to you.{" "}
        <Link href="/affiliate-disclosure" className="underline">How this works</Link>
      </p>
    </div>
  );
}
