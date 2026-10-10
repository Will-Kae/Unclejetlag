"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { comparePassports, scorePassport, type ComparisonFilter } from "@/lib/passport/engine";
import { flagOf, jName, jurisdictions } from "@/lib/passport/jurisdictions";
import { categoryMeta } from "@/lib/passport/types";

const FILTERS: { key: ComparisonFilter; label: string }[] = [
  { key: "no-advance-visa", label: "No visa needed in advance" },
  { key: "visa-free", label: "Visa-free only" },
  { key: "all-verified", label: "Any route except a traditional visa" },
];

export function CompareTool({ withData }: { withData: string[] }) {
  const id = useId();
  const [a, setA] = useState("ZW");
  const [b, setB] = useState("ZA");
  const [filter, setFilter] = useState<ComparisonFilter>("no-advance-visa");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const pa = p.get("a")?.toUpperCase(), pb = p.get("b")?.toUpperCase();
    if (pa && jurisdictions.some((j) => j.code === pa)) setA(pa);
    if (pb && jurisdictions.some((j) => j.code === pb)) setB(pb);
  }, []);

  const result = useMemo(() => (a !== b ? comparePassports(a, b, filter) : null), [a, b, filter]);
  const sa = useMemo(() => scorePassport(a), [a]);
  const sb = useMemo(() => scorePassport(b), [b]);
  const opts = [...jurisdictions].sort((x, y) => Number(withData.includes(y.code)) - Number(withData.includes(x.code)) || x.name.localeCompare(y.name));

  const select = (label: string, value: string, set: (v: string) => void, n: string) => (
    <div className="min-w-0 flex-1">
      <label htmlFor={`${id}-${n}`} className="text-sm font-semibold text-ink">{label}</label>
      <select id={`${id}-${n}`} value={value} onChange={(e) => set(e.target.value)} className="mt-1 h-12 w-full rounded-full border border-ink/15 bg-white px-4 text-ink">
        {opts.map((j) => <option key={j.code} value={j.code}>{flagOf(j.code)} {j.name}{withData.includes(j.code) ? "" : " (not yet verified)"}</option>)}
      </select>
    </div>
  );

  const List = ({ title, codes }: { title: string; codes: string[] }) => (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <p className="font-semibold text-ink">{title} <span className="text-muted">({codes.length})</span></p>
      {codes.length ? <ul className="mt-3 flex flex-wrap gap-1.5">{codes.map((c) => <li key={c} className="rounded-full bg-sand/70 px-2.5 py-1 text-sm">{flagOf(c)} {jName(c)}</li>)}</ul> : <p className="mt-2 text-sm text-muted">None among verified destinations.</p>}
    </div>
  );

  return (
    <div>
      <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-card ring-1 ring-line sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {select("Passport A", a, setA, "a")}
          <button type="button" onClick={() => { setA(b); setB(a); }} className="h-12 rounded-full border border-ink/15 px-5 font-semibold text-ink hover:bg-sand" aria-label="Swap passports">⇄</button>
          {select("Passport B", b, setB, "b")}
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-ink">Count a destination as accessible when</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <label key={f.key} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-1 ${filter === f.key ? "bg-ink text-paper ring-ink" : "bg-white text-ink ring-line"}`}>
                <input type="radio" name={`${id}-f`} value={f.key} checked={filter === f.key} onChange={() => setFilter(f.key)} className="sr-only" />{f.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {a === b ? <p className="mt-6 text-ink-2">Choose two different passports.</p> : result && (
        <div className="mt-8 space-y-6" aria-live="polite">
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[30rem] text-left text-[0.95rem]">
              <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Measure</th><th scope="col" className="px-4 py-3">{flagOf(a)} {jName(a)}</th><th scope="col" className="px-4 py-3">{flagOf(b)} {jName(b)}</th></tr></thead>
              <tbody className="divide-y divide-line">
                <tr><td className="px-4 py-3">Verified destinations</td><td className="px-4 py-3 font-semibold">{sa.verified}</td><td className="px-4 py-3 font-semibold">{sb.verified}</td></tr>
                {(["visa-free", "visa-on-arrival", "eta", "evisa", "visa-required", "restricted"] as const).map((c) => (
                  <tr key={c}><td className="px-4 py-3">{categoryMeta[c].label}</td><td className="px-4 py-3">{sa.counts[c]}</td><td className="px-4 py-3">{sb.counts[c]}</td></tr>
                ))}
                <tr><td className="px-4 py-3">Global rank</td><td className="px-4 py-3 text-muted">Not yet ranked</td><td className="px-4 py-3 text-muted">Not yet ranked</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">{(() => { const n = result.both.length + result.onlyA.length + result.onlyB.length; return `Compared only where both passports have a verified rule: ${n} ${n === 1 ? "destination" : "destinations"} reachable by at least one; ${result.unverified.length} not yet verified for one or both.`; })()}</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <List title="Both passports" codes={result.both} />
            <List title={`Only ${jName(a)}`} codes={result.onlyA} />
            <List title={`Only ${jName(b)}`} codes={result.onlyB} />
          </div>
          <p className="text-sm"><Link href={`/passport-index/passports/${jurisdictions.find((j) => j.code === a)!.slug}`} className="text-sky underline">{jName(a)} passport profile</Link> · <Link href={`/passport-index/passports/${jurisdictions.find((j) => j.code === b)!.slug}`} className="text-sky underline">{jName(b)} passport profile</Link></p>
        </div>
      )}
    </div>
  );
}
