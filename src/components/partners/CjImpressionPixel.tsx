"use client";

import { useEffect, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * CJ impression pixel (1×1), exactly as issued by the advertiser.
 *
 * - Advertising tracking, so it only renders after the visitor has accepted advertising cookies.
 * - Fires at most once per page load per pixel URL: re-renders, remounts and client-side
 *   navigation back to the page never request it again. A full page reload counts as a new view.
 * - Not needed for click tracking: the CJ click link itself credits the referral.
 */
const fired = new Set<string>();

export function CjImpressionPixel({ src }: { src: string }) {
  const { consent } = useConsent();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!consent?.ads || fired.has(src)) return;
    fired.add(src);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot, after consent is known
    setShow(true);
  }, [consent?.ads, src]);

  if (!show) return null;
  // eslint-disable-next-line @next/next/no-img-element -- tracking pixel must load from the network as issued
  return <img src={src} width={1} height={1} alt="" aria-hidden="true" style={{ border: 0, position: "absolute", width: 1, height: 1, opacity: 0 }} />;
}
