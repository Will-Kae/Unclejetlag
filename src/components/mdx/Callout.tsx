import { Info, Alert, Bulb, Shield } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const kinds = {
  info: { cls: "bg-sky-soft border-sky/25 text-ink", icon: Info, iconCls: "text-sky", label: "Good to know" },
  warning: { cls: "bg-jet-soft border-jet/25 text-ink", icon: Alert, iconCls: "text-jet-ink", label: "Heads up" },
  tip: { cls: "bg-palm-soft border-palm/25 text-ink", icon: Bulb, iconCls: "text-palm", label: "Uncle's tip" },
  verify: { cls: "bg-amber-soft border-amber/30 text-ink", icon: Shield, iconCls: "text-amber", label: "Verify before you travel" },
} as const;

export function Callout({ type = "info", title, children }: { type?: keyof typeof kinds; title?: string; children: React.ReactNode }) {
  const k = kinds[type];
  const Icon = k.icon;
  return (
    <aside className={cn("not-prose my-8 rounded-2xl border p-5 sm:p-6", k.cls)} role="note">
      <p className="flex items-center gap-2 font-semibold">
        <Icon className={cn("h-5 w-5 shrink-0", k.iconCls)} />
        <span className="label-mono !text-[0.7rem]">{title ?? k.label}</span>
      </p>
      <div className="mt-2 text-[0.98rem] leading-relaxed text-ink-2 [&>p+p]:mt-2 [&_a]:font-medium [&_a]:underline">{children}</div>
    </aside>
  );
}
