"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { esimDestinations, esimProviders, planFit, usageProfiles, type UsageLevel } from "@/data/esim";
import { getPartner, goHref, publicDiscount } from "@/data/partners";
import { CodeCopy } from "./CodeCopy";
import { track } from "@/lib/analytics";
import { ArrowUpRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const fmt = (n: number) => (n < 10 ? n.toFixed(1).replace(/\.0$/, "") : Math.round(n).toString());

/**
 * The Uncle Jetlag eSIM Finder.
 * Informational: no live prices exist, so it estimates data need (clearly labelled), explains
 * which plan types fit, and sends travellers to each provider for current plans and prices.
 */
export function EsimFinder({ initialDestination = "", placement = "esim-finder" }: { initialDestination?: string; placement?: string }) {
  const id = useId();
  const [dest, setDest] = useState(initialDestination);
  const [days, setDays] = useState(7);
  const [usage, setUsage] = useState<UsageLevel>("regular");
  const [shown, setShown] = useState(Boolean(initialDestination));

  const destination = esimDestinations.find((d) => d.slug === dest);
  const profile = usageProfiles[usage];
  const [lo, hi] = profile.gbPerDay.map((g) => g * days);

  const ranked = useMemo(
    () =>
      esimProviders
        .map((f) => ({ f, p: getPartner(f.partner)!, why: planFit(usage, f) }))
        .filter((x) => x.p?.active)
        // Order by how many of the traveller's needs the plan types meet, then alphabetically. Never by commission.
        .sort((a, b) => b.why.length - a.why.length || a.p.name.localeCompare(b.p.name)),
    [usage],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setShown(true);
    track("esim_search", { destination: dest || "other", days, usage, tool: "esim-finder" });
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line">
      <form onSubmit={submit} className="grid gap-6 border-b border-line p-6 sm:p-8 lg:grid-cols-[1.1fr_0.7fr_1.6fr_auto] lg:items-end">
        <div>
          <label htmlFor={`${id}-dest`} className="label-mono text-muted">Where are you travelling?</label>
          <select
            id={`${id}-dest`}
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-ink/15 bg-paper px-3 text-[1rem] text-ink focus:border-jet focus:outline-none focus:ring-2 focus:ring-jet/30"
          >
            <option value="">Choose a destination</option>
            {esimDestinations.map((d) => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
            <option value="other">Somewhere else</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-days`} className="label-mono text-muted">How long? (days)</label>
          <input
            id={`${id}-days`}
            type="number"
            inputMode="numeric"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
            className="mt-2 h-12 w-full rounded-xl border border-ink/15 bg-paper px-3 text-[1rem] text-ink focus:border-jet focus:outline-none focus:ring-2 focus:ring-jet/30"
          />
        </div>
        <fieldset>
          <legend className="label-mono text-muted">How much data do you use?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(usageProfiles) as UsageLevel[]).map((k) => (
              <label
                key={k}
                className={cn(
                  "flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-jet/40",
                  usage === k ? "border-ink bg-ink text-paper" : "border-ink/15 bg-paper text-ink hover:border-ink/40",
                )}
              >
                <input type="radio" name={`${id}-usage`} value={k} checked={usage === k} onChange={() => setUsage(k)} className="sr-only" />
                <span className="font-semibold">{usageProfiles[k].label}</span>
                <span className={cn("mt-0.5 hidden text-xs leading-snug sm:block", usage === k ? "text-paper/70" : "text-muted")}>{usageProfiles[k].blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="h-12 rounded-full bg-jet px-7 font-semibold text-white transition hover:bg-jet-ink">
          Find my eSIM
        </button>
      </form>

      <div aria-live="polite">
        {shown && (
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_2fr]">
            <div>
              <p className="label-mono text-jet-ink">Your rough data need</p>
              <p className="mt-2 font-display text-4xl font-semibold text-ink">
                {fmt(lo)}–{fmt(hi)} GB
              </p>
              <p className="mt-1 text-ink-2">
                for {days} {days === 1 ? "day" : "days"} of {profile.label.toLowerCase()} use{destination ? ` in ${destination.longName ?? destination.name}` : ""}.
              </p>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-2">{profile.fit}</p>
              <p className="mt-4 rounded-xl bg-sand/70 p-3 text-xs leading-relaxed text-muted">
                Uncle Jetlag rule of thumb, not a measurement. For your real number, check the mobile-data screen in your phone&apos;s settings
                for a normal week at home.
              </p>
              {destination && (
                <Link href={`/esim/${destination.slug}`} className="mt-4 inline-block text-sm font-semibold text-sky underline">
                  {destination.name} eSIM guide
                </Link>
              )}
            </div>

            <div>
              <p className="label-mono text-muted">Providers to check</p>
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {ranked.map(({ f, p, why }) => {
                  const discount = publicDiscount(p);
                  return (
                    <li key={p.slug} className="flex flex-col rounded-2xl border border-line bg-paper p-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-display text-xl font-semibold text-ink">{p.name}</p>
                        <span className="label-mono !text-[0.55rem] text-muted">Affiliate</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{f.planTypes}</p>
                      {why.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-ink-2">
                          {why.map((w) => (
                            <li key={w} className="flex gap-2"><span aria-hidden="true" className="text-palm">✓</span>{w}</li>
                          ))}
                        </ul>
                      )}
                      {discount && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-ink">{discount.amount} with code</p>
                          <CodeCopy code={discount.code!} partner={p.slug} placement={placement} className="mt-1.5 !px-3 !py-1.5 !text-xs" />
                        </div>
                      )}
                      <a
                        href={goHref(p.slug, { d: dest && dest !== "other" ? dest : undefined, placement })}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-jet"
                      >
                        View current plan <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                We don&apos;t have a live price feed, so we don&apos;t show prices or pick a cheapest option. Providers are ordered by how many of your
                needs their plan types meet, never by commission. Uncle Jetlag may earn a commission if you buy; your price is the same.{" "}
                <Link href="/affiliate-disclosure" className="underline">Disclosure</Link>
              </p>
            </div>
          </div>
        )}
        {!shown && <p className="p-6 text-sm text-muted sm:p-8">Pick a destination, trip length and usage, and we&apos;ll show how much data you&apos;re likely to need and which plan types fit.</p>}
      </div>
    </div>
  );
}
