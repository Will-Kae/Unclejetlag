import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PassportDraftEvidencePreview } from "@/components/passport/PassportDraftEvidencePreview";
import { WorkspaceView } from "@/components/passport/workspace/WorkspaceView";
import { currentResearchIdentity } from "@/lib/passport/admin-auth.server";
import { parseWorkspaceQuery } from "@/lib/passport/review-workspace";
import { loadWorkspace } from "@/lib/passport/review-workspace-data";
import { workspaceAccess } from "@/lib/passport/workspace-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Evidence Review Workspace | Passport Research Admin", robots: { index: false, follow: false } };

const RESEARCH_LOGIN_PATH = "/passport-index/research-admin/login";

/** Phase 4C.7: authenticated, read-only Evidence Review Workspace. */
export default async function EvidenceReviewWorkspacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = workspaceAccess(await currentResearchIdentity());
  if (!access.allowed) redirect(RESEARCH_LOGIN_PATH);
  const query = parseWorkspaceQuery(await searchParams);
  const ws = loadWorkspace();
  return (
    <main className="container-uj mx-auto max-w-6xl space-y-6 py-10 text-ink-2 sm:py-14">
      <p className="text-sm"><Link className="underline" href="/passport-index/research-admin">← Research administration</Link></p>
      <header className="space-y-2">
        <p className="label-mono text-xs text-muted">Passport research administration · read-only</p>
        <h1 className="text-3xl font-semibold text-ink">Evidence review workspace</h1>
        <p className="max-w-3xl">Track disputed and unverified visa evidence. This workspace cannot approve, edit, import or publish anything.</p>
      </header>
      <WorkspaceView cases={ws.cases} overview={ws.overview} query={query} asOf={ws.dataset.asOf} version={ws.dataset.version} />
      {access.showImportDiagnostics && (
        <section aria-label="Administrator diagnostics" className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
          <p className="label-mono text-xs text-muted">Administrators only</p>
          <PassportDraftEvidencePreview />
        </section>
      )}
    </main>
  );
}
