/**
 * First-party tracking cookies that Travelpayouts scripts write on our own domain, and their removal
 * whenever the permission that allowed them is missing (Phase 3A).
 *
 * Observed on 13 October 2026 (production unclejetlag.com and the PR #9 preview), with their actual
 * attributes:
 * | Cookie            | Set by                                                         | Domain                         | Path | Secure | Lifetime   |
 * |-------------------|----------------------------------------------------------------|--------------------------------|------|--------|------------|
 * | `_sp_id.<4 hex>`  | Snowplow tracker loaded by the Travelpayouts flight search (avsplow.com) | registrable domain (`unclejetlag.com`) or the full host where that is a public suffix | `/` | yes | 13 months |
 * | `_sp_ses.<4 hex>` | same                                                           | same                           | `/`  | yes    | 30 minutes |
 * | `am_user_session` | Travelpayouts Drive                                            | host-only                      | `/`  | no     | 30 minutes |
 *
 * Source check on the preview: Drive alone (advertising consent, flight search not loaded) set only
 * `am_user_session`; loading only the flight search set `_sp_id`/`_sp_ses`. So the two groups belong
 * to two different permissions:
 * - FLIGHT_ANALYTICS: the separate flight-search analytics permission (uj_flight_analytics cookie);
 * - DRIVE: advertising consent (uj_consent.ads).
 *
 * The 4-hex suffix differs per site (`.43e4` on unclejetlag.com, `.4e6c` on the preview), so names
 * are matched by pattern. Only these exact patterns are removed. Consent, preference, authentication
 * and security cookies (uj_consent, uj_flight_analytics, Vercel's _vercel_jwt, anything else) are
 * never touched.
 */
export const FLIGHT_ANALYTICS_COOKIE_PATTERNS: readonly RegExp[] = [/^_sp_id\.[0-9a-f]{4}$/, /^_sp_ses\.[0-9a-f]{4}$/];
export const DRIVE_COOKIE_PATTERNS: readonly RegExp[] = [/^am_user_session$/];
export const TRACKING_COOKIE_PATTERNS: readonly RegExp[] = [...FLIGHT_ANALYTICS_COOKIE_PATTERNS, ...DRIVE_COOKIE_PATTERNS];

const matches = (patterns: readonly RegExp[], name: string) => patterns.some((re) => re.test(name));
export const isTrackingCookie = (name: string) => matches(TRACKING_COOKIE_PATTERNS, name);

/**
 * Domains a cookie on `hostname` could have been set for: the host itself and each parent domain with
 * at least two labels (e.g. www.unclejetlag.com → www.unclejetlag.com, unclejetlag.com). The browser
 * ignores a Domain it would never have accepted (such as a public suffix), so trying extra ones is safe.
 */
export function cookieDomainCandidates(hostname: string): string[] {
  if (!hostname || /^[\d.]+$/.test(hostname) || hostname.includes(":")) return [];
  const labels = hostname.split(".");
  const out: string[] = [];
  for (let i = 0; i <= labels.length - 2; i++) out.push(labels.slice(i).join("."));
  return out;
}

/** The Set-Cookie strings that expire `name` for every place it can live (host-only and each domain). */
export function expiryStrings(name: string, hostname: string, secure: boolean): string[] {
  const base = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure ? "; Secure" : ""}`;
  return [base, ...cookieDomainCandidates(hostname).map((d) => `${base}; Domain=${d}`)];
}

type Doc = Pick<Document, "cookie">;
type Loc = Pick<Location, "hostname" | "protocol">;

/** Delete every cookie in `doc` matching `patterns`. Returns the names removed (for tests and logs). */
export function clearCookies(patterns: readonly RegExp[], doc: Doc = document, loc: Loc = location): string[] {
  const names = [...new Set(doc.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean))].filter((n) => matches(patterns, n));
  for (const name of names) for (const s of expiryStrings(name, loc.hostname, loc.protocol === "https:")) doc.cookie = s;
  return names;
}

/** What the visitor currently allows. Anything not explicitly allowed is treated as refused. */
export type TrackingPermissions = { ads: boolean; flightAnalytics: boolean };

/**
 * Delete the tracking cookies whose permission is missing: Drive's without advertising consent, the
 * flight-search analytics cookies without the flight-search analytics permission. Runs on every page
 * load and on withdrawal, so a visitor without the permission never keeps these cookies.
 */
export function clearUnpermittedTrackingCookies(p: TrackingPermissions, doc: Doc = document, loc: Loc = location): string[] {
  const patterns = [...(p.flightAnalytics ? [] : FLIGHT_ANALYTICS_COOKIE_PATTERNS), ...(p.ads ? [] : DRIVE_COOKIE_PATTERNS)];
  return patterns.length ? clearCookies(patterns, doc, loc) : [];
}
