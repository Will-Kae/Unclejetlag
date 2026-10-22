import { describe, expect, it } from "vitest";
import { canApproveFromTrustedSource, type SourceApprovalInput } from "../src/lib/passport/editorial-source-policy";
const valid: SourceApprovalInput = {
  sourceId: "official-source-1", submissionSourceId: "official-source-1",
  registryActive: true, authorityVerified: true, sourceHostMatches: true,
  artifactVerified: true, sourceDocumentDated: true, noOpenConflicts: true,
};
describe("trusted-source approval gate", () => {
  it("allows only a fully verified server-side source result", () => {
    expect(canApproveFromTrustedSource(valid)).toBe(true);
  });
  it("fails closed for each missing prerequisite", () => {
    const flags: (keyof SourceApprovalInput)[] = [
      "registryActive", "authorityVerified", "sourceHostMatches",
      "artifactVerified", "sourceDocumentDated", "noOpenConflicts",
    ];
    for (const flag of flags) {
      expect(canApproveFromTrustedSource({ ...valid, [flag]: false })).toBe(false);
    }
    expect(canApproveFromTrustedSource({ ...valid, sourceId: "" })).toBe(false);
    expect(canApproveFromTrustedSource({ ...valid, submissionSourceId: "other" })).toBe(false);
  });
});
