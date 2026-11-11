import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(join(process.cwd(), "src/app/passport-verification/page.tsx"), "utf8");
const layout = readFileSync(join(process.cwd(), "src/app/passport-verification/layout.tsx"), "utf8");

describe("private verification sign-in mount", () => {
  it("mounts the invite-only login behind the server feature flag", () => {
    expect(page).toContain("<PassportSignIn />");
    expect(layout).toContain("if (!isVerificationEnabled()) notFound()");
  });
  it("does not leak server secrets or enable public registration", () => {
    expect(page).not.toContain("SUPABASE_SECRET_KEY");
    expect(page).not.toContain("signUp");
    expect(layout).toContain("index: false");
  });
});
