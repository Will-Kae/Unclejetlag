"use client";

import { useState } from "react";
import { Check } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type Tone = "good" | "neutral" | "warn" | "bad";

const tones: Record<Tone, string> = {
  good: "bg-palm-soft text-palm ring-palm/25",
  neutral: "bg-sky-soft text-sky ring-sky/20",
  warn: "bg-amber-soft text-amber ring-amber/25",
  bad: "bg-jet-soft text-jet-ink ring-jet/25",
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1", tones[tone])}>{children}</span>;
}

/** Copies text without sending it anywhere. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-sm font-semibold text-ink transition hover:border-ink/40"
      aria-live="polite"
    >
      {done ? <><Check className="h-4 w-4 text-palm" /> Copied</> : label}
    </button>
  );
}

export function PrivacyNote() {
  return <p className="mt-3 text-xs text-muted">Checked in your browser. Nothing you type is sent to Uncle Jetlag or stored.</p>;
}
