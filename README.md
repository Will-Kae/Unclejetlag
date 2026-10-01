# Uncle Jetlag — unclejetlag.com

**Travel smarter. Land prepared.** A travel-media and travel-intelligence site built with
Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4. Content lives in
Markdown/MDX files, so you can publish without touching application code.

> Architecture, IA, content model and design system: see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Quick start (local)

Requirements: **Node.js 20.9+** (22 LTS recommended) and npm.

```bash
npm install
cp .env.example .env.local      # optional for local dev
npm run dev                     # http://localhost:3000
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Production build. **Also validates every content file** — bad frontmatter fails the build with a readable error. |
| `npm start` | Serve the production build (after `build`). |
| `npm run typecheck` | Generate route types and run TypeScript. |

Press **⌘K / Ctrl+K** (or `/`) anywhere on the site to search.

---

## Deploy to Vercel

1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. In Vercel: **Add New → Project → Import** the repo. Framework preset: *Next.js* (auto-detected). No build settings to change.
3. Add environment variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SITE_URL` = `https://unclejetlag.com` (required for correct canonicals/sitemap)
   - Everything else in `.env.example` is optional and can be added later.
4. Deploy. Then **Settings → Domains → Add `unclejetlag.com`** (and `www.unclejetlag.com`, redirected to the apex) and follow Vercel's DNS instructions at your registrar.
5. Preview deployments automatically serve a `Disallow: /` robots.txt so staging never gets indexed.

### Google Search Console
1. Add a *Domain property* for `unclejetlag.com` (DNS TXT verification — best), **or** a URL-prefix property and put the meta-tag token in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
2. Submit `https://unclejetlag.com/sitemap.xml`.

---

## Publishing content

| Type | Folder | URL |
|---|---|---|
| Article | `content/articles/<slug>.mdx` | `/money/<slug>`, `/travel-tech/<slug>`, `/guides/<slug>`, `/visas/guides/<slug>` (by `category`) |
| Destination | `content/destinations/<country>.mdx` | `/destinations/<country>` |
| Visa brief | `content/visas/<passport>--<destination>.mdx` | `/visas/<passport>/<destination>` |
| Policy page | `content/pages/<slug>.mdx` | `/<slug>` (needs a matching route folder) |

Start from `content/_templates/article.mdx`. Commit → Vercel rebuilds → live in ~1 minute.
Country slugs come from `src/data/countries.ts`; topics from `src/data/taxonomy.ts`.

### Content status = indexing control (important)
| `contentStatus` | Banner | Indexed / in sitemap |
|---|---|---|
| `verified` | none | ✅ yes |
| `review` | "Editor review pending" | ❌ noindex |
| `demo` | "Demo content" | ❌ noindex |

**All sample content ships as `review` or `demo`.** Nothing is indexed until an editor
checks it against sources and flips it to `verified`. This is deliberate: publishing
unverified visa/money information is a trust and liability risk, and thin placeholder pages
hurt search quality. (Override for testing only: `INDEX_UNVERIFIED_CONTENT=true`.)

### Components available inside MDX
`<Callout type="info|warning|tip|verify">`, `<ComparisonTable>`, `<ProsCons>`, `<PickCard>`
("Uncle Jetlag Pick"), `<AffiliateButton partner="…">`, `<AffiliateDisclosure>`,
`<Placeholder>`, `<TBC>`, `<AdSlot position="…">`. Markdown tables scroll horizontally on mobile automatically.

### Images
Leave `featuredImage.src` empty to get generative on-brand cover art. To use photography, drop
files in `public/images/` (or add your CDN host to `images.remotePatterns` in `next.config.ts`) and set `src`.

---

## Monetization switches

**AdSense** (only after approval — approval is never guaranteed):
- `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…` enables ads, the `google-adsense-account` meta tag and `/ads.txt`.
- Optional per-position slot IDs: `NEXT_PUBLIC_ADSENSE_SLOT_*`.
- Positions: after intro, mid-article (auto-inserted), end of article, desktop sidebar. Nothing renders until the visitor grants advertising consent.
- Preview positions with `NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS=true` (never in production).
- ⚠️ For EEA/UK/Swiss visitors Google requires a **Google-certified CMP (IAB TCF v2.2)**. The built-in banner is fine for other regions and for development; swap in a certified CMP (e.g. Google's Privacy & messaging) before serving ads in those regions.

**Affiliates:** manage partner links in `src/data/partners.ts`. All outbound partner links go via
`/go/<partner>` (noindex, `rel="sponsored"`). Inactive/demo partners redirect to the disclosure page.

**Newsletter:** `NEWSLETTER_PROVIDER=webhook` + `NEWSLETTER_WEBHOOK_URL` posts `{ email, source, consentedAt }` to any endpoint (Zapier/Make/n8n/your ESP). Add a native provider in `src/lib/newsletter.ts`. With `none` in production, the form politely says sign-ups open soon.

**Analytics:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` — loads only after analytics consent (Consent Mode v2 defaults to denied).

---

## Before launch checklist

- [ ] Verify every `review`/`demo` page against official sources, replace placeholders, set `verified`
- [ ] Have Privacy, Cookies, Terms and Affiliate Disclosure reviewed by a lawyer (they're marked as templates)
- [ ] Set up the mailboxes in `src/data/site.ts` (hello@, corrections@, partners@, privacy@ …)
- [x] Social handles set to @unclejetlag (YouTube, Instagram, TikTok, X) in `src/data/site.ts`
- [ ] Add a real named editor/author profile in `src/data/authors.ts` (E-E-A-T for money/visa topics)
- [ ] Real photography with alt text
- [ ] Connect newsletter provider
- [ ] Search Console + sitemap
- [ ] Apply for AdSense only once there's a meaningful body of verified, original content

## Project layout

```
content/            Markdown/MDX content (articles, destinations, visas, pages, _templates)
src/app/            Routes (App Router), metadata routes (sitemap, robots, manifest, og, ads.txt)
src/components/     UI: layout, cards, article, mdx, search, visas, consent, monetization, newsletter
src/data/           Site config, taxonomy, countries registry, authors, partners
src/lib/            Content source (swap for a headless CMS here), SEO/JSON-LD, search, routes
src/app/fonts/      Self-hosted variable fonts (OFL) — no build-time Google Fonts dependency
```
