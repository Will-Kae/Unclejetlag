"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GoogleFcWindow = Window & {
  googlefc?: { callbackQueue?: Array<Record<string, () => void>>; showRevocationMessage?: () => void };
  __tcfapi?: (
    command: string,
    version: number,
    callback: (data: { gdprApplies?: boolean } | null, success: boolean) => void,
  ) => void;
};
import { useConsent } from "./ConsentProvider";

export function CookieBanner() {
  const { consent, ready, save, settingsOpen, closeSettings, flightAnalytics } = useConsent();
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const [flights, setFlights] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form with stored consent when reopened
      setCustom(true);
      setAnalytics(consent?.analytics ?? false);
      setAds(consent?.ads ?? false);
      setFlights(flightAnalytics === true);
    }
  }, [settingsOpen, consent, flightAnalytics]);

  if (!ready || (consent && !settingsOpen)) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg animate-rise rounded-2xl border border-ink/10 bg-white p-4 shadow-lift sm:p-5 sm:inset-x-auto sm:left-6 sm:bottom-6"
    >
      <p id="cookie-title" className="font-display text-lg font-semibold">Cookies, briefly.</p>
      <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted sm:text-sm">
        Essential cookies keep the site running. With your OK, we&apos;ll also use analytics and advertising cookies to
        learn what&apos;s useful and keep the guides free. See our{" "}
        <Link className="font-medium text-sky underline" href="/cookies">Cookie Policy</Link>.
      </p>

      {custom && (
        <fieldset className="mt-4 space-y-3 rounded-xl bg-paper p-4 text-sm">
          <legend className="sr-only">Cookie preferences</legend>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-ink" />
            <span><strong>Essential:</strong> required for the site to work. Always on.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5 h-4 w-4 accent-jet" />
            <span><strong>Analytics:</strong> anonymous usage stats that tell us which guides help.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} className="mt-0.5 h-4 w-4 accent-jet" />
            <span><strong>Advertising:</strong> lets ad partners show and measure ads.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={flights} onChange={(e) => setFlights(e.target.checked)} className="mt-0.5 h-4 w-4 accent-jet" />
            <span>
              <strong>Flight search analytics (Travelpayouts):</strong> needed to load the flight search. Travelpayouts stores a unique ID and your
              visit times in <code>_sp_id.*</code> for about 13 months. Not included in &ldquo;Accept all&rdquo;.
            </span>
          </label>
        </fieldset>
      )}

      <div className="mt-3 flex flex-wrap gap-2 [&>button]:h-9 [&>button]:px-3.5 sm:[&>button]:h-10 sm:[&>button]:px-4">
        {custom ? (
          <button onClick={() => save({ analytics, ads, flightAnalytics: flights || flightAnalytics !== null ? flights : undefined })} className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-paper">
            Save choices
          </button>
        ) : (
          <button onClick={() => setCustom(true)} className="h-10 rounded-full border border-ink/15 px-4 text-sm font-semibold">
            Customise
          </button>
        )}
        <button onClick={() => save({ analytics: false, ads: false, flightAnalytics: flightAnalytics === true ? false : undefined })} className="h-10 rounded-full border border-ink/15 px-4 text-sm font-semibold">
          Essential only
        </button>
        <button onClick={() => save({ analytics: true, ads: true })} className="h-10 rounded-full bg-jet px-4 text-sm font-semibold text-white">
          Accept all
        </button>
        {settingsOpen && consent && (
          <button onClick={closeSettings} className="h-10 px-2 text-sm text-muted underline">Cancel</button>
        )}
      </div>
    </div>
  );
}

export function CookieSettingsButton({ className }: { className?: string }) {
  const [googleCmpReady, setGoogleCmpReady] = useState(false);

  useEffect(() => {
    // Google's supported callback is only fired once its certified CMP API is ready.
    // This does NOT grant consent, load ads, or mistake uj_consent for a TCF decision.
    const w = window as GoogleFcWindow;
    w.googlefc = w.googlefc || {};
    w.googlefc.callbackQueue = w.googlefc.callbackQueue || [];
    // Google recommends displaying the revocation entrypoint only when TCF
    // confirms GDPR applies. API readiness alone does not establish that.
    w.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        if (typeof w.__tcfapi !== "function") return;
        w.__tcfapi("addEventListener", 0, (data, success) => {
          setGoogleCmpReady(
            Boolean(success && data?.gdprApplies && typeof w.googlefc?.showRevocationMessage === "function"),
          );
        });
      },
    });
  }, []);

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("uj:open-consent"))}>
        Cookie settings
      </button>
      {googleCmpReady && (
        <button
          type="button"
          className={className}
          onClick={() => {
            const w = window as GoogleFcWindow;
            w.googlefc?.showRevocationMessage?.();
          }}
        >
          Google advertising privacy choices
        </button>
      )}
    </span>
  );
}
