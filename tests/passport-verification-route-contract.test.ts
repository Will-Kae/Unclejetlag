import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/passport-verification/me/route.ts"),
  "utf8",
);

describe("private passport identity endpoint contract", () => {
  it("requires explicit workspace enablement", () => {
    expect(source).toContain("if (!isVerificationEnabled())");
    expect(source).toContain("status: 404");
  });
  it("rejects missing or malformed bearer credentials", () => {
    expect(source).toContain('authorization?.startsWith("Bearer ")');
    expect(source).toContain("verifyPassportBearer(token)");
    expect(source).toContain("status: 401");
  });
  it("disables caching and does not return sensitive database records", () => {
    expect(source).toContain('"Cache-Control": "no-store"');
    expect(source).toContain("{ role: identity.role }");
    expect(source).not.toContain("SUPABASE_SECRET_KEY");
  });
});
