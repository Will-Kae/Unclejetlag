/** Phase 4C.7 workspace badges. Every status carries a text label and a glyph, never colour alone. */
import { CASE_STATUS_LABEL, QUALITY_LABEL, type CaseStatus, type EvidenceQualityLevel } from "@/lib/passport/review-workspace";

const STATUS_STYLE: Record<CaseStatus, { cls: string; glyph: string }> = {
  published: { cls: "bg-palm-soft text-palm", glyph: "✓" },
  "re-verification": { cls: "bg-amber-soft text-amber", glyph: "↻" },
  "pending-verification": { cls: "bg-sky-soft text-sky", glyph: "…" },
  disputed: { cls: "bg-jet-soft text-jet-ink", glyph: "⚠" },
  blocked: { cls: "bg-sand text-ink-2", glyph: "■" },
  "not-verified": { cls: "bg-sand text-ink-2", glyph: "?" },
};

const QUALITY_STYLE: Record<EvidenceQualityLevel, { cls: string; glyph: string }> = {
  blocker: { cls: "bg-jet-soft text-jet-ink", glyph: "✕" },
  review: { cls: "bg-amber-soft text-amber", glyph: "!" },
  clear: { cls: "bg-palm-soft text-palm", glyph: "○" },
  "not-assessed": { cls: "bg-sand text-ink-2", glyph: "–" },
};

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function StatusBadge({ status }: { status: CaseStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`${base} ${s.cls}`} data-status={status}>
      <span aria-hidden="true">{s.glyph}</span>
      {CASE_STATUS_LABEL[status]}
    </span>
  );
}

export function QualityBadge({ quality }: { quality: EvidenceQualityLevel }) {
  const s = QUALITY_STYLE[quality];
  return (
    <span className={`${base} ${s.cls}`} data-quality={quality}>
      <span aria-hidden="true">{s.glyph}</span>
      {QUALITY_LABEL[quality]}
    </span>
  );
}

export function PriorityBadge({ label, origin }: { label: string; origin: string }) {
  return (
    <span className={`${base} bg-white text-ink ring-1 ring-line`} title={origin}>
      {label}
      <span className="sr-only"> ({origin})</span>
    </span>
  );
}

/** Shown wherever a proposed classification appears. */
export function NotAdviceNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`rounded-2xl border border-dashed border-ink/25 bg-white p-4 text-sm text-ink-2 ${className}`} role="note">
      <strong className="text-ink">Research data, not travel advice.</strong> Proposed classifications are unapproved research. Only records marked “Published (verified)” appear on the public index, and nothing here changes them.
    </p>
  );
}
