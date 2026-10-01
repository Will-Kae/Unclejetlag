"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm({ source, tone = "light", stacked = false, className }: { source: string; tone?: "light" | "dark"; stacked?: boolean; className?: string }) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), company: form.get("company"), source }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      track("newsletter_signup", { placement: source });
      setMessage(data.message || "You're on the Jetlag Report list. Welcome aboard.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const dark = tone === "dark";
  if (status === "success") {
    return (
      <p role="status" className={cn("rounded-2xl px-4 py-3 text-sm font-medium", dark ? "bg-white/10 text-paper" : "bg-palm-soft text-palm", className)}>
        ✓ {message}
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div className={cn("flex flex-col gap-2", !stacked && "sm:flex-row")}>
        <label htmlFor={`${id}-email`} className="sr-only">Email address</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          aria-invalid={status === "error"}
          aria-describedby={`${id}-msg`}
          className={cn(
            "h-12 min-h-12 min-w-0 flex-1 rounded-full px-5 text-[0.95rem] outline-none transition focus:ring-2",
            dark ? "bg-white/10 text-paper placeholder:text-paper/50 ring-jet" : "border border-ink/15 bg-white text-ink placeholder:text-muted ring-jet",
          )}
        />
        {/* honeypot */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-12 shrink-0 rounded-full bg-jet px-6 text-[0.95rem] font-semibold text-white transition hover:bg-jet-ink disabled:opacity-70"
        >
          {status === "loading" ? "Joining…" : "Get the Jetlag Report"}
        </button>
      </div>
      <p id={`${id}-msg`} role={status === "error" ? "alert" : undefined} className={cn("mt-2 text-xs", status === "error" ? (dark ? "text-[#ffb59e]" : "text-jet-ink") : dark ? "text-paper/60" : "text-muted")}>
        {status === "error" ? message : "One useful email, no spam. Unsubscribe anytime."}
      </p>
    </form>
  );
}
