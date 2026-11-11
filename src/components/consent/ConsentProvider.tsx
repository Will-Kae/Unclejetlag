"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { FLIGHT_ANALYTICS, type EmbeddedServiceId } from "@/lib/consent/services";
import { clearUnpermittedTrackingCookies } from "@/lib/consent/tracking-cookies";

/**
 * Lightweight first-party consent store + analytics Consent Mode bridge.
 * NOTE: For EEA/UK/Swiss traffic Google requires a Google-certified CMP (IAB TCF v2.2)
 * to serve AdSense. A certified CMP must separately manage Google's advertising
 * signals and TCF choices. Never treat `uj_consent.ads` as certified Google consent.
 *
 * Embedded tools (booking searches, the Genki calculator) have a second, separate permission:
 * `activate(id)` records that the visitor pressed that tool's own "Load" button. Activations live
 * in memory for the current visit only, are never written to the consent cookie, and never grant
 * advertising consent. See src/lib/consent/services.ts.
 *
 * The Travelpayouts flight search has a third permission, `flightAnalytics`: the visitor's informed
 * allow/decline for Travelpayouts' behavioural analytics, which the search can't run without. It is
 * stored in its own cookie (uj_flight_analytics), so allowing it never answers the cookie banner, and
 * "Accept site preferences" never sets it. null = not decided yet.
 */
export type Consent = { v: 1; analytics: boolean; ads: boolean; ts: number };

type Ctx = {
  consent: Consent | null;
  ready: boolean;
  /** Save banner choices. Pass `flightAnalytics` only to change the flight-search permission too. */
  save: (c: Omit<Consent, "v" | "ts"> & { flightAnalytics?: boolean }) => void;
  /** Flight-search analytics permission: true allowed, false declined, null not decided. */
  flightAnalytics: boolean | null;
  setFlightAnalytics: (granted: boolean) => void;
  openSettings: () => void;
  settingsOpen: boolean;
  closeSettings: () => void;
  /** Embedded tools the visitor has explicitly asked to load during this visit. */
  activated: ReadonlySet<EmbeddedServiceId>;
  activate: (id: EmbeddedServiceId) => void;
};

const ConsentContext = createContext<Ctx | null>(null);
const COOKIE = "uj_consent";
const FLIGHT_COOKIE = FLIGHT_ANALYTICS.cookie;

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

function readFlightAnalytics(): boolean | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${FLIGHT_COOKIE}=([^;]*)`));
    if (!m) return null;
    const c = JSON.parse(decodeURIComponent(m[1])) as { v: number; granted: unknown };
    return c.v === 1 && typeof c.granted === "boolean" ? c.granted : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: unknown, maxAgeDays: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${60 * 60 * 24 * maxAgeDays}; SameSite=Lax${secure}`;
}

function applyToGoogle(c: Consent) {
  const w = window as GtagWindow;
  w.gtag?.("consent", "update", {
    // Site analytics consent is independent of Google's certified advertising CMP.
    // Never infer Google ad consent from the first-party affiliate preference (c.ads).
    // Google advertising signals remain at their denied defaults until a verified
    // certified CMP integration controls them separately.
    analytics_storage: c.analytics ? "granted" : "denied",
  });
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activated, setActivated] = useState<ReadonlySet<EmbeddedServiceId>>(() => new Set());
  const [flightAnalytics, setFlightState] = useState<boolean | null>(null);
  const current = useRef<Consent | null>(null);
  const flights = useRef<boolean | null>(null);

  useEffect(() => {
    const c = read();
    const f = readFlightAnalytics();
    // On every page load, delete Travelpayouts tracking cookies on our domain that the visitor hasn't
    // allowed. This also catches a tracker rewriting its cookie while the previous page unloaded.
    clearUnpermittedTrackingCookies({ ads: Boolean(c?.ads), flightAnalytics: f === true });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from cookie once on mount
    setConsent(c);
    setFlightState(f);
    current.current = c;
    flights.current = f;
    if (c) applyToGoogle(c);
    setReady(true);
    const open = () => setSettingsOpen(true);
    window.addEventListener("uj:open-consent", open);
    return () => window.removeEventListener("uj:open-consent", open);
  }, []);

  /** Withdrawal: delete the tracking cookies no longer allowed, then restart the page without the scripts. */
  const withdraw = useCallback(() => {
    // Third-party scripts that already ran (Travelpayouts Drive, the flight search, loaded widgets) can't
    // be unloaded and may keep listeners or rewritten links. The mount effect clears once more after the
    // reload, in case a tracker rewrites its cookie while this page unloads.
    clearUnpermittedTrackingCookies({ ads: Boolean(current.current?.ads), flightAnalytics: flights.current === true });
    window.location.reload();
  }, []);

  /** Store the flight-search permission. Returns true when this withdraws an earlier "allow". */
  const storeFlights = useCallback((granted: boolean) => {
    const withdrawing = flights.current === true && !granted;
    writeCookie(FLIGHT_COOKIE, { v: 1, ts: Date.now(), granted }, FLIGHT_ANALYTICS.maxAgeDays);
    flights.current = granted;
    setFlightState(granted);
    return withdrawing;
  }, []);

  const save = useCallback(
    ({ flightAnalytics: f, ...c }: Omit<Consent, "v" | "ts"> & { flightAnalytics?: boolean }) => {
      const full: Consent = { v: 1, ts: Date.now(), analytics: c.analytics, ads: c.ads };
      writeCookie(COOKIE, full, 180);
      const withdrawingAds = Boolean(current.current?.ads) && !full.ads;
      current.current = full;
      setConsent(full);
      applyToGoogle(full);
      setSettingsOpen(false);
      const withdrawingFlights = f === undefined ? false : storeFlights(f);
      if (withdrawingAds || withdrawingFlights) withdraw();
    },
    [storeFlights, withdraw],
  );

  const setFlightAnalytics = useCallback(
    (granted: boolean) => {
      if (storeFlights(granted)) withdraw();
    },
    [storeFlights, withdraw],
  );

  const activate = useCallback((id: EmbeddedServiceId) => {
    setActivated((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  return (
    <ConsentContext.Provider
      value={{ consent, ready, save, flightAnalytics, setFlightAnalytics, settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false), activated, activate }}
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
