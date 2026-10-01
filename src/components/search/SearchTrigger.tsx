"use client";

/** Opens the global search dialog from anywhere (server components included). */
export function SearchTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("uj:open-search"))}>
      {children}
    </button>
  );
}
