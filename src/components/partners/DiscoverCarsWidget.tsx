"use client";

import { useEffect, useRef, useState } from "react";
import { ConsentGate } from "@/components/consent/ConsentGate";
import { DISCOVERCARS_FRAME_TITLE, discoverCarsFrameUrl } from "@/lib/partners/discovercars";

/** Load the audited provider frame directly, avoiding the parent-page loader's isRTL error.
 * The provider's own frame scripts remain under DiscoverCars' control.
 */
export function DiscoverCarsWidget({ fallbackHref }: { fallbackHref: string }) {
  return (
    <ConsentGate service="discovercars" minHeight={320} fallback={
      <>Prefer not to load it? <a href={fallbackHref} rel="sponsored nofollow noopener" target="_blank" className="font-semibold text-sky underline">Compare car hire prices on DiscoverCars</a>.</>
    }>
      <DiscoverCarsFrame fallbackHref={fallbackHref} />
    </ConsentGate>
  );
}

function DiscoverCarsFrame({ fallbackHref }: { fallbackHref: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const load = () => setSrc(discoverCarsFrameUrl(window.location.origin));
    if (!("IntersectionObserver" in window)) { load(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { load(); observer.disconnect(); }
    }, { rootMargin: "600px 0px" });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="w-full min-w-0 max-w-full rounded-[var(--radius-card)] bg-white ring-1 ring-line">
      {src && <iframe id="discoFrameId" src={src} title={DISCOVERCARS_FRAME_TITLE} className="block h-[900px] w-full border-0 sm:h-[640px]" />}
      <p className="p-4 text-sm text-muted">
        <a href={fallbackHref} rel="sponsored nofollow noopener" target="_blank" className="font-semibold text-sky underline">Compare car hire prices on DiscoverCars</a>
      </p>
    </div>
  );
}
