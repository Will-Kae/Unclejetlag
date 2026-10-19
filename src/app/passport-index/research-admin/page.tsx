import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentResearchIdentity } from "@/lib/passport/admin-auth.server";
import { PassportDraftEvidencePreview } from "@/components/passport/PassportDraftEvidencePreview";
import { PassportEvidenceResolutionQueue } from "@/components/passport/PassportEvidenceResolutionQueue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Passport Research Admin | Uncle Jetlag", robots: { index: false, follow: false } };

export default async function PassportResearchAdminPage() {
  const identity = await currentResearchIdentity();
  if (!identity) redirect("/passport-index/research-admin/login");
  return (
    <main className="container-uj mx-auto max-w-3xl py-16">
      <h1 className="text-3xl font-semibold">Passport research administration</h1>
      <p className="mt-4">Signed in with an active {identity.role} research profile.</p>
      <p className="mt-4">Evidence review and publishing actions remain disabled until database policies and audit transactions are verified.</p>
      <p className="mt-6"><Link className="underline" href="/passport-index/evidence-review">View public evidence review queue</Link></p>
      <PassportDraftEvidencePreview />
      <PassportEvidenceResolutionQueue />
      <form method="post" action="/passport-index/research-admin/logout" className="mt-6">
        <button className="rounded-xl border px-5 py-3" type="submit">Sign out</button>
      </form>
    </main>
  );
}
