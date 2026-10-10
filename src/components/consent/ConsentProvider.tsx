"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Lightweight consent store + Google Consent Mode v2 bridge.
 * NOTE: For EEA/UK/Swiss traffic Google requires a Google-certified CMP (IAB TCF v2.2)
 * to serve AdSense. Before enabling ads there, replace <CookieBanner/> with a certified
 * CMP (e.g. Google's own "Privacy & messaging") and keep this provider as the
 * app-level source of truth by calling `save()` from the CMP callback.
 */
export type Consent = { v: 1; analytics: boolean; ads: boolean; ts: number };

type Ctx = {
  consent: Consent | null;
  ready: boolean;
  save: (c: Omit<Consent, "v" | "ts">) => void;
  openSettings: () => void;
  settingsOpen: boolean;
  closeSettings: () => void;
};

const ConsentContext = createContext<Ctx | null>(null);
const COOKIE = "uj_consent";

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

function read(): Consent | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (!m) return null;
    const c = JSON.parse(decodeURIComponent(m[1])) as Consent;
    return c.v === 1 ? c : null;
  } catch {
    return null;
  }
}

function applyToGoogle(c: Consent) {
  const w = window as GtagWindow;
  w.gtag?.("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.ads ? "granted" : "denied",
    ad_user_data: c.ads ? "granted" : "denied",
    ad_personalization: c.ads ? "granted" : "denied",
  });
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const c = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from cookie once on mount
    setConsent(c);
    if (c) applyToGoogle(c);
    setReady(true);
    const open = () => setSettingsOpen(true);
    window.addEventListener("uj:open-consent", open);
    return () => window.removeEventListener("uj:open-consent", open);
  }, []);

  const save = useCallback((c: Omit<Consent, "v" | "ts">) => {
    const full: Consent = { v: 1, ts: Date.now(), ...c };
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(full))}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
    setConsent(full);
    applyToGoogle(full);
    setSettingsOpen(false);
    // Previously loaded third-party scripts can retain cookies/listeners after consent is revoked.
    // Reload to ensure the page starts with the new denied consent state.
    if (consent?.ads && !full.ads) window.location.reload();
  }, [consent]);

  return (
    <ConsentContext.Provider
      value={{ consent, ready, save, settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false) }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside <ConsentProvider>");
  return ctx;
}

/** Inline script for <head>: Consent Mode v2 defaults (denied) before any Google tag loads. */
export const consentDefaultsScript = `
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
gtag('set','ads_data_redaction',true);`;
