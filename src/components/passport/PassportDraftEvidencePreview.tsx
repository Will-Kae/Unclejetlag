/**
 * Server-rendered, read-only preview for the authenticated research-admin page.
 *
 * Integration prerequisite: mount ONLY after currentResearchIdentity() succeeds,
 * once Phase 4C.2 and 4C.3 are reconciled. This component does not authorize
 * access and must never be mounted on a public route.
 */
import { ruleRecords, sources } from "@/lib/passport/data";
import { planDraftImport } from "@/lib/passport/evidence-import-plan";
import { researchPackage } from "../../../../research/phase-4c3/package";

export function PassportDraftEvidencePreview() {
  const plan = planDraftImport(researchPackage, { records: ruleRecords, sources });
  return (
    <section aria-labelledby="passport-draft-preview" className="mt-8 space-y-4">
      <h2 id="passport-draft-preview" className="text-2xl font-semibold">Draft evidence import preview</h2>
      <p>Read-only dry run. No records are approved, inserted, published or scored.</p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div><dt>Proposals</dt><dd className="font-semibold">{plan.total}</dd></div>
        <div><dt>Disputed</dt><dd className="font-semibold">{plan.disputed}</dd></div>
        <div><dt>Pending verification</dt><dd className="font-semibold">{plan.pendingVerification}</dd></div>
      </dl>
      {plan.issues.length > 0 ? (
        <div role="alert" className="rounded-xl border p-4">
          <p className="font-semibold">Import blocked: validation failed.</p>
          <ul className="mt-2 list-disc pl-6">{plan.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
        </div>
      ) : (
        <p role="status">Validation passed for preview only. Human review and database authorization remain required.</p>
      )}
      <p className="text-sm">Preview-ready rows: {plan.rows.length}. The import action is intentionally unavailable.</p>
    </section>
  );
}
