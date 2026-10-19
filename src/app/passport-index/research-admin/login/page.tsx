import { signInResearch } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Passport Research Sign In | Uncle Jetlag", robots: { index: false, follow: false } };

export default async function ResearchLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="container-uj mx-auto max-w-lg py-16">
      <h1 className="text-3xl font-semibold">Passport research sign in</h1>
      <p className="mt-4">Restricted to authorised Uncle Jetlag passport research accounts.</p>
      {error && <p role="alert" className="mt-5 rounded-lg border p-3">Sign in unavailable or credentials not authorised. Please try again.</p>}
      <form action={signInResearch} className="mt-8 space-y-5">
        <div><label htmlFor="research-email" className="block font-medium">Email</label>
          <input id="research-email" name="email" type="email" autoComplete="username" required maxLength={254} className="mt-2 w-full rounded-xl border p-3" /></div>
        <div><label htmlFor="research-password" className="block font-medium">Password</label>
          <input id="research-password" name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border p-3" /></div>
        <button type="submit" className="rounded-xl bg-ink px-6 py-3 text-white">Sign in</button>
      </form>
      <p className="mt-6 text-sm">No public registration. Access is managed by the research administrator.</p>
    </main>
  );
}
