import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-jet text-white hover:bg-jet-ink shadow-[0_8px_20px_-8px_rgb(207_61_23/0.6)]",
  dark: "bg-ink text-paper hover:bg-ink-2",
  ghost: "border border-ink/15 bg-white/60 text-ink hover:border-ink/40 hover:bg-white",
  light: "bg-paper text-ink hover:bg-white",
} as const;

type Common = { variant?: keyof typeof variants; size?: "md" | "lg"; className?: string; children: React.ReactNode };

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none";
const sizes = { md: "h-11 px-5 text-[0.95rem]", lg: "h-13 px-7 text-base" };

export function ButtonLink({ href, variant = "primary", size = "md", className, children, ...rest }: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cn(base, sizes[size], variants[variant], className);
  if (/^https?:/.test(href)) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <Link href={href} className={cls} {...rest}>{children}</Link>;
}

export function Button({ variant = "primary", size = "md", className, children, ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>{children}</button>;
}
