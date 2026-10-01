# Uncle Jetlag: GitHub handover

## Getting this into your GitHub repo
1. Unzip this folder on your computer.
2. In a terminal inside the folder:
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   (Or open the folder in Claude Code and ask it to push to your repo.)

## Where things live
- Partners, affiliate URLs, discount codes: src/data/partners.ts (Saily has no discount
  code: we link to Saily directly, as the affiliate disclosure says)
- Travel tools registry: src/data/tools.ts
- eSIM facts and destination notes: src/data/esim.ts
- Founder / author details and schema: src/data/authors.ts, src/lib/seo.ts
- Analytics events: src/lib/analytics.ts (dataLayer/GA4) and /go/[partner] server logs
- Content: content/ (MDX). Daily updates: content/articles with kind: update
