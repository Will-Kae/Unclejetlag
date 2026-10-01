import { ADSENSE_CLIENT } from "@/components/monetization/ads-config";

export const dynamic = "force-static";

/** Serves ads.txt from NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-XXXX → pub-XXXX). */
export function GET() {
  const body = ADSENSE_CLIENT
    ? `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt: no ad partners configured yet\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
