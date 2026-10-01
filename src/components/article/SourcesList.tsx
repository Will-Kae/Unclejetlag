import type { Source } from "@/lib/content/schema";

export function SourcesList({ sources, title = "Sources & official references" }: { sources: Source[]; title?: string }) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby="sources" className="mt-12">
      <h2 id="sources" className="label-mono text-muted">{title}</h2>
      <ol className="mt-3 space-y-2 text-[0.93rem]">
        {sources.map((s, i) => (
          <li key={s.url} className="flex gap-3">
            <span className="font-mono text-xs leading-6 text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sky underline decoration-sky/30 underline-offset-2 hover:decoration-sky">
                {s.title}
              </a>
              {s.publisher && <span className="text-muted"> ({s.publisher})</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
