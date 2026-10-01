import { Badge } from "@/components/ui/Badge";

/** Marks unverified / demo information in the body. Never remove without verifying. */
export function Placeholder({ children, label = "Placeholder: not verified" }: { children?: React.ReactNode; label?: string }) {
  return (
    <div className="not-prose my-6 rounded-2xl border-2 border-dashed border-amber/40 bg-amber-soft/50 p-5">
      <Badge tone="amber">{label}</Badge>
      {children && <div className="mt-3 text-[0.97rem] leading-relaxed text-ink-2 [&>p+p]:mt-2">{children}</div>}
    </div>
  );
}

/** Inline marker for a single unverified value, e.g. <TBC>fee</TBC> */
export function TBC({ children }: { children?: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-soft px-1.5 py-0.5 font-mono text-[0.8em] text-amber" title="Placeholder: verify with official sources">
      {children ?? "TBC"} · verify
    </mark>
  );
}
