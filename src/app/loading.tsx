export default function Loading() {
  return (
    <div className="container-uj py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-4 w-40 animate-pulse rounded-full bg-sand" />
      <div className="mt-6 h-12 w-3/4 animate-pulse rounded-2xl bg-sand" />
      <div className="mt-3 h-6 w-1/2 animate-pulse rounded-xl bg-sand" />
      <div className="mt-10 aspect-[21/9] w-full animate-pulse rounded-[1.75rem] bg-sand" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-[1.25rem] bg-sand" />
        ))}
      </div>
    </div>
  );
}
