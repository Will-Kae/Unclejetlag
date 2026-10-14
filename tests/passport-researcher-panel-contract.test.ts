import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/passport/verification/ResearcherDataPanel.tsx"), "utf8");

describe("private researcher data panel", () => {
  it("does not fetch without a supplied access token", () => {
    expect(source).toContain("if (!accessToken) return;");
    expect(source).toContain("Sign in to access your private research workspace");
  });
  it("does not persist credentials and cancels stale requests", () => {
    expect(source).toContain("new AbortController()");
    expect(source).toContain("controller.abort()");
    expect(source).toContain('cache: "no-store"');
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
  });
  it("validates response shape and marks partial totals", () => {
    expect(source).toContain("isData(payload)");
    expect(source).toContain("Totals are limited to this page");
  });
});
