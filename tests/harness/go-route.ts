/**
 * Calls the real /go/[partner] route handler in-process (no server, no network) and returns
 * the redirect contract it produces. Used by the affiliate contract test and its fixture generator.
 */
import { GET } from "@/app/go/[partner]/route";

export const ORIGIN = "https://unclejetlag.com";

export type GoResult = { status: number; location: string | null; robots: string | null; cacheControl: string | null };

export async function callGo(slug: string, query = ""): Promise<GoResult> {
  const req = new Request(`${ORIGIN}/go/${slug}${query}`, { headers: { "user-agent": "harness" } });
  const log = console.log;
  console.log = () => {}; // the route logs one click line per call; keep test output clean
  try {
    const res = await GET(req, { params: Promise.resolve({ partner: slug }) });
    return {
      status: res.status,
      location: res.headers.get("location"),
      robots: res.headers.get("x-robots-tag"),
      cacheControl: res.headers.get("cache-control"),
    };
  } finally {
    console.log = log;
  }
}

/** Query variants checked for every partner: bare, placement only, and all three sub-IDs. */
export const VARIANTS = ["", "?p=harness-placement", "?p=harness-placement&d=harness-destination&c=harness-campaign"];
