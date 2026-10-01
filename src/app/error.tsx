"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-uj flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="label-mono text-jet-ink">Turbulence</p>
      <h1 className="mt-4 text-4xl font-semibold">Something went wrong on our side.</h1>
      <p className="mt-3 text-muted">Please try again. If it keeps happening, let us know.</p>
      <button onClick={reset} className="mt-6 h-11 rounded-full bg-ink px-5 font-semibold text-paper">Try again</button>
    </section>
  );
}
