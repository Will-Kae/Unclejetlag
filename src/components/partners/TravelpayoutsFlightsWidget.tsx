"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Official Travelpayouts flight search widget.
 *
 * The loader URL below is exactly as issued by Travelpayouts. Do not change its parameters:
 * trs, shmarker, promo_id and campaign_id carry the affiliate tracking.
 *
 * The loader renders a <tp-cascoon> element (shadow DOM) right before its own script tag, so the
 * script is injected into this component's container after mount. On unmount the container is
 * emptied, so client-side navigation never leaves a second widget behind, and coming back
 * re-injects a fresh one. Searches open the partner results in a new tab.
 */
const WIDGET_SRC =
  "https://tpwidg.com/content?currency=usd&trs=582763&shmarker=786947.786947&locale=en&stops=any&show_hotels=false&powered_by=true&border_radius=0&plain=false&color_button=%23101C30&color_button_text=%23ffffff&promo_id=3414&campaign_id=111";

export function TravelpayoutsFlightsWidget() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [failed, setFailed] = useState(false);

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
    if (!host || !nearViewport) return;
    // Guard against double injection (React Strict Mode, fast refresh, repeat renders).
    if (host.querySelector("script, tp-cascoon")) return;

    const s = document.createElement("script");
    s.async = true;
    s.charset = "utf-8";
    s.src = WIDGET_SRC;
    s.onerror = () => setFailed(true);
    host.appendChild(s);

    return () => {
      host.replaceChildren();
    };
  }, [nearViewport]);

  return (
    // No overflow-hidden here: the widget's date picker and airport list pop out past the box.
    <div className="relative w-full max-w-full rounded-[var(--radius-card)] bg-white p-3 ring-1 ring-line sm:p-4">
      <div ref={hostRef} className="min-h-[1px] w-full max-w-full" />
      {failed && <p className="p-4 text-muted">The flight search didn&apos;t load. Please refresh the page or try again shortly.</p>}
    </div>
  );
}
