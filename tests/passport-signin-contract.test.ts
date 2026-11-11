import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/passport/verification/PassportSignIn.tsx"), "utf8");

describe("private password sign-in security contract", () => {
  it("has no public registration and checks active role before granting access", () => {
    expect(source).toContain("grant_type=password");
    expect(source).toContain('fetch("/api/passport-verification/me"');
    expect(source).toContain("if (!check.ok)");
    expect(source).toContain("<AuthenticatedWorkspace accessToken={token} />");
    expect(source).not.toContain("signUp");
  });
  it("does not persist sessions or credentials", () => {
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("document.cookie");
    expect(source).toContain("setPassword(\"\")");
    expect(source).toContain("setToken(null)");
  });
  it("uses public keys only and enforces token expiry", () => {
    expect(source).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(source).not.toContain("SUPABASE_SECRET_KEY");
    expect(source).toContain("setTimeout");
    expect(source).toContain("Math.min(payload.expires_in * 1000, 3600000)");
  });
});
