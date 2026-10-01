import Link from "next/link";
import { Shield, Refresh } from "@/components/ui/icons";
import { daysSince, formatDate } from "@/lib/utils";

export function ContentStatusBanner({ status }: { status: "verified" | "review" | "demo" }) {
  if (status === "verified") return null;
  if (status === "review") {
    return (
      <p role="note" className="rounded-xl bg-sky-soft px-4 py-3 text-sm text-ink-2">
        <strong className="text-sky">Editor review pending.</strong> This guide is written but hasn&apos;t completed our{" "}
        <Link href="/editorial-policy" className="underline">fact-check process</Link> yet.
      </p>
    );
  }
  return (
    <p role="note" className="rounded-xl border border-dashed border-amber/50 bg-amber-soft px-4 py-3 text-sm text-ink-2">
      <strong className="text-amber">Demo content.</strong> This page shows how Uncle Jetlag guides are structured. Anything marked
      &ldquo;verify&rdquo; or &ldquo;placeholder&rdquo; has <em>not</em> been checked. Do not rely on it for travel decisions.
    </p>
  );
}

/** Freshness stamp — travel info goes stale, so "last updated" is always prominent. */
export function UpdatedStamp({ date, verifiedDate }: { date: string; verifiedDate?: string }) {
  const age = daysSince(date);
  const stale = age > 180;
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.8rem] font-medium ${stale ? "bg-amber-soft text-amber" : "bg-palm-soft text-palm"}`}>
        <Refresh className="h-3.5 w-3.5" /> Last updated <time dateTime={date}>{formatDate(date)}</time>
      </span>
      {verifiedDate && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[0.8rem] font-medium text-ink ring-1 ring-line">
          <Shield className="h-3.5 w-3.5 text-palm" /> Checked against official sources <time dateTime={verifiedDate}>{formatDate(verifiedDate)}</time>
        </span>
      )}
    </div>
  );
}
