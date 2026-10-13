"use client";

import { useEffect, useRef, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";
import { FLIGHT_ANALYTICS, mayLoadFlightSearch } from "@/lib/consent/services";

/**
 * Informed, separate consent for the Travelpayouts flight search (Phase 3A).
 *
 * The flight search can't load without Travelpayouts' behavioural analytics (`_sp_id.*`: a unique ID
 * and visit timestamps, kept about 13 months), and Travelpayouts documents no way to switch that off.
 * So nothing inside `children` mounts, and nothing is requested from Travelpayouts, until the visitor
 * presses "Allow and load flight search" here (or ticks the same permission in Cookie settings).
 *
 * - "Accept all" / advertising consent does not count, and allowing this grants nothing else.
 * - "No thanks" is remembered and loads nothing; the visitor can review the choice at any time.
 * - Once allowed, a "Turn off" control sits under the search: it deletes the analytics cookies on our
 *   domain and reloads the page without the search.
 */
export function FlightSearchConsent({ children, minHeight = 260 }: { children: React.ReactNode; minHeight?: number }) {
  const { ready, flightAnalytics, setFlightAnalytics } = useConsent();
  const allowed = mayLoadFlightSearch({ ready, flightAnalytics });
  const regionRef = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [idCookie, sesCookie] = FLIGHT_ANALYTICS.cookies;

  useEffect(() => {
    if (allowed && requested) regionRef.current?.focus();
  }, [allowed, requested]);

  if (allowed) {
    return (
      <div>
        <div ref={regionRef} tabIndex={-1} role="region" aria-label="Flight search from Travelpayouts" data-consent-loaded="travelpayouts-flights" className="outline-none">
          {children}
        </div>
        <p className="mt-2 text-xs text-muted">
          Travelpayouts analytics is on for this flight search.{" "}
          <button type="button" onClick={() => setFlightAnalytics(false)} className="font-medium text-sky underline">
            Turn off
          </button>{" "}
          (deletes its cookies and reloads the page).
        </p>
      </div>
    );
  }

  const headingId = "consent-gate-travelpayouts-flights";

  if (ready && flightAnalytics === false && !reviewing) {
    return (
      <div data-consent-placeholder="travelpayouts-flights" data-consent-state="declined" role="group" aria-labelledby={headingId} className="rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line">
        <p id={headingId} className="text-base font-semibold text-ink">
          Flight search not loaded
        </p>
        <p className="mt-1 text-sm text-ink-2">You chose not to allow Travelpayouts analytics, which this flight search needs. Nothing was loaded from Travelpayouts.</p>
        <button type="button" onClick={() => setReviewing(true)} className="mt-3 text-sm font-medium text-sky underline">
          Review this choice
        </button>
      </div>
    );
  }

  return (
    <div
      data-consent-placeholder="travelpayouts-flights"
      data-consent-state={flightAnalytics === false ? "declined" : "undecided"}
      role="group"
      aria-labelledby={headingId}
      className="flex w-full flex-col justify-center rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line sm:p-6"
      style={{ minHeight }}
    >
      <p className="label-mono text-[0.7rem] text-muted">Provided by {FLIGHT_ANALYTICS.provider}</p>
      <p id={headingId} className="mt-2 text-lg font-semibold text-ink">
        Allow Travelpayouts analytics to use the flight search?
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
        This flight search is run by Travelpayouts and only works with Travelpayouts&apos; {FLIGHT_ANALYTICS.purpose} switched on. Uncle Jetlag
        can&apos;t turn that off, so the search loads only if you allow it.
      </p>
      <ul className="mt-3 max-w-prose list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-2">
        <li>
          <strong>Cookies on this site:</strong> <code>{idCookie.name}</code> stores {idCookie.stores}, for {idCookie.lifetime}; <code>{sesCookie.name}</code> tracks{" "}
          {sesCookie.stores}, for {sesCookie.lifetime}.
        </li>
        <li>
          <strong>Data sent:</strong> details of your visit and how you use the search go to Travelpayouts&apos; analytics and monitoring services.
        </li>
        <li>
          <strong>Separate choice:</strong> this doesn&apos;t switch on advertising cookies, and &ldquo;Accept all&rdquo; doesn&apos;t switch this on.
        </li>
        <li>
          <strong>Change your mind any time</strong> in Cookie settings or with &ldquo;Turn off&rdquo; under the search. We then delete these cookies.
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRequested(true);
            setFlightAnalytics(true);
          }}
          className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          Allow and load flight search
        </button>
        <button
          type="button"
          onClick={() => {
            setReviewing(false);
            setFlightAnalytics(false);
          }}
          className="inline-flex h-11 items-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink"
        >
          No thanks
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">
        More in our <a href="/cookies#flight-search-analytics-travelpayouts" className="underline">Cookie Policy</a>.
      </p>
    </div>
  );
}
