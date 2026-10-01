"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Search, Menu, Close, Chevron, Arrow } from "@/components/ui/icons";
import { SearchDialog } from "@/components/search/SearchDialog";
import { cn } from "@/lib/utils";

export type MegaLink = { label: string; href: string; hint?: string };
export type MegaPanel = {
  key: string;
  label: string;
  href: string;
  intro: string;
  columns: { title: string; links: MegaLink[] }[];
  feature?: { title: string; href: string; kicker: string };
};

export function Header({ panels, links = [] }: { panels: MegaPanel[]; links?: MegaLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close menus on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset UI on route change
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") setOpen(null);
    };
    const onOpenSearch = () => setSearch(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("uj:open-search", onOpenSearch);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("uj:open-search", onOpenSearch);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const enter = (k: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(k);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };
  const activePanel = panels.find((p) => p.key === open);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background,box-shadow,border-color] duration-300",
          scrolled || open ? "border-line bg-paper/90 shadow-[0_8px_30px_-20px_rgb(14_26_36/0.4)] backdrop-blur-xl" : "border-transparent bg-paper/70 backdrop-blur",
        )}
        onMouseLeave={leave}
      >
        <div className="container-uj flex h-[4.5rem] items-center justify-between gap-4 sm:h-[5rem]">
          <Logo />

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-0">
              {panels.map((p) => (
                <li key={p.key} onMouseEnter={() => enter(p.key)}>
                  <div className="flex items-center">
                    <Link
                      href={p.href}
                      className={cn("whitespace-nowrap rounded-l-full py-2 pl-3 pr-1 text-[0.92rem] font-medium transition hover:bg-sand", isActive(p.href) && "text-jet-ink", open === p.key && "bg-sand")}
                      aria-current={isActive(p.href) ? "page" : undefined}
                    >
                      {p.label}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={open === p.key}
                      aria-controls="mega-panel"
                      aria-label={`${p.label} menu`}
                      onClick={() => setOpen(open === p.key ? null : p.key)}
                      className={cn("rounded-r-full py-2 pl-0.5 pr-2 transition hover:bg-sand", open === p.key && "bg-sand")}
                    >
                      <Chevron className={cn("h-3.5 w-3.5 transition-transform", open === p.key && "rotate-180")} />
                    </button>
                  </div>
                </li>
              ))}
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={cn("whitespace-nowrap rounded-full px-3 py-2 text-[0.92rem] font-medium transition hover:bg-sand", isActive(l.href) && "text-jet-ink")} aria-current={isActive(l.href) ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="group flex h-10 items-center gap-2 rounded-full border border-ink/12 bg-white/70 pl-3 pr-3 text-sm text-muted transition hover:border-ink/30 hover:text-ink 2xl:pr-2"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden whitespace-nowrap 2xl:inline">Search</span>
              <kbd className="hidden rounded-md bg-sand px-1.5 py-0.5 font-mono text-[0.65rem] text-muted 2xl:inline">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-jet sm:flex"
            >
              Where to? <Arrow className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobile(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand xl:hidden"
              aria-label="Open menu"
              aria-expanded={mobile}
              aria-controls="mobile-nav"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Desktop mega menu */}
        {activePanel && (
          <div id="mega-panel" className="absolute inset-x-0 top-full hidden animate-fade border-b border-line bg-paper shadow-[0_30px_60px_-30px_rgb(14_26_36/0.35)] xl:block" onMouseEnter={() => enter(activePanel.key)}>
            <div className="container-uj grid grid-cols-[1.1fr_repeat(3,1fr)] gap-10 py-9">
              <div>
                <p className="label-mono text-jet-ink">{activePanel.label}</p>
                <p className="mt-3 font-display text-xl leading-snug text-ink">{activePanel.intro}</p>
                <Link href={activePanel.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  <span className="link-underline">Explore {activePanel.label}</span> <Arrow className="h-4 w-4" />
                </Link>
              </div>
              {activePanel.columns.slice(0, activePanel.feature ? 2 : 3).map((col) => (
                <div key={col.title}>
                  <p className="label-mono text-muted">{col.title}</p>
                  <ul className="mt-3 space-y-0.5">
                    {col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link href={l.href} className="group flex items-baseline justify-between gap-3 rounded-lg py-1.5 text-[0.95rem] text-ink-2 hover:text-jet-ink">
                          <span>{l.label}</span>
                          {l.hint && <span className="font-mono text-[0.68rem] text-muted group-hover:text-jet-ink">{l.hint}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {activePanel.feature && (
                <Link href={activePanel.feature.href} className="group relative overflow-hidden rounded-2xl bg-ink p-5 text-paper">
                  <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-jet/50 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                  <p className="label-mono relative text-paper/70">{activePanel.feature.kicker}</p>
                  <p className="relative mt-3 font-display text-lg font-semibold leading-snug">{activePanel.feature.title}</p>
                  <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb59e]">
                    Read <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile nav */}
      {mobile && (
        <div id="mobile-nav" className="fixed inset-0 z-[65] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade bg-ink/40" onClick={() => setMobile(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-fade flex-col bg-paper shadow-lift">
            <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-4">
              <Logo />
              <button onClick={() => setMobile(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand" aria-label="Close menu">
                <Close className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <button
                onClick={() => { setMobile(false); setSearch(true); }}
                className="mb-4 flex h-12 w-full items-center gap-3 rounded-2xl border border-ink/12 bg-white px-4 text-left text-muted"
              >
                <Search className="h-5 w-5" /> Where are you going?
              </button>
              <ul className="divide-y divide-line">
                <li><Link href="/" className="block py-3.5 text-lg font-medium">Home</Link></li>
                {panels.map((p) => (
                  <li key={p.key}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                        {p.label}
                        <Chevron className="h-5 w-5 text-muted transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="pb-4">
                        <Link href={p.href} className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-jet-ink">
                          All {p.label} <Arrow className="h-4 w-4" />
                        </Link>
                        {p.columns.map((c) => (
                          <div key={c.title} className="mt-3">
                            <p className="label-mono text-muted">{c.title}</p>
                            <ul className="mt-1.5 grid grid-cols-2 gap-x-3">
                              {c.links.map((l) => (
                                <li key={l.href + l.label}>
                                  <Link href={l.href} className="block py-1.5 text-[0.95rem] text-ink-2">{l.label}</Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  </li>
                ))}
                {links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="block py-3.5 text-lg font-medium">{l.label}</Link></li>
                ))}
                <li><Link href="/about" className="block py-3.5 text-lg font-medium">About Uncle Jetlag</Link></li>
              </ul>
            </div>
            <div className="border-t border-line p-4">
              <p className="label-mono text-muted">Travel smarter. Go further. Stay connected.</p>
            </div>
          </div>
        </div>
      )}

      <SearchDialog open={search} onClose={() => setSearch(false)} />
    </>
  );
}
