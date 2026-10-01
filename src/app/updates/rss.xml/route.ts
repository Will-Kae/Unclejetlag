import { SITE_URL, site } from "@/data/site";
import { getUpdates } from "@/lib/content";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getUpdates(50)
    .map(
      (u) => `    <item>
      <title>${esc(u.title)}</title>
      <link>${SITE_URL}${u.url}</link>
      <guid isPermaLink="true">${SITE_URL}${u.url}</guid>
      <pubDate>${new Date(`${u.publishedDate}T07:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(u.description)}</description>
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.name)}: travel rule updates</title>
    <link>${SITE_URL}/updates</link>
    <description>Dated, sourced updates on rule, fee and requirement changes that affect travellers.</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
