import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/app/api/passport-verification/researcher/route.ts"), "utf8");

describe("researcher data API perimeter", () => {
  it("is disabled by default and requires a validated bearer", () => {
    expect(source).toContain("isVerificationEnabled()");
    expect(source).toContain("verifyPassportBearer(token)");
    expect(source).toContain('status: 401');
    expect(source).toContain('status: 403');
  });
  it("restricts data to the authenticated submitter", () => {
    expect(source).toContain('submitter_id: `eq.${identity.userId}`');
    expect(source).toContain('identity.role !== "researcher"');
    expect(source).not.toContain("request.nextUrl.searchParams.get");
  });
  it("limits returned columns, result count and caching", () => {
    expect(source).toContain("id,rule_id,passport_code,destination_code,status,revision");
    expect(source).toContain('limit: "100"');
    expect(source).toContain('"Cache-Control": "private, no-store"');
    expect(source).not.toContain("source_url");
  });
});
