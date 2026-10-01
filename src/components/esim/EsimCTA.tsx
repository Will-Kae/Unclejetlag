import Link from "next/link";
import { goHref } from "@/data/partners";
import { ESIM_CODE, ESIM_DISCOUNT, ESIM_PARTNER } from "@/data/esim";
import { CodeCopy } from "./CodeCopy";
import { cn } from "@/lib/utils";

/** Compact Holafly eSIM call-to-action for guides and articles. Carries its own disclosure. */
export function EsimCTA({ place, destKey, className }: { place?: string; destKey?: string; className?: string }) {
  const href = goHref(ESIM_PARTNER, { d: destKey, placement: destKey ? "destination-guide" : "article" });
  return (
    <aside aria-label="Travel eSIM offer" className={cn("not-prose rounded-2xl bg-sky/10 p-6 ring-1 ring-sky/20", className)}>
      <p className="label-mono text-sky">Uncle Jetlag eSIM</p>
      <p className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
        {place ? `Land in ${place} already connected` : "Land already connected"}
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
        Install a Holafly travel eSIM before you fly and switch it on when you land. {ESIM_DISCOUNT} with code {ESIM_CODE}, and you can use the
        code again on your next trip.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={href}
          rel="sponsored nofollow noopener"
          target="_blank"
          className="inline-flex h-11 items-center rounded-full bg-jet px-5 text-[0.95rem] font-semibold text-white hover:bg-jet-ink"
        >
          Get {ESIM_DISCOUNT} your eSIM <span aria-hidden="true" className="ml-1">→</span>
        </a>
        <CodeCopy code={ESIM_CODE} placement={destKey ? "destination-guide" : "article"} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Affiliate link: Uncle Jetlag may earn a commission at no extra cost to you.{" "}
        <Link href={destKey ? `/esim/${destKey}` : "/esim#compare"} className="underline">Compare Holafly and Saily</Link>
      </p>
    </aside>
  );
}
