"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Loads GA4 after analytics consent and Travelpayouts Drive after advertising consent. */
export function ThirdPartyScripts() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!consent?.ads || document.getElementById("travelpayouts-drive")) return;
    const script = document.createElement("script");
    script.id = "travelpayouts-drive";
    script.async = true;
    script.setAttribute("data-cmp-ab", "2");
    script.src = "https://emrldtp.cc/NTgyNzYz.js?t=582763";
    document.head.appendChild(script);
    // A vendor script cannot reliably be unloaded after execution.
    // Consent withdrawal triggers a clean reload from the cookie banner.
  }, [consent?.ads]);
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
