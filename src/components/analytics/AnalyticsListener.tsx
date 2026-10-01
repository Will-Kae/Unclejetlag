"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * One delegated listener instead of onClick handlers everywhere:
 * - any link to /go/[partner] fires affiliate_link_click (placement from data-placement or the URL)
 * - any element with data-track="event" fires that event with its data-* props
 * - destination pages fire destination_view
 */
export function AnalyticsListener() {
  const pathname = usePathname();

  useEffect(() => {
    const m = pathname.match(/^\/destinations\/([a-z-]+)$/);
    if (m) track("destination_view", { destination: m[1] });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("a[href^='/go/'], [data-track]");
      if (!el) return;
      const ds = el.dataset;
      if (el instanceof HTMLAnchorElement && el.getAttribute("href")?.startsWith("/go/")) {
        const u = new URL(el.href);
        track("affiliate_link_click", {
          partner: u.pathname.split("/")[2],
          destination: u.searchParams.get("d") ?? undefined,
          placement: u.searchParams.get("p") ?? ds.placement,
          campaign: u.searchParams.get("c") ?? undefined,
        });
        return;
      }
      if (ds.track) {
        const { track: ev, ...rest } = ds;
        track(ev as Parameters<typeof track>[0], rest as Record<string, string>);
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
