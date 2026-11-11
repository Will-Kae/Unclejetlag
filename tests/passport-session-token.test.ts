import { describe, expect, it } from "vitest";
import { extractPassportBearer } from "../src/lib/passport/verification/session-token";

describe("passport bearer extraction", () => {
  it("rejects missing and malformed authorization", () => {
    expect(extractPassportBearer(null)).toBeNull();
    expect(extractPassportBearer("")).toBeNull();
    expect(extractPassportBearer("Basic abc")).toBeNull();
    expect(extractPassportBearer("Bearer ")).toBeNull();
    expect(extractPassportBearer("bearer token")).toBeNull();
    expect(extractPassportBearer("Bearer token with spaces")).toBeNull();
    expect(extractPassportBearer("Bearer token\n")).toBeNull();
    expect(extractPassportBearer("Bearer " + "x".repeat(8193))).toBeNull();
  });
  it("extracts a bounded opaque token without interpreting claims", () => {
    expect(extractPassportBearer("Bearer abc.def-123")).toBe("abc.def-123");
  });
});
