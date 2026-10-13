/**
 * First-party cookies written on our own domain by Travelpayouts scripts, removed when the visitor
 * withdraws advertising consent (Phase 3A).
 *
 * Observed on 13 October 2026 (production unclejetlag.com and the PR #9 preview), with their actual
 * attributes:
 * | Cookie            | Set by                                                    | Domain                         | Path | Secure | Lifetime   |
 * |-------------------|-----------------------------------------------------------|--------------------------------|------|--------|------------|
 * | `_sp_id.<4 hex>`  | Snowplow tracker loaded by Travelpayouts (avsplow.com)    | registrable domain (`unclejetlag.com`) or the full host where that is a public suffix | `/` | yes | 13 months |
 * | `_sp_ses.<4 hex>` | same                                                      | same                           | `/`  | yes    | 30 minutes |
 * | `am_user_session` | Travelpayouts Drive                                       | host-only                      | `/`  | no     | 30 minutes |
 * The 4-hex suffix differs per site (`.43e4` on unclejetlag.com, `.4e6c` on the preview), so names
 * are matched by pattern.
 *
 * Only these exact patterns are removed. Consent, preference, authentication and security cookies
 * (uj_consent, Vercel's _vercel_jwt, anything else) are never touched.
 */
export const ADVERTISING_COOKIE_PATTERNS: readonly RegExp[] = [/^_sp_id\.[0-9a-f]{4}$/, /^_sp_ses\.[0-9a-f]{4}$/, /^am_user_session$/];

export const isAdvertisingCookie = (name: string) => ADVERTISING_COOKIE_PATTERNS.some((re) => re.test(name));

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

/** Delete the advertising cookies present in `doc`. Returns the names removed (for tests and logs). */
export function clearAdvertisingCookies(doc: Pick<Document, "cookie"> = document, loc: Pick<Location, "hostname" | "protocol"> = location): string[] {
  const names = [...new Set(doc.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean))].filter(isAdvertisingCookie);
  for (const name of names) for (const s of expiryStrings(name, loc.hostname, loc.protocol === "https:")) doc.cookie = s;
  return names;
}
