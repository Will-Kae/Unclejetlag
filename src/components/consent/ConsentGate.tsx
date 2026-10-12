"use client";

import { useEffect, useRef, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";
import { EMBEDDED_SERVICES, mayLoadEmbedded, type EmbeddedServiceId } from "@/lib/consent/services";

/**
 * Click-to-load wrapper for an embedded third-party tool (Phase 3A).
 *
 * Nothing inside `children` is mounted, so nothing is requested from the provider, until either:
 * - the visitor has accepted advertising cookies, or
 * - the visitor presses this tool's own "Load" button (an activation for this visit only, which does
 *   not grant advertising consent and does not load any other tool or tracking script).
 * The placeholder itself loads nothing from third parties.
 */
export function ConsentGate({
  service,
  children,
  minHeight = 240,
  fallback,
}: {
  service: EmbeddedServiceId;
  children: React.ReactNode;
  /** Placeholder height in px, close to the tool's height, to limit layout shift. */
  minHeight?: number;
  /** Optional alternative shown under the button, e.g. a plain partner link. */
  fallback?: React.ReactNode;
}) {
  const { ready, consent, activated, activate } = useConsent();
  const { tool, provider } = EMBEDDED_SERVICES[service];
  const allowed = mayLoadEmbedded({ ready, ads: Boolean(consent?.ads), activated: activated.has(service) });
  const regionRef = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);

  // After a button press, move focus to the loaded tool so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (allowed && requested) regionRef.current?.focus();
  }, [allowed, requested]);

  if (allowed) {
    return (
      <div ref={regionRef} tabIndex={-1} role="region" aria-label={`${capitalise(tool)} from ${provider}`} data-consent-loaded={service} className="outline-none">
        {children}
      </div>
    );
  }

  const headingId = `consent-gate-${service}`;
  return (
    <div
      data-consent-placeholder={service}
      role="group"
      aria-labelledby={headingId}
      className="flex w-full flex-col justify-center rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line sm:p-6"
      style={{ minHeight }}
    >
      <p className="label-mono text-[0.7rem] text-muted">Provided by {provider}</p>
      <p id={headingId} className="mt-2 text-lg font-semibold text-ink">
        Load the {tool}?
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">
        This {tool} comes from {provider}. Loading it connects your browser to {provider}, which may set its own cookies and record that
        you came from Uncle Jetlag. It doesn&apos;t switch on advertising cookies on Uncle Jetlag, and nothing loads until you choose.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRequested(true);
            activate(service);
          }}
          className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          Load {tool}
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("uj:open-consent"))}
          className="text-sm font-medium text-sky underline"
        >
          Cookie settings
        </button>
      </div>
      {fallback && <div className="mt-3 text-sm text-ink-2">{fallback}</div>}
      <p className="mt-3 text-xs text-muted">
        More in our <a href="/cookies" className="underline">Cookie Policy</a>.
      </p>
    </div>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
