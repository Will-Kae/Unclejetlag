import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/passport/verification/AdminDataPanel.tsx"), "utf8");

describe("admin data panel perimeter", () => {
  it("requires a token and calls the private admin API", () => {
    expect(source).toContain("if (!accessToken)");
    expect(source).toContain('fetch("/api/passport-verification/admin"');
    expect(source).toContain("Authorization:");
  });
  it("validates the response and uses the admin adapter", () => {
    expect(source).toContain("isResponse(payload)");
    expect(source).toContain("adaptAdminResponse(data)");
    expect(source).toContain("Counts are incomplete");
  });
  it("does not persist tokens or mutate data", () => {
    expect(source).toContain("controller.abort()");
    expect(source).toContain('cache: "no-store"');
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("method: \"POST\"");
  });
});
