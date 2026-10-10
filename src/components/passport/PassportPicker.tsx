"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export function PassportPicker({ options, cta = "Check my passport" }: { options: { slug: string; label: string }[]; cta?: string }) {
  const id = useId();
  const router = useRouter();
  const [v, setV] = useState("");
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => { e.preventDefault(); if (v) router.push(`/passport-index/passports/${v}`); }}
    >
      <label htmlFor={id} className="sr-only">Your passport</label>
      <select id={id} value={v} onChange={(e) => setV(e.target.value)} className="h-14 min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-5 text-lg text-ink">
        <option value="">Choose your passport…</option>
        {options.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}
      </select>
      <button type="submit" disabled={!v} className="h-14 rounded-full bg-[#ff6b4a] px-7 font-semibold text-white disabled:opacity-60">{cta}</button>
    </form>
  );
}
