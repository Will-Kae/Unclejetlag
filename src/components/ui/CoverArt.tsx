import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Generative, on-brand cover used until real photography is supplied.
 * If `src` is set, renders an optimised next/image instead — so swapping in
 * photography is a frontmatter change, not a code change.
 */
const PALETTES: [string, string][] = [
  ["#CF3D17", "#F6A04D"],
  ["#1C4E80", "#5B8DC9"],
  ["#1E7A5F", "#5DB38E"],
  ["#87550E", "#E3B35C"],
  ["#0E1A24", "#3F5A73"],
  ["#4B3F8F", "#8C7FD1"],
  ["#0F8A9D", "#63C7C9"],
  ["#B03A48", "#E77B6B"],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

type Props = {
  seed: string;
  code?: string;
  caption?: string;
  src?: string;
  alt: string;
  palette?: [string, string];
  className?: string;
  priority?: boolean;
  sizes?: string;
  size?: "sm" | "md" | "lg";
};

export function CoverArt({ seed, code, caption, src, alt, palette, className, priority, sizes, size = "md" }: Props) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-sand", className)}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"} className="object-cover" />
      </div>
    );
  }
  const h = hash(seed);
  const [a, b] = palette ?? PALETTES[h % PALETTES.length];
  const angle = 110 + (h % 70);
  const cx = 20 + (h % 60);
  const cy = 25 + ((h >> 3) % 50);
  const tilt = -12 + (h % 24);
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: `radial-gradient(circle at ${cx}% ${cy}%, rgb(255 255 255 / 0.35), transparent 60%), linear-gradient(${angle}deg, ${a}, ${b})` }}
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 250" aria-hidden="true">
        <g transform={`rotate(${tilt} 200 125)`} stroke="#fff" strokeOpacity="0.22" fill="none" strokeWidth="1">
          {[40, 80, 120, 160, 200].map((y) => (
            <ellipse key={y} cx="200" cy="125" rx="260" ry={y * 0.55} />
          ))}
          <line x1="-50" y1="125" x2="450" y2="125" strokeDasharray="2 6" />
        </g>
        <circle cx={(cx / 100) * 400} cy={(cy / 100) * 250} r="3" fill="#fff" fillOpacity="0.9" />
      </svg>
      {code && (
        <span
          className={cn(
            "absolute bottom-3 right-4 font-mono font-semibold tracking-tight text-white/85 mix-blend-overlay select-none",
            size === "lg" ? "text-[5.5rem] sm:text-[8rem] leading-none" : size === "sm" ? "text-3xl" : "text-5xl",
          )}
          aria-hidden="true"
        >
          {code}
        </span>
      )}
      {caption && <span className="label-mono absolute left-4 top-3 text-white/85">{caption}</span>}
    </div>
  );
}
