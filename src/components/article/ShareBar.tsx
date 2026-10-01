"use client";

import { useState } from "react";
import { Link2, XLogo, WhatsApp, LinkedIn, Facebook } from "@/components/ui/icons";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, Icon: WhatsApp },
    { label: "Share on X", href: `https://x.com/intent/post?url=${u}&text=${t}`, Icon: XLogo },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: LinkedIn },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: Facebook },
  ];
  async function copy() {
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled */
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="label-mono mr-1 text-muted">Share</span>
      {links.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink ring-1 ring-line transition hover:bg-ink hover:text-paper">
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button onClick={copy} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-medium ring-1 ring-line transition hover:bg-ink hover:text-paper" aria-live="polite">
        <Link2 className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
