"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";
import { ADSENSE_CLIENT, AD_SLOTS, SHOW_AD_PLACEHOLDERS, type AdPosition } from "./ads-config";
import { cn } from "@/lib/utils";

/**
 * A tasteful, optional ad location. Renders NOTHING unless:
 *  - NEXT_PUBLIC_ADSENSE_CLIENT is configured AND the visitor granted ad consent, or
 *  - NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS=true (layout preview only).
 */
export function AdSlot({ position, className }: { position: AdPosition; className?: string }) {
  const { consent } = useConsent();
  const ref = useRef<HTMLModElement>(null);
  const pathname = usePathname();
  const live = Boolean(ADSENSE_CLIENT && consent?.ads);

  useEffect(() => {
    if (!live || !ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      const w = window as Window & { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* ad blockers etc. — fail silently */
    }
  }, [live, pathname]);

  const frame = cn(
    "not-prose my-10 flex flex-col items-center",
    position === "sidebar" ? "min-h-[250px]" : "min-h-[120px]",
    className,
  );

  if (live) {
    return (
      <aside className={frame} aria-label="Advertisement">
        <span className="label-mono mb-2 !text-[0.6rem] text-muted">Advertisement</span>
        <ins
          key={pathname}
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight: position === "sidebar" ? 250 : 100 }}
          data-ad-client={ADSENSE_CLIENT}
          {...(AD_SLOTS[position] ? { "data-ad-slot": AD_SLOTS[position] } : {})}
          data-ad-format={position === "mid-article" ? "fluid" : "auto"}
          {...(position === "mid-article" ? { "data-ad-layout": "in-article" } : {})}
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  if (SHOW_AD_PLACEHOLDERS) {
    return (
      <aside className={cn(frame, "justify-center rounded-2xl border border-dashed border-ink/20 bg-sand/40")} aria-label="Ad placeholder">
        <span className="label-mono text-muted">Ad slot · {position}</span>
      </aside>
    );
  }

  return null;
}
