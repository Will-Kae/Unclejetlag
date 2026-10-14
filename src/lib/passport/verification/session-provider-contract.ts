import { transitionSession, type SessionEvent, type SessionState } from "./session-lifecycle";

export type SessionSnapshot = {
  state: SessionState;
  accessToken: string | null;
};

/**
 * Pure reducer for the future invite-only Supabase Auth session owner.
 * Token is in memory only. Never trust a role passed from the browser:
 * AUTHORIZED must only be dispatched after /me confirms the active role.
 */
export type SessionAction =
  | { type: "TOKEN_RECEIVED"; accessToken: string }
  | { type: "IDENTITY_VERIFIED"; role: "admin" | "researcher" | "reviewer" }
  | { type: "TOKEN_EXPIRED" }
  | { type: "SIGNED_OUT" }
  | { type: "VERIFICATION_FAILED" };

export const initialPassportSession: SessionSnapshot = {
  state: { status: "signed_out" },
  accessToken: null,
};

export function reducePassportSession(snapshot: SessionSnapshot, action: SessionAction): SessionSnapshot {
  if (action.type === "TOKEN_RECEIVED") {
    if (!action.accessToken || action.accessToken.length > 8192 || /\s/.test(action.accessToken)) {
      return { state: { status: "error" }, accessToken: null };
    }
    return {
      state: transitionSession(snapshot.state, { type: "TOKEN_RECEIVED" }),
      accessToken: action.accessToken,
    };
  }

  if (action.type === "IDENTITY_VERIFIED") {
    if (snapshot.state.status !== "verifying" || !snapshot.accessToken) {
      return { state: { status: "error" }, accessToken: null };
    }
    const event: SessionEvent = { type: "AUTHORIZED", role: action.role };
    return { state: transitionSession(snapshot.state, event), accessToken: snapshot.accessToken };
  }

  return {
    state: transitionSession(snapshot.state, { type: action.type }),
    accessToken: null,
  };
}
