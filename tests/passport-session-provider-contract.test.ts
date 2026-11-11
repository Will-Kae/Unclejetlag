import { describe, expect, it } from "vitest";
import { initialPassportSession, reducePassportSession } from "../src/lib/passport/verification/session-provider-contract";

describe("in-memory passport session provider contract", () => {
  it("rejects malformed tokens", () => {
    expect(reducePassportSession(initialPassportSession, { type: "TOKEN_RECEIVED", accessToken: "a b" }))
      .toEqual({ state: { status: "error" }, accessToken: null });
  });
  it("does not authorize without a verifying session", () => {
    expect(reducePassportSession(initialPassportSession, { type: "IDENTITY_VERIFIED", role: "admin" }))
      .toEqual({ state: { status: "error" }, accessToken: null });
  });
  it("clears token on sign out, expiry and verification failure", () => {
    const pending = reducePassportSession(initialPassportSession, { type: "TOKEN_RECEIVED", accessToken: "opaque.token" });
    const authorized = reducePassportSession(pending, { type: "IDENTITY_VERIFIED", role: "researcher" });
    expect(authorized.state).toEqual({ status: "authorized", role: "researcher" });
    for (const type of ["SIGNED_OUT", "TOKEN_EXPIRED", "VERIFICATION_FAILED"] as const) {
      expect(reducePassportSession(authorized, { type }).accessToken).toBeNull();
    }
  });
});
