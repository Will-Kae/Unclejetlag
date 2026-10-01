"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/** Click-to-copy discount code. */
export function CodeCopy({
  code,
  className,
  dark,
  partner = "holafly",
  placement,
}: {
  code: string;
  className?: string;
  dark?: boolean;
  partner?: string;
  placement?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        track("discount_code_copy", { partner, placement, code });
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 font-mono text-sm font-semibold tracking-wide transition",
        dark ? "border-white/40 text-white hover:bg-white/10" : "border-ink/30 text-ink hover:bg-ink/5",
        className,
      )}
      aria-label={`Copy discount code ${code}`}
    >
      USE CODE: {code}
      <span className={cn("text-xs font-normal", dark ? "text-white/70" : "text-muted")} aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
