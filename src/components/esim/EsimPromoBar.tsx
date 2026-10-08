import Link from "next/link";
import { ESIM_CODE } from "@/data/esim";

/** Slim site-wide bar promoting the eSIM hub and the Uncle Jetlag code. */
export function EsimPromoBar() {
  return (
    <aside aria-label="Reader offer" className="bg-ink text-paper">
      <p className="container-uj flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-[0.8rem] sm:text-sm">
        <span>
          <strong>Don&apos;t roam. Jetlag.</strong> Up to 10% off travel eSIMs with code{" "}
          <span className="font-mono font-semibold tracking-wide text-[#ffb59e]">{ESIM_CODE}</span>
        </span>
        <Link href="/esim" className="font-semibold underline underline-offset-2 hover:text-white">
          Get your eSIM →
        </Link>
      </p>
    </aside>
  );
}
