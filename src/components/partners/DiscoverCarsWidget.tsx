"use client";

import { useEffect, useRef, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * Official DiscoverCars affiliate search widget.
 *
 * The attributes below are copied from the DiscoverCars widget generator. Do not change the
 * tracking attributes (data-utm-*, data-aff-*) without checking the DiscoverCars dashboard.
 *
 * Loading rules:
 * - The loader script is injected once, into this component's own container, after mount.
 *   It renders an iframe beside the script tag. On unmount the container is emptied, so
 *   client-side navigation back to the page never produces a second widget.
 * - It loads automatically for visitors who accepted advertising cookies, once the section is
 *   near the viewport. Everyone else gets a one-click "Show car search" button, because the
 *   widget is a third-party embed that can set DiscoverCars cookies.
 */
const WIDGET_SRC = "https://www.discovercars.com/widget.js?v1";

const WIDGET_ATTRS: Record<string, string> = {
  id: "dchwidget",
  "data-dev-env": "com",
  "data-location": "",
  "data-lang": "uk",
  "data-currency": "usd",
  "data-utm-source": "unclejetlag",
  "data-utm-medium": "widget",
  "data-aff-code": "a_aid",
  "data-aff-channel": "code1",
  "data-autocomplete": "on",
  "data-style-submit-bg-color": "#101c30",
  "data-style-submit-font-color": "#ffffff",
  "data-style-form-bg-color": "#ffffff",
  "data-style-form-font-color": "#101c30",
  "data-style-submit-text": "Search now",
  "data-style-title-color": "#101c30",
  "data-title-text": "Uncle's search and compare car rentals and save up to 70%!",
  "data-style_rounded_corners": "on",
  "data-localization_currency_box": "on",
  "data-layout_benefits": "on",
  "data-layout_description": "on",
  "data-layout_description_text": "Uncle Jetlag has selected the best deals from our car rental partners.",
  "data-layout_logo_style": "on dark",
  "data-layout_style_form_bg_color": "#101c30",
  "data-layout_title": "on",
  "data-layout_top_logo": "on",
  "data-layout_supplier_logos": "on",
};

export function DiscoverCarsWidget({ fallbackHref }: { fallbackHref: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { consent, ready } = useConsent();
  const [requested, setRequested] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const [failed, setFailed] = useState(false);

  const allowed = requested || Boolean(consent?.ads);

  // Wait until the section is close to the viewport before fetching anything.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- old browsers: load straight away
      setNearViewport(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !ready || !allowed || !nearViewport) return;
    // Guard against double injection (React Strict Mode, fast refresh, repeat renders).
    if (host.querySelector("#dchwidget") || document.getElementById("dchwidget")) return;

    const wrap = document.createElement("div");
    const s = document.createElement("script");
    for (const [k, v] of Object.entries(WIDGET_ATTRS)) s.setAttribute(k, v);
    s.async = true;
    s.src = WIDGET_SRC;
    s.onerror = () => setFailed(true);
    wrap.appendChild(s);
    host.appendChild(wrap);

    return () => {
      host.replaceChildren();
    };
  }, [ready, allowed, nearViewport]);

  return (
    <div className="dc-widget w-full max-w-full overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line">
      <div ref={hostRef} className="min-h-[1px] w-full" />
      {!allowed && ready && (
        <div className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <p className="font-display text-xl font-semibold text-ink">Uncle&apos;s search and compare car rentals and save up to 70%!</p>
          <p className="max-w-xl text-muted">
            The search box is provided by DiscoverCars and may set their cookies. Load it here, or open DiscoverCars in a new tab.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRequested(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#101c30] px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              Show car search
            </button>
            <a href={fallbackHref} rel="sponsored nofollow noopener" target="_blank" className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold text-ink ring-1 ring-line hover:bg-sand">
              Open DiscoverCars
            </a>
          </div>
        </div>
      )}
      {failed && (
        <p className="p-6 text-muted">
          The car search didn&apos;t load. You can still{" "}
          <a href={fallbackHref} rel="sponsored nofollow noopener" target="_blank" className="font-semibold text-sky underline">
            compare car hire prices on DiscoverCars
          </a>
          .
        </p>
      )}
    </div>
  );
}
