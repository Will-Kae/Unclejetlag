"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";
import { mayLoadAdvertising, TRAVELPAYOUTS_DRIVE_SRC } from "@/lib/consent/services";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Loads GA4 only after analytics consent, and Travelpayouts Drive only after advertising consent.
 * (AdSense loads in <head> under Google Consent Mode; see layout.tsx.) Pressing an embedded tool's
 * "Load" button never loads Drive: that is a separate permission (src/lib/consent/services.ts).
 */
export function ThirdPartyScripts() {
  const { consent, ready } = useConsent();
  const ads = mayLoadAdvertising({ ready, ads: Boolean(consent?.ads) });

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
