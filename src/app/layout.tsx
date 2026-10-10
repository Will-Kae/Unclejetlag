import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site, SITE_URL } from "@/data/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EsimPromoBar } from "@/components/esim/EsimPromoBar";
import { Footer } from "@/components/layout/Footer";
import { ConsentProvider, consentDefaultsScript } from "@/components/consent/ConsentProvider";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { ThirdPartyScripts } from "@/components/monetization/ThirdPartyScripts";
import { ADSENSE_CLIENT } from "@/components/monetization/ads-config";
import { JsonLd } from "@/components/ui/JsonLd";
import { AnalyticsListener } from "@/components/analytics/AnalyticsListener";
import { organizationLd, websiteLd } from "@/lib/seo";

// Self-hosted variable fonts (OFL) — no build-time call to Google Fonts, no layout shift.
const fraunces = localFont({
  src: [{ path: "./fonts/fraunces-standard-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "serif"],
});
// Italic is only used for accents, so it's loaded separately and not preloaded.
const frauncesItalic = localFont({
  src: [{ path: "./fonts/fraunces-standard-italic.woff2", weight: "100 900", style: "italic" }],
  variable: "--font-fraunces-italic",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const inter = localFont({
  src: [{ path: "./fonts/inter-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const mono = localFont({
  src: [{ path: "./fonts/jetbrains-mono-wght-normal.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: `${site.founder.name} (${site.founder.penName})`, url: `${SITE_URL}${site.founder.url}` }],
  creator: site.name,
  publisher: site.name,
  category: "travel",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    url: "/",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [{ url: "/brand/og-default.jpg", width: 1200, height: 630, alt: "Uncle Jetlag" }],
  },
  twitter: { card: "summary_large_image", site: site.twitterHandle, images: ["/brand/og-default.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  other: ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : undefined,
  formatDetection: { telephone: false },
  icons: { icon: [{ url: "/brand/avatar-192.png", type: "image/png", sizes: "192x192" }] },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${frauncesItalic.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        {/* Impact.com affiliate network site verification (two Impact verifications: newest first, earlier one kept) */}
        <meta name="impact-site-verification" {...{ value: "e3f65cdf-b28c-4507-9fd4-e102d360a10e" }} />
        <meta name="impact-site-verification" {...{ value: "2cabb71a-44d5-414f-b1d4-dedb993fc5aa" }} />
        <script id="consent-defaults" dangerouslySetInnerHTML={{ __html: consentDefaultsScript }} />
        {/* Travelpayouts Drive is loaded by ThirdPartyScripts only after advertising consent.
            Do not place its executable loader in server-rendered head markup. */}
        {ADSENSE_CLIENT && (
          // AdSense code in <head> (site verification + Auto ads). Consent Mode defaults above load first,
          // so Google only uses cookies/personalisation after the visitor opts in.
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
        )}
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-paper">
          Skip to content
        </a>
        <ConsentProvider>
          <EsimPromoBar />
          <SiteHeader />
          <main id="main">{children}</main>
          <Footer />
          <CookieBanner />
          <ThirdPartyScripts />
          <AnalyticsListener />
        </ConsentProvider>
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </body>
    </html>
  );
}
