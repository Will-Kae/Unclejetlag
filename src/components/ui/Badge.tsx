import { cn } from "@/lib/utils";

const tones = {
  jet: "bg-jet-soft text-jet-ink",
  sky: "bg-sky-soft text-sky",
  palm: "bg-palm-soft text-palm",
  amber: "bg-amber-soft text-amber",
  ink: "bg-ink text-paper",
  sand: "bg-sand text-ink-2",
  glass: "bg-white/85 text-ink backdrop-blur",
} as const;

export type Tone = keyof typeof tones;

export function Badge({ children, tone = "sand", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("label-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 !text-[0.66rem] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
