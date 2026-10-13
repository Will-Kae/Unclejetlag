/**
 * Third-party services and the permission each one needs (Phase 3A).
 *
 * Two different permissions, never mixed:
 * - "ads": the visitor's advertising/tracking consent, stored in the uj_consent cookie (CookieBanner).
 *   Required for Travelpayouts Drive and the CJ impression pixel. Nothing else grants it.
 * - "activation": an explicit request to load one embedded tool (a booking search or calculator),
 *   made by pressing that tool's own "Load" button. It loads that tool only, for the current visit,
 *   is never written to the consent cookie and never implies advertising consent.
 *
 * Embedded tools also load automatically once advertising consent has been given, because they
 * carry affiliate tracking and may set the provider's cookies.
 *
 * Affiliate identifiers stay in the widget components; this file only describes the services.
 */
export type EmbeddedServiceId = "travelpayouts-flights" | "expedia-stays" | "discovercars" | "genki-calculator";

export type EmbeddedService = {
  id: EmbeddedServiceId;
  /** What the visitor gets, e.g. "flight search". Used in the placeholder and button. */
  tool: string;
  provider: string;
  /** Hosts the browser contacts once the tool loads (for documentation and tests). */
  hosts: string[];
};

export const EMBEDDED_SERVICES: Record<EmbeddedServiceId, EmbeddedService> = {
  "travelpayouts-flights": { id: "travelpayouts-flights", tool: "flight search", provider: "Travelpayouts", hosts: ["tpwidg.com"] },
  "expedia-stays": { id: "expedia-stays", tool: "hotel and stays search", provider: "Expedia Group", hosts: ["creator.expediagroup.com"] },
  discovercars: { id: "discovercars", tool: "car hire search", provider: "DiscoverCars", hosts: ["widget.discovercars.com"] },
  "genki-calculator": { id: "genki-calculator", tool: "health insurance calculator", provider: "Genki", hosts: ["widgets.genki.world"] },
};

/** Advertising/tracking scripts: load only with advertising consent. Never activated by a button. */
export const TRAVELPAYOUTS_DRIVE_SRC = "https://emrldtp.cc/NTgyNzYz.js?t=582763";

export type GateInput = { ready: boolean; ads: boolean; activated: boolean };

/**
 * Whether an embedded tool may load. Before the consent cookie has been read (ready=false) nothing
 * loads, so a returning visitor who declined never gets a flash of third-party content.
 */
export const mayLoadEmbedded = ({ ready, ads, activated }: GateInput) => ready && (ads || activated);

/** Whether advertising/tracking scripts may load. A tool activation never counts. */
export const mayLoadAdvertising = ({ ready, ads }: Pick<GateInput, "ready" | "ads">) => ready && ads;
