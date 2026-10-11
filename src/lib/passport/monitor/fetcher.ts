/**
 * Safe fetcher for official sources.
 *
 * - URL validation and host allow-list on the first request and on every redirect (validateSourceUrl).
 * - DNS answers checked at connect time (guardedLookup in nodeHttpsTransport).
 * - Bounded responses: the body is streamed and the request aborted once maxBytes is exceeded.
 * - No compression (Accept-Encoding: identity), so a small response cannot expand into a large one.
 * - Conditional requests (If-None-Match / If-Modified-Since); 304 means unchanged.
 * - Allowed content types only: HTML, XHTML, plain text and PDF.
 * - An optional per-request gate (beforeRequest) runs before EVERY request, including each redirect hop
 *   to another path on the same host; the runner uses it to enforce robots.txt and rate limits.
 * - Retries with back-off for timeouts, network errors, 429 and 5xx; never for 4xx or blocked hosts.
 * The transport is injectable, so tests never touch the network.
 */
import dns from "node:dns";
import https from "node:https";
import { BlockedAddressError, guardedLookup, validateSourceUrl } from "./url-safety";

export type TransportRequest = { url: URL; headers: Record<string, string>; timeoutMs: number; maxBytes: number };
export type TransportResponse = { status: number; headers: Record<string, string>; body: Uint8Array };
export type Transport = (req: TransportRequest) => Promise<TransportResponse>;

export class TooLargeError extends Error { code = "ETOOLARGE"; }
export class TimeoutError extends Error { code = "ETIMEDOUT"; }

export const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "text/plain", "application/pdf"];

/** Production transport: node:https with SSRF-guarded DNS, no keep-alive, no proxy, streamed size limit. */
export function nodeHttpsTransport(lookup = guardedLookup(dns.lookup as never)): Transport {
  return (req) =>
    new Promise((resolve, reject) => {
      const r = https.request(req.url, { method: "GET", headers: req.headers, lookup: lookup as never, agent: false, timeout: req.timeoutMs }, (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > req.maxBytes) {
            r.destroy(new TooLargeError(`response exceeds ${req.maxBytes} bytes`));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => {
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
          resolve({ status: res.statusCode ?? 0, headers, body: new Uint8Array(Buffer.concat(chunks)) });
        });
        res.on("error", reject);
      });
      r.on("timeout", () => r.destroy(new TimeoutError(`no response within ${req.timeoutMs} ms`)));
      r.on("error", reject);
      r.end();
    });
}

export type FetchResult =
  | { kind: "ok"; status: number; finalUrl: string; redirects: string[]; contentType: string; body: Uint8Array; etag?: string; lastModified?: string }
  | { kind: "not-modified"; finalUrl: string; redirects: string[] }
  | { kind: "not-found"; status: number; finalUrl: string }
  | { kind: "blocked"; reason: string; status?: number }
  | { kind: "rate-limited"; status: number; retryAfter?: string }
  | { kind: "http-error"; status: number }
  | { kind: "timeout" }
  | { kind: "too-large" }
  | { kind: "network-error"; message: string }
  | { kind: "redirect-rejected"; location: string; reason: string }
  | { kind: "robots-disallowed"; url: string; reason: string }
  | { kind: "unsupported-content-type"; contentType: string };

export type FetchOptions = {
  transport: Transport;
  allowedHosts: ReadonlySet<string>;
  userAgent: string;
  etag?: string;
  lastModified?: string;
  maxBytes: number;
  timeoutMs: number;
  maxRedirects?: number;
  /** Accept only these content types (defaults to ALLOWED_CONTENT_TYPES). */
  accept?: string[];
  /** Called before every request (first and each redirect hop). A denial stops the fetch; nothing is sent. */
  beforeRequest?: (url: URL) => Promise<RequestGate>;
};

export type RequestGate = { allowed: true } | { allowed: false; reason: string };

export async function safeFetch(rawUrl: string, o: FetchOptions): Promise<FetchResult> {
  const first = validateSourceUrl(rawUrl, o.allowedHosts);
  if (!first.ok) return { kind: "blocked", reason: first.reason };
  let url = first.url;
  const redirects: string[] = [];
  const accept = o.accept ?? ALLOWED_CONTENT_TYPES;
  for (let hop = 0; hop <= (o.maxRedirects ?? 5); hop++) {
    const headers: Record<string, string> = { "user-agent": o.userAgent, accept: accept.join(", "), "accept-encoding": "identity" };
    if (hop === 0 && o.etag) headers["if-none-match"] = o.etag;
    if (hop === 0 && o.lastModified) headers["if-modified-since"] = o.lastModified;
    if (o.beforeRequest) {
      const gate = await o.beforeRequest(url);
      if (!gate.allowed) return { kind: "robots-disallowed", url: url.toString(), reason: gate.reason };
    }
    let res: TransportResponse;
    try {
      res = await o.transport({ url, headers, timeoutMs: o.timeoutMs, maxBytes: o.maxBytes });
    } catch (e) {
      if (e instanceof BlockedAddressError) return { kind: "blocked", reason: "blocked-address" };
      if (e instanceof TooLargeError) return { kind: "too-large" };
      if (e instanceof TimeoutError) return { kind: "timeout" };
      return { kind: "network-error", message: e instanceof Error ? e.message.slice(0, 200) : "unknown" };
    }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers["location"];
      if (!loc) return { kind: "http-error", status: res.status };
      let next: string;
      try {
        next = new URL(loc, url).toString();
      } catch {
        return { kind: "redirect-rejected", location: loc.slice(0, 300), reason: "url-invalid" };
      }
      const check = validateSourceUrl(next, o.allowedHosts);
      if (!check.ok) return { kind: "redirect-rejected", location: next.slice(0, 300), reason: check.reason };
      redirects.push(next);
      url = check.url;
      continue;
    }
    if (res.status === 304) return { kind: "not-modified", finalUrl: url.toString(), redirects };
    if (res.status === 404 || res.status === 410) return { kind: "not-found", status: res.status, finalUrl: url.toString() };
    if (res.status === 401 || res.status === 403 || res.status === 451) return { kind: "blocked", reason: "access-refused", status: res.status };
    if (res.status === 429) return { kind: "rate-limited", status: 429, retryAfter: res.headers["retry-after"] };
    if (res.status >= 400) return { kind: "http-error", status: res.status };
    if (res.status !== 200) return { kind: "http-error", status: res.status };
    if (res.body.byteLength > o.maxBytes) return { kind: "too-large" };
    const contentType = (res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    if (!accept.includes(contentType)) return { kind: "unsupported-content-type", contentType: contentType || "(none)" };
    return { kind: "ok", status: 200, finalUrl: url.toString(), redirects, contentType: res.headers["content-type"] ?? contentType, body: res.body, etag: res.headers["etag"], lastModified: res.headers["last-modified"] };
  }
  return { kind: "redirect-rejected", location: url.toString(), reason: "too-many-redirects" };
}

export const isRetryable = (r: FetchResult) => r.kind === "timeout" || r.kind === "network-error" || r.kind === "rate-limited" || (r.kind === "http-error" && r.status >= 500);

/** Run `attempt` up to backoffMs.length + 1 times, sleeping between retryable failures. */
export async function withRetry(attempt: () => Promise<FetchResult>, backoffMs: readonly number[], sleep: (ms: number) => Promise<void>): Promise<{ result: FetchResult; attempts: number }> {
  let result = await attempt();
  let attempts = 1;
  for (const wait of backoffMs) {
    if (!isRetryable(result)) break;
    await sleep(wait);
    result = await attempt();
    attempts++;
  }
  return { result, attempts };
}
