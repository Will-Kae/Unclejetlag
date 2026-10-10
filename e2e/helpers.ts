import type { APIRequestContext, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const FIXTURES = path.join(__dirname, "../tests/fixtures");
export const readFixture = <T>(name: string): T => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));
export const writeFixture = (name: string, data: unknown) => fs.writeFileSync(path.join(FIXTURES, name), JSON.stringify(data, null, 1) + "\n");
export const UPDATE = process.env.UPDATE_BASELINE === "1";

/** Abort every request that isn't to the local server. Nothing third-party is ever contacted. */
export async function blockThirdParty(page: Page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
}

/** Sitemap paths as served by the local build (origin stripped, sorted). */
export async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).sort();
}

/** Internal hrefs from server-rendered HTML (anchors only). */
export function internalHrefs(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, "&");
    if (/^(#|mailto:|tel:|whatsapp:|javascript:)/.test(raw)) continue;
    let u: URL;
    try {
      u = new URL(raw, "https://unclejetlag.com");
    } catch {
      continue;
    }
    if (u.hostname !== "unclejetlag.com" && u.hostname !== "www.unclejetlag.com") continue;
    out.push(u.pathname + (u.pathname.startsWith("/go/") ? u.search : ""));
  }
  return out;
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
