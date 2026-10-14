import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/lib/passport/verification/rpc-client.ts"), "utf8");

describe("passport RPC client security contract", () => {
  it("uses caller bearer token, never a privileged secret", () => {
    expect(source).toContain('Authorization: `Bearer ${token}`');
    expect(source).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(source).not.toContain("SUPABASE_SECRET_KEY");
    expect(source).not.toContain("service_role");
  });
  it("validates both payloads before sending them", () => {
    expect(source).toContain("evidenceSubmissionSchema.parse(input)");
    expect(source).toContain("evidenceReviewSchema.parse(input)");
  });
  it("disables caching and limits network wait", () => {
    expect(source).toContain('cache: "no-store"');
    expect(source).toContain("AbortSignal.timeout(8000)");
  });
  it("does not accept caller-provided actor IDs", () => {
    expect(source).not.toContain("p_actor");
  });
});
