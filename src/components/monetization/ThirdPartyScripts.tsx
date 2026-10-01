"use client";

import Script from "next/script";
import { useConsent } from "@/components/consent/ConsentProvider";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Loads GA4 only after analytics consent. (AdSense loads in <head>; see layout.tsx.) */
export function ThirdPartyScripts() {
  const { consent } = useConsent();
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
