import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/app/api/passport-verification/reviewer/route.ts"), "utf8");

describe("reviewer queue perimeter", () => {
  it("requires feature flag and verified reviewer or admin", () => {
    expect(source).toContain("isVerificationEnabled()");
    expect(source).toContain("verifyPassportBearer(token)");
    expect(source).toContain('identity.role !== "reviewer"');
    expect(source).toContain('identity.role !== "admin"');
  });
  it("excludes own submissions at the query and response layers", () => {
    expect(source).toContain('submitter_id: `neq.${identity.userId}`');
    expect(source).toContain("row.submitter_id !== identity.userId");
    expect(source).toContain('status: "eq.submitted"');
  });
  it("is read-only, capped, and does not claim global statistics", () => {
    expect(source).toContain("export async function GET");
    expect(source).not.toContain("export async function POST");
    expect(source).toContain('limit: "100"');
    expect(source).toContain('summaryScope: "loaded_queue_only"');
    expect(source).toContain('"Cache-Control": "private, no-store"');
  });
});
