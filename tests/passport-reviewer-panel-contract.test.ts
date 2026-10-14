import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/passport/verification/ReviewerDataPanel.tsx"), "utf8");

describe("reviewer private data panel", () => {
  it("requires access token and uses the authenticated reviewer endpoint", () => {
    expect(source).toContain("if (!accessToken)");
    expect(source).toContain('fetch("/api/passport-verification/reviewer"');
    expect(source).toContain("Authorization:");
  });
  it("fails closed for self-review records and invalid responses", () => {
    expect(source).toContain("record.submitterId !== data.reviewerId");
    expect(source).toContain("isResponse(payload)");
  });
  it("aborts stale requests and does not persist access tokens", () => {
    expect(source).toContain("controller.abort()");
    expect(source).toContain('cache: "no-store"');
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
  });
});
