import Image from "next/image";
import { cn } from "@/lib/utils";

export const CONVERTER_URL = "https://converter.qefxmoney.com";

/**
 * Uncle Jetlag's official currency converter: QeFX (converter.qefxmoney.com).
 * QeFX is owned by Uncle Jetlag's founder, so we say so wherever we link to it.
 */
export function ConverterCTA({
  currency,
  className,
  compact,
  feature,
  strip,
}: {
  currency?: string;
  className?: string;
  compact?: boolean;
  /** Large banner version for the top of money hub pages. */
  feature?: boolean;
  /** Slim one-line bar for the top of money articles. */
  strip?: boolean;
}) {
  if (strip) {
    return (
      <aside
        aria-label="Currency converter"
        className={cn("not-prose flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-[#050b1a] px-4 py-3 text-white ring-1 ring-white/10", className)}
      >
        <Image src="/brand/qefx-logo.webp" alt="QeFX Currency Converter" width={236} height={114} className="h-auto w-20 shrink-0" />
        <p className="min-w-0 flex-1 text-sm leading-snug text-white/85">
          <span className="font-semibold text-white">{currency ? `Converting ${currency}?` : "Converting currency?"}</span> Check today&apos;s
          mid-market rate on QeFX before you pay. <span className="text-white/50">(Owned by Uncle Jetlag&apos;s founder.)</span>
        </p>
        <a
          href={CONVERTER_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#46a2ff]"
        >
          Open converter <span aria-hidden="true">→</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </aside>
    );
  }
  return (
    <aside
      aria-label="Currency converter"
      className={cn("not-prose overflow-hidden rounded-2xl bg-[#050b1a] text-white ring-1 ring-white/10", compact ? "p-5" : feature ? "p-7 sm:p-10" : "p-6 sm:p-7", className)}
    >
      <div className={cn("flex gap-5", compact ? "flex-col" : feature ? "flex-col gap-6 md:flex-row md:items-center md:gap-10" : "flex-col sm:flex-row sm:items-center")}>
        <Image src="/brand/qefx-logo.webp" alt="QeFX Currency Converter" width={236} height={114} className={cn("h-auto shrink-0", feature ? "w-48 sm:w-56" : "w-40")} />
        <div className="min-w-0">
          {feature && <p className="label-mono text-[#46a2ff]">Official Uncle Jetlag currency converter</p>}
          <p className={cn("font-display font-semibold leading-snug", feature ? "mt-2 text-[clamp(1.5rem,1.1rem+1.6vw,2.3rem)] leading-tight" : "text-lg")}>
            {currency ? `Convert ${currency} at today's mid-market rate` : "Check today's mid-market rate before you pay"}
          </p>
          <p className={cn("mt-1.5 leading-relaxed text-white/75", feature ? "mt-3 max-w-2xl text-base sm:text-lg" : "text-sm")}>
            Use QeFX Travel Mode to set your home and destination currencies once, then sense-check prices on the go. It shows reference
            rates: airport kiosks, hotels and card payments usually cost more.
          </p>
          <a
            href={CONVERTER_URL}
            target="_blank"
            rel="noopener"
            className={cn(
              "mt-4 inline-flex items-center gap-2 rounded-full bg-[#0a66c2] font-semibold text-white hover:bg-[#46a2ff]",
              feature ? "mt-6 h-12 px-6 text-base" : "px-4 py-2 text-sm",
            )}
          >
            Open the QeFX converter <span aria-hidden="true">→</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="mt-3 text-xs text-white/50">QeFX is owned by Uncle Jetlag&apos;s founder. It doesn&apos;t exchange or hold money.</p>
        </div>
      </div>
    </aside>
  );
}
