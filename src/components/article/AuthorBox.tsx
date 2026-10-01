import Link from "next/link";
import type { Author } from "@/data/authors";
import { routes } from "@/lib/routes";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function AuthorAvatar({ className = "h-12 w-12" }: { className?: string }) {
  return <LogoMark className={cn("rounded-full", className)} />;
}

export function AuthorBox({ author }: { author: Author }) {
  return (
    <aside aria-label="About the author" className="relative mt-14 overflow-hidden rounded-3xl bg-sand p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <AuthorAvatar className="h-16 w-16" />
        <div>
          <p className="label-mono text-muted">Written by</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            <Link href={routes.author(author.slug)} className="hover:text-jet-ink">{author.name}</Link>
          </p>
          <p className="text-sm text-muted">{author.role}</p>
          <p className="mt-3 leading-relaxed text-ink-2">{author.shortBio}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={routes.author(author.slug)} className="text-sky underline">More from {author.name}</Link>
            <Link href="/editorial-policy" className="text-sky underline">How we research</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
