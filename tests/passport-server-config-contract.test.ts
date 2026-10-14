import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/lib/passport/verification/server-config.ts"), "utf8");

describe("privileged Supabase backend configuration", () => {
  it("requires a HTTPS project host and rejects URL credential components", () => {
    expect(source).toContain('parsed.protocol !== "https:"');
    expect(source).toContain("parsed.username");
    expect(source).toContain("parsed.password");
    expect(source).toContain("parsed.search");
    expect(source).toContain("parsed.hash");
  });
  it("matches only intended Supabase project hostnames", () => {
    const host = /^[a-z0-9-]+\.supabase\.co$/i;
    expect(host.test("higmlrqrgxdhvkmrdpru.supabase.co")).toBe(true);
    expect(host.test("supabase.co.attacker.example")).toBe(false);
    expect(host.test("localhost")).toBe(false);
    expect(host.test("higmlrqrgxdhvkmrdpru.supabase.co.attacker.example")).toBe(false);
    expect(source).toContain("Unexpected Supabase project host");
  });
});
