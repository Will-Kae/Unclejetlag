import { ConverterCTA } from "@/components/tools/ConverterCTA";
import Image from "next/image";
import { featuredFor } from "@/lib/photos";
import Link from "next/link";
import type { Metadata } from "next";
import { HeroSearch } from "@/components/search/HeroSearch";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { CountryCard } from "@/components/cards/CountryCard";
import { IntelPass } from "@/components/ui/IntelPass";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { Passport, Wallet, Signal, Compass, Shield, Refresh, Globe, ListCheck, Lock, Arrow } from "@/components/ui/icons";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { CodeCopy } from "@/components/esim/CodeCopy";
import { ESIM_CODE, ESIM_DISCOUNT } from "@/data/esim";
import { getAllDestinations, getAllVisaBriefs, getArticlesBySection, getFeaturedArticle, getTrendingArticles, getUpdates, toSummary, visaBriefCard } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/data/site";
import { regions, countries } from "@/data/countries";
import { routes } from "@/lib/routes";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} | The world, without the guesswork`,
  description: site.description,
  path: "/",
  absoluteTitle: true,
  ogKicker: "Travel intelligence",
  image: "/brand/og-default.jpg",
});

const dashboard = [
  { step: "01 · Dream", title: "Destinations", body: "Country briefs: costs, data, customs.", href: "/destinations", Icon: Compass },
  { step: "02 · Research", title: "Where can I go?", body: "Entry rules by the passport you hold.", href: "/visas#finder", Icon: Passport },
  { step: "03 · Prepare", title: "Before You Fly", body: "Your trip checklist, linked to official sources.", href: "/tools/before-you-fly", Icon: ListCheck },
  { step: "04 · Connect", title: "eSIM Finder", body: "Land connected, not roaming.", href: "/esim", Icon: Signal },
  { step: "05 · Protect", title: "Travel Security", body: "Wi-Fi, passwords and lost phones.", href: "/security", Icon: Lock },
  { step: "06 · Pay", title: "Money Abroad", body: "Cards, cash and the fees nobody mentions.", href: "/money", Icon: Wallet },
];



export default function HomePage() {
  const featured = getFeaturedArticle();
  const updates = getUpdates(3);
  const hero = featuredFor("home-hero");
  const trending = getTrendingArticles(6).filter((a) => a.url !== featured?.url).slice(0, 5).map(toSummary);
  const destinations = getAllDestinations();
  const georgia = destinations.find((d) => d.country === "georgia") ?? destinations[0];
  const visas = getAllVisaBriefs();
  const money = getArticlesBySection("money").slice(0, 4).map(toSummary);
  const zwGe = visas.find((v) => v.passport === "zimbabwe" && v.destination === "georgia");
  if (zwGe) trending.splice(1, 0, visaBriefCard(zwGe));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 top-10 h-[30rem] w-[30rem] rounded-full bg-jet/10 blur-3xl" />
          <div className="absolute right-0 top-40 h-[26rem] w-[26rem] rounded-full bg-sky/10 blur-3xl" />
          <svg className="absolute inset-x-0 top-0 h-full w-full opacity-[0.35]" preserveAspectRatio="none" viewBox="0 0 1200 700">
            {[120, 220, 320, 420, 520].map((y) => (
              <path key={y} d={`M0 ${y} Q600 ${y - 90} 1200 ${y}`} fill="none" stroke="#0E1A24" strokeOpacity="0.08" strokeDasharray="3 7" />
            ))}
          </svg>
        </div>
        <div className="container-uj grid items-center gap-14 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.35fr_1fr] lg:pb-24 lg:pt-20">
          <div className="animate-rise">
            <p className="label-mono inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-ink ring-1 ring-line">
              <span className="h-2 w-2 rounded-full bg-jet" /> Travel smarter. Go further. Stay connected.
            </p>
            <h1 className="mt-6 text-[clamp(2.7rem,1.5rem+4.6vw,5.4rem)] font-semibold uppercase leading-[0.92] tracking-[-0.035em] text-ink">
              The world.
              <br />
              <span className="text-jet">Without the guesswork.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[clamp(1.05rem,1rem+0.4vw,1.25rem)] leading-relaxed text-muted">
              Travel intelligence, destination guides and tools for people who actually go places.
            </p>
            <HeroSearch className="mt-8 max-w-2xl" />
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <Link href="/tools/before-you-fly" className="link-underline text-ink">Before You Fly checklist →</Link>
              <Link href="/esim" className="link-underline text-ink">eSIM Finder →</Link>
              <Link href="/visas#finder" className="link-underline text-ink">Visa finder →</Link>
            </p>
          </div>
          <div className={`relative animate-rise [animation-delay:150ms] ${hero ? "p-5 pt-24 sm:p-8 sm:pt-40 lg:pt-44" : ""}`}>
            {hero && (
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[2rem] shadow-card">
                <Image src={hero.src} alt="" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
              </div>
            )}
            {georgia && (
              <div className="relative">
                <IntelPass d={georgia} visaHref={zwGe?.url ?? routes.visas()} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section aria-labelledby="dash" className="container-uj">
        <h2 id="dash" className="label-mono text-muted">Plan the trip in the right order</h2>
        <ol className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-line ring-1 ring-line sm:grid-cols-3 lg:grid-cols-6">
          {dashboard.map(({ step, title, body, href, Icon }) => (
            <li key={href} className="bg-white">
              <Link href={href} data-track="travel_tool_open" data-tool={title} className="group flex h-full flex-col p-4 transition hover:bg-paper sm:p-5">
                <span className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{step}</span>
                  <Icon className="h-5 w-5 text-jet" />
                </span>
                <span className="mt-3 font-display text-[1.05rem] font-semibold leading-tight text-ink group-hover:text-jet-ink sm:mt-4 sm:text-lg">{title}</span>
                <span className="mt-1 text-sm leading-snug text-muted">{body}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURED */}
      {featured && (
        <section aria-label="Featured guide" className="container-uj mt-20">
          <ArticleCard a={toSummary(featured)} variant="feature" priority headingLevel="h2" />
        </section>
      )}

      {/* LATEST UPDATES */}
      {updates.length > 0 && (
        <section aria-labelledby="updates" className="container-uj mt-20">
          <SectionHeading id="updates" kicker="Latest updates" title="What changed for travellers" href="/updates" hrefLabel="All updates" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {updates.map((a) => <ArticleCard key={a.url} a={a} />)}
          </div>
        </section>
      )}

      {/* TRENDING */}
      <section aria-labelledby="trending" className="container-uj mt-20">
        <SectionHeading id="trending" kicker="Trending guides" title="What travellers are reading right now" href="/guides" hrefLabel="All guides" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((a, i) => <ArticleCard key={a.url} a={a} priority={i < 3} />)}
        </div>
      </section>

      {/* DESTINATIONS */}
      <section aria-labelledby="dest-title" className="mt-24 bg-sand/60 py-20">
        <div className="container-uj">
          <SectionHeading id="dest-title" kicker="Destinations" title="Country briefs, not brochures" description="Entry, money, data, transport and customs: the things you need to know before you land." href="/destinations" hrefLabel="All destinations" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {destinations.map((d) => (
              <CountryCard key={d.country} name={d.countryName} href={d.url} iso2={d.iso2} region={d.region} meta={`${d.currency.code} · ${d.airports[0]?.code ?? ""}`} src={d.featuredImage?.src} />
            ))}
          </div>
          <div className="scrollbar-none mt-8 flex gap-2 overflow-x-auto pb-1">
            {regions.map((r) => (
              <Link key={r.key} href={routes.region(r.key)} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-line hover:bg-ink hover:text-paper">
                {r.label} <span className="ml-1 font-mono text-xs text-muted">{countries.filter((c) => c.region === r.key).length}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STAY CONNECTED */}
      <section aria-labelledby="connected" className="container-uj mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <p className="label-mono text-jet-ink">Stay connected</p>
            <h2 id="connected" className="mt-3 text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] font-semibold uppercase leading-[1]">Land connected.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Work out how much data your trip needs, then compare plan types that fit. We don&apos;t invent prices or crown a winner; we tell you
              what each provider actually offers.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href="/esim" variant="dark">Open the eSIM Finder</ButtonLink>
              <CodeCopy code={ESIM_CODE} placement="home-connected" />
            </div>
            <p className="mt-3 text-sm text-muted">Holafly readers save {ESIM_DISCOUNT} with the code above, and can reuse it.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PartnerCard slug="holafly" placement="home-connected" why={["Unlimited data by the day"]} />
            <PartnerCard slug="saily" placement="home-connected" why={["Fixed-data plans with top-ups"]} />
          </div>
        </div>
      </section>

      {/* VISA FINDER TEASER */}
      <section aria-labelledby="passport-first" className="container-uj mt-24">
        <div className="grid gap-10 overflow-hidden rounded-[2rem] bg-white p-6 ring-1 ring-line sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="label-mono text-amber">Passport-first travel</p>
            <h2 id="passport-first" className="mt-3 text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] font-semibold leading-[1.08]">
              Most travel advice assumes you hold a Western passport. We don&apos;t.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Uncle Jetlag organises entry information by the passport in your pocket, with a focus on African passport holders who are usually
              an afterthought. Every brief links to the official source.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/visas#finder" variant="dark">Open the visa finder</ButtonLink>
              <ButtonLink href="/visas" variant="ghost">Visa basics</ButtonLink>
            </div>
          </div>
          <ul className="space-y-3">
            {visas.slice(0, 4).map((v) => (
              <li key={v.url}>
                <Link href={v.url} className="card-lift flex items-center justify-between gap-4 rounded-2xl bg-paper px-5 py-4 ring-1 ring-line">
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-ink">{countries.find((c) => c.slug === v.passport)?.iso2}</span>
                    <Arrow className="h-4 w-4 text-jet" />
                    <span className="font-mono text-sm font-semibold text-ink">{countries.find((c) => c.slug === v.destination)?.iso2}</span>
                    <span className="ml-2 text-[0.95rem] font-medium text-ink-2">{v.passportName} passport → {v.destinationName}</span>
                  </span>
                  <span className="label-mono hidden !text-[0.6rem] text-muted sm:inline">Brief</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* MONEY */}
      <section aria-labelledby="money-title" className="container-uj mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="label-mono text-jet-ink">Money Abroad</p>
            <h2 id="money-title" className="mt-3 text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] font-semibold leading-[1.08]">Stop leaking money at every border.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Exchange spreads, dynamic currency conversion, ATM fees, card networks. We explain how the money actually moves, so you can keep more of it.
            </p>
            <ButtonLink href="/money" className="mt-7">Explore Money Abroad</ButtonLink>
            <ConverterCTA compact className="mt-8" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {money.map((a) => <ArticleCard key={a.url} a={a} />)}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section aria-labelledby="protect" className="mt-24 bg-ink py-20 text-paper">
        <div className="container-uj grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="label-mono text-[#ffb59e]">Travel security</p>
            <h2 id="protect" className="mt-3 text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] font-semibold uppercase leading-[1]">Your passport isn&apos;t the only thing worth protecting.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-paper/75">
              Airport Wi-Fi, bank codes on a swapped SIM, a phone left in a taxi. The habits that matter, explained without the scare tactics.
            </p>
            <ButtonLink href="/security" variant="light" className="mt-7">Read the security guide</ButtonLink>
          </div>
          <ul className="divide-y divide-white/10 rounded-2xl bg-white/5 ring-1 ring-white/10">
            {[
              ["Is airport Wi-Fi safe?", "/security#wifi"],
              ["What a VPN does (and doesn't)", "/security#vpn"],
              ["Bank SMS codes abroad", "/security#2fa"],
              ["If your phone goes missing", "/security#phone"],
              ["Scams that target travellers", "/security#scams"],
            ].map(([t, h]) => (
              <li key={h}><Link href={h} className="flex items-center justify-between px-5 py-4 hover:bg-white/5"><span>{t}</span><span aria-hidden="true">→</span></Link></li>
            ))}
          </ul>
        </div>
      </section>

      {/* TRUST */}
      <section aria-labelledby="trust" className="container-uj mt-24">
        <h2 id="trust" className="sr-only">Why trust Uncle Jetlag</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: Shield, t: "Sourced, not guessed", b: "Rules link to government, embassy, bank or provider sources. If we can't verify it, we say so." },
            { Icon: Refresh, t: "Dated, always", b: "Every guide shows when it was last updated. Travel rules change; freshness shouldn't be a mystery." },
            { Icon: Globe, t: "Independent", b: "Affiliate links are disclosed and never decide a recommendation. Ads never interrupt a sentence." },
          ].map(({ Icon, t, b }) => (
            <div key={t} className="rounded-[var(--radius-card)] border border-line p-6">
              <Icon className="h-6 w-6 text-jet" />
              <p className="mt-4 font-display text-xl font-semibold">{t}</p>
              <p className="mt-2 leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Read our <Link href="/editorial-policy" className="underline">editorial policy</Link> and{" "}
          <Link href="/corrections-policy" className="underline">corrections policy</Link>.
        </p>
      </section>

      <div className="mt-24">
        <NewsletterSection source="home" />
      </div>
    </>
  );
}
