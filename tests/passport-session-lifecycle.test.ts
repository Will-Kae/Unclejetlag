import { describe, expect, it } from "vitest";
import { transitionSession } from "../src/lib/passport/verification/session-lifecycle";

describe("private passport session lifecycle", () => {
  it("does not authorize a role without identity verification", () => {
    expect(transitionSession({ status: "signed_out" }, { type: "AUTHORIZED", role: "admin" }))
      .toEqual({ status: "error" });
  });
  it("authorizes only after a token enters verification", () => {
    const verifying = transitionSession({ status: "signed_out" }, { type: "TOKEN_RECEIVED" });
    expect(verifying).toEqual({ status: "verifying" });
    expect(transitionSession(verifying, { type: "AUTHORIZED", role: "reviewer" }))
      .toEqual({ status: "authorized", role: "reviewer" });
  });
  it("clears authorized identity on expiry or sign out", () => {
    const current = { status: "authorized" as const, role: "admin" as const };
    expect(transitionSession(current, { type: "TOKEN_EXPIRED" })).toEqual({ status: "expired" });
    expect(transitionSession(current, { type: "SIGNED_OUT" })).toEqual({ status: "signed_out" });
  });
});
