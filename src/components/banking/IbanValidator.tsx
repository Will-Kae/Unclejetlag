"use client";

import { useId, useMemo, useState } from "react";
import { checkIban, type IbanResult } from "@/lib/banking/iban";
import { flag } from "@/lib/banking/iso-countries";
import { Alert, Check, Minus } from "@/components/ui/icons";
import { Badge, CopyButton, PrivacyNote } from "./ui";

export function IbanResultCard({ r }: { r: IbanResult }) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="break-all font-mono text-lg font-semibold tracking-wide text-ink">{r.formatted || "—"}</span>
          {r.valid ? <Badge tone="good"><Check className="h-4 w-4" /> Valid IBAN format and checksum</Badge> : <Badge tone="bad">Not a valid IBAN</Badge>}
        </div>
        {r.valid && <CopyButton value={r.formatted} label="Copy IBAN" />}
      </div>

      {r.country && (
        <p className="mt-3 text-[0.95rem] text-ink-2">
          {flag(r.country)} {r.countryName}
          {r.expectedLength && <> · {r.expectedLength} characters</>}
        </p>
      )}

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl ring-1 ring-line">
        {r.checks.map((c) => (
          <li key={c.label} className="flex gap-3 bg-white px-4 py-3 text-[0.95rem]">
            {c.ok === true ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-palm" /> : c.ok === false ? <Alert className="mt-0.5 h-5 w-5 shrink-0 text-jet" /> : <Minus className="mt-0.5 h-5 w-5 shrink-0 text-muted" />}
            <span><strong className="text-ink">{c.label}:</strong> {c.detail}</span>
          </li>
        ))}
      </ul>

      {r.valid && (r.bankIdentifier || r.branchIdentifier || r.accountNumber) && (
        <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-3">
          {[["Bank identifier", r.bankIdentifier], ["Branch identifier", r.branchIdentifier], ["Account number", r.accountNumber]]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <dt className="label-mono text-[0.65rem] text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-[0.95rem] text-ink">{v}</dd>
              </div>
            ))}
        </dl>
      )}

      {r.valid && (
        <p className="mt-5 rounded-xl bg-amber-soft/60 p-4 text-[0.95rem] text-ink-2">
          <strong className="text-ink">A valid IBAN isn&apos;t proof of an account.</strong> It means the IBAN is well formed and the check digits match. It doesn&apos;t confirm the account exists, who owns it, or that a payment will arrive. Confirm details with the recipient through a channel you trust.
        </p>
      )}
    </div>
  );
}

export function IbanValidator({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState("");
  const result = useMemo(() => (submitted.trim() ? checkIban(submitted) : null), [submitted]);

  return (
    <div className={compact ? "" : "rounded-[var(--radius-card)] bg-white p-5 shadow-card ring-1 ring-line sm:p-7"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(value);
        }}
        className="flex flex-col gap-3 sm:flex-row"
        aria-label="IBAN validator"
      >
        <label htmlFor={id} className="sr-only">IBAN</label>
        <input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. GB82 WEST 1234 5698 7654 32"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={50}
          className="h-12 min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-5 font-mono text-lg uppercase tracking-wide text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-ink/40"
        />
        <button type="submit" className="h-12 rounded-full bg-[#101c30] px-6 font-semibold text-white hover:opacity-90">Validate IBAN</button>
      </form>
      <PrivacyNote />
      {result && <IbanResultCard r={result} />}
    </div>
  );
}
