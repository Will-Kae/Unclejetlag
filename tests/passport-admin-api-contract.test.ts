import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/app/api/passport-verification/admin/route.ts"), "utf8");

describe("passport admin read API contract", () => {
  it("requires feature enablement, Supabase identity, and admin role", () => {
    expect(source).toContain("isVerificationEnabled()");
    expect(source).toContain("verifyPassportBearer(token)");
    expect(source).toContain('identity.role !== "admin"');
    expect(source).toContain("status: 403");
  });
  it("limits response and excludes sensitive audit fields", () => {
    expect(source).toContain('"Cache-Control": "private, no-store"');
    expect(source).toContain('read("passport_verification_audit", "id,action,created_at", 100)');
    expect(source).not.toContain("actor_id");
    expect(source).not.toContain("source_url");
  });
  it("does not expose mutations or imply complete counts", () => {
    expect(source).toContain("export async function GET");
    expect(source).not.toContain("export async function POST");
    expect(source).toContain("Counts reflect loaded rows only");
    expect(source).toContain("partial:");
  });
});
