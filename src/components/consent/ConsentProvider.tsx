"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { EmbeddedServiceId } from "@/lib/consent/services";
import { clearAdvertisingCookies } from "@/lib/consent/tracking-cookies";

/**
 * Lightweight consent store + Google Consent Mode v2 bridge.
 * NOTE: For EEA/UK/Swiss traffic Google requires a Google-certified CMP (IAB TCF v2.2)
 * to serve AdSense. Before enabling ads there, replace <CookieBanner/> with a certified
 * CMP (e.g. Google's own "Privacy & messaging") and keep this provider as the
 * app-level source of truth by calling `save()` from the CMP callback.
 *
 * Embedded tools (booking searches, the Genki calculator) have a second, separate permission:
 * `activate(id)` records that the visitor pressed that tool's own "Load" button. Activations live
 * in memory for the current visit only, are never written to the consent cookie, and never grant
 * advertising consent. See src/lib/consent/services.ts.
 */
export type Consent = { v: 1; analytics: boolean; ads: boolean; ts: number };

type Ctx = {
  consent: Consent | null;
  ready: boolean;
  save: (c: Omit<Consent, "v" | "ts">) => void;
  openSettings: () => void;
  settingsOpen: boolean;
  closeSettings: () => void;
  /** Embedded tools the visitor has explicitly asked to load during this visit. */
  activated: ReadonlySet<EmbeddedServiceId>;
  activate: (id: EmbeddedServiceId) => void;
};

const ConsentContext = createContext<Ctx | null>(null);
const COOKIE = "uj_consent";
/** sessionStorage flag: clear advertising cookies again on the page load that follows a withdrawal. */
const CLEAR_AFTER_RELOAD = "uj:clear-ad-cookies";

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
  const [activated, setActivated] = useState<ReadonlySet<EmbeddedServiceId>>(() => new Set());
  const current = useRef<Consent | null>(null);

  useEffect(() => {
    const c = read();
    try {
      if (sessionStorage.getItem(CLEAR_AFTER_RELOAD)) {
        sessionStorage.removeItem(CLEAR_AFTER_RELOAD);
        if (!c?.ads) clearAdvertisingCookies();
      }
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from cookie once on mount
    setConsent(c);
    current.current = c;
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
    const withdrawingAds = Boolean(current.current?.ads) && !full.ads;
    current.current = full;
    setConsent(full);
    applyToGoogle(full);
    setSettingsOpen(false);
    // Third-party scripts that already ran (Travelpayouts Drive, loaded widgets) can't be unloaded and
    // may keep listeners or rewritten links. Delete the tracking cookies they wrote on our own domain,
    // then reload so the page restarts in the new, denied state.
    if (withdrawingAds) {
      clearAdvertisingCookies();
      // A tracker still running on this page can rewrite its cookie while the page unloads, so clear
      // once more as soon as the reloaded page starts (see the mount effect).
      try {
        sessionStorage.setItem(CLEAR_AFTER_RELOAD, "1");
      } catch {
        /* storage unavailable: the immediate clear above still ran */
      }
      window.location.reload();
    }
  }, []);

  const activate = useCallback((id: EmbeddedServiceId) => {
    setActivated((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  return (
    <ConsentContext.Provider
      value={{ consent, ready, save, settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false), activated, activate }}
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
