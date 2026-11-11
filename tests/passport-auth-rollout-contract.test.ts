import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const doc = readFileSync(join(process.cwd(), "docs/passport-authentication-rollout.md"), "utf8");

describe("private authentication rollout documentation", () => {
  it("keeps secret credentials server-only", () => {
    expect(doc).toContain("SUPABASE_SECRET_KEY");
    expect(doc).toContain("never use a");
    expect(doc).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
  it("requires independent test users and negative authorization tests", () => {
    expect(doc).toContain("separate");
    expect(doc).toContain("Researcher:");
    expect(doc).toContain("Reviewer:");
    expect(doc).toContain("Admin:");
    expect(doc).toContain("Flag unset or false");
  });
  it("does not authorize publication or premature activation", () => {
    expect(doc).toContain("Do not enable the feature flag");
    expect(doc).toContain("Do not merge PR #8");
  });
});
