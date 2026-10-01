/**
 * Event tracking architecture. Privacy first: no names, emails or IDs, only what we need to
 * learn which destinations, tools, partners and placements are useful.
 *
 * Events go to window.dataLayer (picked up by GA4/GTM when the visitor has consented to
 * analytics) and to any listener of the `uj:track` DOM event. Affiliate clicks are also logged
 * server-side by /go/[partner].
 */
export type TrackEvent =
  | "affiliate_link_click"
  | "discount_code_copy"
  | "esim_search"
  | "destination_search"
  | "partner_comparison"
  | "travel_tool_open"
  | "destination_view"
  | "newsletter_signup"
  | "outbound_booking_click";

export type TrackProps = {
  partner?: string;
  destination?: string;
  page?: string;
  placement?: string;
  campaign?: string;
  tool?: string;
  query?: string;
  [k: string]: string | number | boolean | undefined;
};

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };

export function deviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

export function track(event: TrackEvent, props: TrackProps = {}) {
  if (typeof window === "undefined") return;
  const payload = { ...props, page: props.page ?? window.location.pathname, device_type: deviceType() };
  const w = window as W;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...payload });
  // gtag respects Consent Mode: nothing is stored unless analytics consent was given.
  w.gtag?.("event", event, payload);
  window.dispatchEvent(new CustomEvent("uj:track", { detail: { event, ...payload } }));
}
