"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Official Expedia Group search widget(s). Add a product here when Expedia issues its widget code.
 *
 * eg-widgets.js scans for .eg-widget only once, on DOMContentLoaded. After Next.js client-side
 * navigation that event never fires again, so a script tag in JSX would leave an empty box.
 * The untouched official snippets therefore live in /embeds/expedia-*.html, loaded here in a
 * same-origin frame: every visit gets a fresh document and the widget always initialises. The
 * embed reports its height so the frame fits the widget with no inner scrollbar.
 *
 * Loads for every visitor once the section is near the viewport, like the DiscoverCars widget.
 */
const PRODUCTS = {
  stays: { embed: "expedia-stays", title: "Search hotels and stays with Expedia" },
} as const;

export function ExpediaWidget({ product }: { product: keyof typeof PRODUCTS }) {
  const { embed, title } = PRODUCTS[product];
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [height, setHeight] = useState(0);

  const show = nearViewport;

  useEffect(() => {
    const el = boxRef.current;
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
    if (!show) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { type?: string; embed?: string; height?: number };
      if (d?.type === "uj-embed-height" && d.embed === embed && typeof d.height === "number") {
        setHeight(Math.min(Math.max(d.height, 0), 4000));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [show, embed]);

  return (
    <div ref={boxRef} className="w-full max-w-full overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line">
      {show && (
        <iframe
          ref={frameRef}
          src={`/embeds/${embed}.html`}
          title={title}
          loading="lazy"
          className="block w-full border-0"
          style={{ height: height > 0 ? `${height}px` : "320px" }}
        />
      )}
    </div>
  );
}
