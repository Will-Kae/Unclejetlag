# Uncle Jetlag: GitHub handover

## Getting this into your GitHub repo
1. Unzip this folder on your computer.
2. In a terminal inside the folder:
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   (Or open the folder in Claude Code and ask it to push to your repo.)

## IMPORTANT before connecting Vercel to GitHub
The live site is currently deployed by uploading files straight to Vercel, and the daily
9am "verified update" scheduled task publishes posts the same way. Two daily posts exist
only on Vercel right now and are NOT in this zip:
- content/articles/us-dot-narrows-controllable-flight-delay-causes.mdx
- content/articles/irish-sea-ferries-now-require-passports.mdx
Before you connect the Vercel project to GitHub:
1. Add those two posts to the repo (Claude Code can recreate them from the live pages, or
   download them from the Vercel dashboard: Deployments > latest > Source).
2. Change the daily scheduled task so it commits new posts to GitHub instead of uploading
   to Vercel.
3. Then connect GitHub in Vercel (Project > Settings > Git). From then on every push deploys.
If you connect first, the next push will deploy without those posts.

## Where things live
- Partners, affiliate URLs, discount codes: src/data/partners.ts (Saily code: set
  NEXT_PUBLIC_SAILY_DISCOUNT_CODE in Vercel, or edit the file, and set confirmed: true)
- Travel tools registry: src/data/tools.ts
- eSIM facts and destination notes: src/data/esim.ts
- Founder / author details and schema: src/data/authors.ts, src/lib/seo.ts
- Analytics events: src/lib/analytics.ts (dataLayer/GA4) and /go/[partner] server logs
- Content: content/ (MDX). Daily updates: content/articles with kind: update
- deploy/: unbundle.mjs and patch archives are only for the current upload-based deploys
  and can be deleted once Vercel deploys from GitHub (also remove the custom install command).
