import { describe, expect, it } from "vitest";
import { allowedPassportWriteOrigin } from "../../src/lib/passport/verification/write-origin";

describe("passport write origin allowlist", () => {
  const allow = "https://unclejetlag.com,https://www.unclejetlag.com";
  it("accepts explicitly trusted HTTPS origins", () => {
    expect(allowedPassportWriteOrigin("https://unclejetlag.com", allow)).toBe(true);
    expect(allowedPassportWriteOrigin("https://www.unclejetlag.com", allow)).toBe(true);
  });
  it("rejects absent and unconfigured origins", () => {
    expect(allowedPassportWriteOrigin(null, allow)).toBe(false);
    expect(allowedPassportWriteOrigin("https://unclejetlag.com", undefined)).toBe(false);
  });
  it("rejects lookalikes, malformed origins and prefixes", () => {
    for (const origin of [
      "https://unclejetlag.com.evil.test",
      "https://evil.test",
      "https://unclejetlag.com/path",
      "https://unclejetlag.com/",
      "https://unclejetlag.com@evil.test",
      "null",
    ]) expect(allowedPassportWriteOrigin(origin, allow)).toBe(false);
  });
  it("rejects non-HTTPS configured origins", () => {
    expect(allowedPassportWriteOrigin("http://unclejetlag.com", "http://unclejetlag.com")).toBe(false);
  });
});
