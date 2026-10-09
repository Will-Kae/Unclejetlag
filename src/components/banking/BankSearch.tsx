"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { checkBic, looksLikeBic, normalizeBic } from "@/lib/banking/bic";
import { checkIban, looksLikeIban } from "@/lib/banking/iban";
import { directoryCountries, findByBic, searchInstitutions } from "@/lib/banking/directory";
import { countryName, flag } from "@/lib/banking/iso-countries";
import { Search } from "@/components/ui/icons";
import { BicResultCard } from "./BicChecker";
import { IbanResultCard } from "./IbanValidator";
import { bankHref } from "./countrySlug";
import { PrivacyNote } from "./ui";

const PAGE = 12;

/**
 * Universal search: a bank name, a SWIFT/BIC code or an IBAN.
 * IBAN-shaped input is validated locally and never searched or sent anywhere.
 */
export function BankSearch({ autoFocus = false, showCountryFilter = true }: { autoFocus?: boolean; showCountryFilter?: boolean }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const countries = useMemo(() => directoryCountries(), []);

  // An 8-letter word ("Barclays") is also BIC-shaped, so a BIC card only wins when the code is in our
  // directory or no bank name matches. IBAN-shaped input never reaches the name search.
  const isIban = looksLikeIban(q);
  const nameHits = useMemo(() => (!isIban && (q.trim() || country) ? searchInstitutions(q, { country: country || undefined }) : []), [q, country, isIban]);
  const mode = isIban ? "iban" : looksLikeBic(q) && (findByBic(normalizeBic(q)) || nameHits.length === 0) ? "bic" : "name";
  const hits = mode === "name" ? nameHits : [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={id} className="sr-only">Search banks, SWIFT/BIC codes or IBANs</label>
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id={id}
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
            placeholder="Bank name, SWIFT/BIC code or IBAN"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-results`}
            className="h-14 w-full rounded-full border border-ink/15 bg-white pr-5 text-lg text-ink placeholder:text-muted focus:border-ink/40"
            style={{ paddingLeft: "3.25rem" }}
          />
        </div>
        {showCountryFilter && (
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setLimit(PAGE); }}
            aria-label="Filter by country"
            className="h-14 rounded-full border border-ink/15 bg-white px-5 text-ink"
          >
            <option value="">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{flag(c)} {countryName(c)}</option>)}
          </select>
        )}
      </div>
      <PrivacyNote />

      <div id={`${id}-results`} aria-live="polite">
        {mode === "iban" && <IbanResultCard r={checkIban(q)} />}
        {mode === "bic" && <BicResultCard r={checkBic(q)} />}
        {mode === "name" && (q.trim() || country) && (
          hits.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-ink/20 p-6 text-[0.95rem]">
              <p className="font-semibold text-ink">No verified match in our directory.</p>
              <p className="mt-1 text-ink-2">
                We only list banks whose codes we&apos;ve checked on an official source, so many banks aren&apos;t here yet. Ask the bank for its SWIFT/BIC code, or use{" "}
                <a href="https://www2.swift.com/bsl/index.faces" target="_blank" rel="noopener nofollow" className="text-sky underline">SWIFT&apos;s official BIC search</a>.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm text-muted">{hits.length} {hits.length === 1 ? "bank" : "banks"} in our verified directory</p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {hits.slice(0, limit).map(({ institution: inst, reason }) => {
                  const href = bankHref(inst.country, inst.slug);
                  return (
                    <li key={inst.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                      <p className="text-sm text-muted">{flag(inst.country)} {countryName(inst.country)}{reason === "fuzzy" && " · close match"}</p>
                      <p className="mt-1 font-semibold text-ink">{href ? <Link href={href} className="hover:underline">{inst.name}</Link> : inst.name}</p>
                      <p className="mt-1 font-mono text-sm text-ink-2">{inst.identifiers.map((i) => i.value).join(" · ")}</p>
                    </li>
                  );
                })}
              </ul>
              {hits.length > limit && (
                <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mt-4 h-11 rounded-full border border-ink/15 bg-white px-5 font-semibold text-ink hover:border-ink/40">
                  Show more
                </button>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
