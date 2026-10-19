import "server-only";
import { notFound, redirect } from "next/navigation";
import { CaseDetail } from "@/components/passport/workspace/CaseDetail";
import { currentResearchIdentity } from "@/lib/passport/admin-auth.server";
import { loadWorkspace } from "@/lib/passport/review-workspace-data";
import { workspaceAccess } from "@/lib/passport/workspace-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research case | Passport Research Admin", robots: { index: false, follow: false } };

const CASE_ID = /^[a-z0-9-]{3,80}$/;

/** Phase 4C.7: authenticated, read-only case detail. Authorisation runs before any lookup. */
export default async function ResearchCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const access = workspaceAccess(await currentResearchIdentity());
  if (!access.allowed) redirect("/passport-index/research-admin/login");
  const { caseId } = await params;
  if (!CASE_ID.test(caseId)) notFound();
  const found = loadWorkspace().cases.find((c) => c.id === caseId);
  if (!found) notFound();
  return (
    <main className="container-uj mx-auto max-w-4xl py-10 text-ink-2 sm:py-14">
      <CaseDetail c={found} />
    </main>
  );
}
