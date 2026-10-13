"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";
import { ADSENSE_ACTIVE, ADSENSE_CLIENT } from "@/components/monetization/ads-config";
import { mayLoadAdvertising, TRAVELPAYOUTS_DRIVE_SRC } from "@/lib/consent/services";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Loads GA4 only after analytics consent, and Travelpayouts Drive only after advertising consent.
 * AdSense is switched off pending a verified certified CMP. The first-party affiliate
 * preference must never authorize Google advertising or the Google publisher tag. Pressing an embedded tool's
 * "Load" button never loads Drive: that is a separate permission (src/lib/consent/services.ts).
 */
export function ThirdPartyScripts() {
  const { consent, ready } = useConsent();
  const ads = mayLoadAdvertising({ ready, ads: Boolean(consent?.ads) });
  // Preview CMP probe: hostname-restricted, no ad slots and no consent grant.
  const [stagingCmpProbe, setStagingCmpProbe] = useState(false);
  useEffect(() => {
    setStagingCmpProbe(window.location.hostname === "staging.unclejetlag.com");
  }, []);

  useEffect(() => {
    if (!ads || document.getElementById("travelpayouts-drive")) return;
    const script = document.createElement("script");
    script.id = "travelpayouts-drive";
    script.async = true;
    script.setAttribute("data-cmp-ab", "2");
    script.src = TRAVELPAYOUTS_DRIVE_SRC;
    document.head.appendChild(script);
    // A vendor script can't be unloaded once it has run; withdrawing consent reloads the page
    // (ConsentProvider.save), which starts again without it.
  }, [ads]);

  return (
    <>
      {(ADSENSE_ACTIVE || stagingCmpProbe) && (
        <Script id="adsense-consented" strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
      )}
      {GA_ID && consent?.analytics && (
        <>
          <Script id="ga4-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <Script id="ga4-init" strategy="afterInteractive">
            {`gtag('js', new Date()); gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      )}
    </>
  );
}
