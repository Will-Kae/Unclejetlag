import Image from "next/image";
import Link from "next/link";
import logoDark from "@/assets/brand/logo-dark.webp";
import logoLight from "@/assets/brand/logo-light.webp";
import avatar from "@/assets/brand/avatar.webp";
import { cn } from "@/lib/utils";

/**
 * Brand assets (source: UNC.psd exports).
 * - logo-dark.webp  : primary lockup, dark wordmark — for light backgrounds
 * - logo-light.webp : same lockup, cream wordmark — for dark backgrounds
 * - avatar.png     : the Uncle Jetlag portrait mark — favicon, author avatar, small spaces
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={avatar}
      alt=""
      aria-hidden="true"
      sizes="(min-width: 640px) 120px, 80px"
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ className, inverted = false, size = "md" }: { className?: string; inverted?: boolean; size?: "md" | "lg" }) {
  return (
    <Link href="/" className={cn("group inline-flex shrink-0 items-center", className)} aria-label="Uncle Jetlag home">
      <Image
        src={inverted ? logoLight : logoDark}
        alt="Uncle Jetlag"
        priority={!inverted}
        sizes={size === "lg" ? "240px" : "140px"}
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:-rotate-2",
          size === "lg" ? "h-20 sm:h-24" : "h-[3.4rem] sm:h-16",
        )}
      />
    </Link>
  );
}
