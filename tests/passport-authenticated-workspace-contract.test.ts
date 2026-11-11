import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/passport/verification/AuthenticatedWorkspace.tsx"), "utf8");

describe("passport authenticated workspace", () => {
  it("checks identity before rendering any private panel", () => {
    expect(source).toContain('fetch("/api/passport-verification/me"');
    expect(source).toContain("if (!role)");
    expect(source).toContain('role === "admin"');
    expect(source).toContain('role === "reviewer"');
  });
  it("does not fetch without a token and cancels stale requests", () => {
    expect(source).toContain("if (!accessToken)");
    expect(source).toContain("controller.abort()");
    expect(source).toContain('cache: "no-store"');
  });
  it("does not persist or expose credentials", () => {
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("console.log");
    expect(source).not.toContain("window.location");
  });
});
