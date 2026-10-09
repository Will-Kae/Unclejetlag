"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { checkBic, type BicResult } from "@/lib/banking/bic";
import { isDatedSource } from "@/lib/banking/directory";
import { flag } from "@/lib/banking/iso-countries";
import { Alert, ArrowUpRight, Check, Info } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";
import { Badge, CopyButton, PrivacyNote } from "./ui";
import { bankHref } from "./countrySlug";

export function BicResultCard({ r }: { r: BicResult }) {
  const status =
    r.status === "directory-match" && r.match?.level === "institution" ? <Badge tone="neutral"><Check className="h-4 w-4" /> Bank found · branch not in our directory</Badge>
    : r.status === "directory-match" ? <Badge tone="good"><Check className="h-4 w-4" /> Found in our directory</Badge>
    : r.status === "potentially-inactive" ? <Badge tone="warn">Possibly inactive</Badge>
    : r.status === "unverified" ? <Badge tone="neutral">Valid format · not in our directory</Badge>
    : <Badge tone="bad">Invalid format</Badge>;

  const m = r.match;
  const href = m ? bankHref(m.institution.country, m.institution.slug) : null;

  return (
    <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xl font-semibold tracking-wider text-ink">{r.normalized || "—"}</span>
          {status}
        </div>
        {r.formatValid && <CopyButton value={r.normalized} label="Copy code" />}
      </div>

      {r.parts && (
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-4">
          {[
            ["Institution", r.parts.institution],
            ["Country", `${flag(r.parts.country)} ${r.parts.country} · ${r.parts.countryName}`],
            ["Location", r.parts.location],
            ["Branch", r.parts.branch ? (r.parts.branch === "XXX" ? "XXX (head office)" : r.parts.branch) : "None (head office)"],
          ].map(([k, v]) => (
            <div key={k} className="bg-white p-3">
              <dt className="label-mono text-[0.65rem] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-[0.95rem] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {m && (
        <div className="mt-5 rounded-xl bg-palm-soft/50 p-4">
          <p className="font-semibold text-ink">{href ? <Link href={href} className="underline">{m.institution.name}</Link> : m.institution.name}</p>
          <p className="mt-1 text-sm text-ink-2">
            Code on record: <span className="font-mono">{m.identifier.value}</span>
            {m.level === "institution" && " (head office; this exact branch code isn't in our records)"}
            {m.identifier.scope && <> · {m.identifier.scope}</>}
          </p>
          <p className="mt-2 text-sm text-ink-2">
            Source:{" "}
            <a href={m.identifier.source.url} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 text-sky underline">
              {m.identifier.source.type === "central-bank" ? "central bank publication" : "the bank's website"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>{" "}
            · checked {formatDate(m.identifier.source.checked)}
            {m.identifier.source.published && <> · published {m.identifier.source.published}</>}
          </p>
          {isDatedSource(m.identifier.source) && (
            <p className="mt-2 text-sm font-semibold text-amber">This source is several years old. Confirm the code with the bank.</p>
          )}
        </div>
      )}

      {r.status === "unverified" && (
        <p className="mt-5 text-[0.95rem] text-ink-2">
          The structure is correct, but this code isn&apos;t in our directory, so we can&apos;t tell you which bank it belongs to, or whether it&apos;s in use. Confirm it with the bank, or use{" "}
          <a href="https://www2.swift.com/bsl/index.faces" target="_blank" rel="noopener nofollow" className="text-sky underline">SWIFT&apos;s official BIC search</a>.
        </p>
      )}

      {r.issues.length > 0 && (
        <ul className="mt-5 space-y-2 text-[0.95rem]">
          {r.issues.map((i) => (
            <li key={i.message} className="flex gap-2.5">
              {i.level === "error" ? <Alert className="mt-0.5 h-5 w-5 shrink-0 text-jet" /> : i.level === "warning" ? <Alert className="mt-0.5 h-5 w-5 shrink-0 text-amber" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky" />}
              <span>{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BicChecker({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const id = useId();
  const [value, setValue] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const result = useMemo(() => (submitted.trim() ? checkBic(submitted) : null), [submitted]);

  return (
    <div className={compact ? "" : "rounded-[var(--radius-card)] bg-white p-5 shadow-card ring-1 ring-line sm:p-7"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(value);
        }}
        className="flex flex-col gap-3 sm:flex-row"
        role="search"
        aria-label="SWIFT/BIC checker"
      >
        <label htmlFor={id} className="sr-only">SWIFT or BIC code</label>
        <input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. ABSAZAJJ or CHASUS33"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          className="h-12 min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-5 font-mono text-lg uppercase tracking-wider text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-ink/40"
        />
        <button type="submit" className="h-12 rounded-full bg-[#101c30] px-6 font-semibold text-white hover:opacity-90">Check code</button>
      </form>
      <PrivacyNote />
      {result && <BicResultCard r={result} />}
    </div>
  );
}
