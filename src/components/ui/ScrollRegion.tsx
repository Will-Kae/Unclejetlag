"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal scroll wrapper for wide tables. When (and only when) the content overflows, the region
 * becomes keyboard-focusable and named, so keyboard users can scroll it (WCAG 2.1.1; axe
 * "scrollable-region-focusable"). It starts focusable so the server-rendered page is accessible before
 * hydration, then drops the tab stop when nothing overflows.
 */
export function ScrollRegion({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Focusable by default (server render and before hydration); trimmed once we can measure.
  const [scrollable, setScrollable] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      {...(scrollable ? { tabIndex: 0, role: "region", "aria-label": label } : {})}
    >
      {children}
    </div>
  );
}
