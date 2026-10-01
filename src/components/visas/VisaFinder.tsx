"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Arrow } from "@/components/ui/icons";

type Opt = { slug: string; name: string };

export function VisaFinder({ countries, pairs, guides }: { countries: Opt[]; pairs: string[]; guides: string[] }) {
  const id = useId();
  const router = useRouter();
  const [passport, setPassport] = useState("");
  const [destination, setDestination] = useState("");
  const [missing, setMissing] = useState<{ p: string; d: string } | null>(null);
  const pairSet = new Set(pairs);
  const nameOf = (s: string) => countries.find((c) => c.slug === s)?.name ?? s;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passport || !destination) return;
    if (pairSet.has(`${passport}/${destination}`)) router.push(`/visas/${passport}/${destination}`);
    else setMissing({ p: passport, d: destination });
  }

  const select =
    "h-14 w-full appearance-none rounded-2xl border border-ink/15 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230E1A24%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat px-4 pr-10 text-[1rem] font-medium text-ink outline-none focus:ring-2 focus:ring-jet";

  return (
    <div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor={`${id}-p`} className="label-mono mb-2 block text-muted">I have a passport from</label>
          <select id={`${id}-p`} value={passport} onChange={(e) => { setPassport(e.target.value); setMissing(null); }} className={select} required>
            <option value="">Choose passport…</option>
            {countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-d`} className="label-mono mb-2 block text-muted">I want to travel to</label>
          <select id={`${id}-d`} value={destination} onChange={(e) => { setDestination(e.target.value); setMissing(null); }} className={select} required>
            <option value="">Choose destination…</option>
            {countries.filter((c) => c.slug !== passport).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-jet px-7 font-semibold text-white transition hover:bg-jet-ink disabled:opacity-50" disabled={!passport || !destination}>
          Check <Arrow className="h-5 w-5" />
        </button>
      </form>
      <div aria-live="polite">
        {missing && (
          <div className="mt-5 animate-fade rounded-2xl bg-amber-soft p-5 text-ink-2">
            <p className="font-semibold text-ink">
              We haven&apos;t published a {nameOf(missing.p)} → {nameOf(missing.d)} brief yet.
            </p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed">
              Until we do, check the official immigration or foreign-affairs website of {nameOf(missing.d)}, or its embassy or consulate
              that serves {nameOf(missing.p)}. Avoid third-party &ldquo;visa agents&rdquo; that aren&apos;t linked from an official site.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
              {guides.includes(missing.d) && <Link href={`/destinations/${missing.d}`} className="text-sky underline">Read our {nameOf(missing.d)} guide</Link>}
              <Link href={`/visas/${missing.p}`} className="text-sky underline">All {nameOf(missing.p)} passport briefs</Link>
              <Link href="/visas/guides/visa-types-explained" className="text-sky underline">Visa types explained</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
