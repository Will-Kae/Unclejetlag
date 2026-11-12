/** Pure, fail-closed policy. This is not an authority-verification service.
 * Only trusted server-side registry and provenance results may be supplied.
 */
export type SourceApprovalInput = {
  sourceId: string;
  submissionSourceId: string;
  registryActive: boolean;
  authorityVerified: boolean;
  sourceHostMatches: boolean;
  artifactVerified: boolean;
  sourceDocumentDated: boolean;
  noOpenConflicts: boolean;
};
export function canApproveFromTrustedSource(input: SourceApprovalInput): boolean {
  return input.sourceId.trim().length > 0 &&
    input.sourceId === input.submissionSourceId &&
    input.registryActive &&
    input.authorityVerified &&
    input.sourceHostMatches &&
    input.artifactVerified &&
    input.sourceDocumentDated &&
    input.noOpenConflicts;
}
