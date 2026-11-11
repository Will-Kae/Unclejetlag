/**
 * Pure session lifecycle policy for the private verification workspace.
 * Actual Supabase Auth sign-in and refresh are not enabled until a secure
 * session owner and invite-only access flow are implemented.
 */
export type SessionState =
  | { status: "signed_out" }
  | { status: "verifying" }
  | { status: "authorized"; role: "admin" | "researcher" | "reviewer" }
  | { status: "expired" }
  | { status: "error" };

export type SessionEvent =
  | { type: "TOKEN_RECEIVED" }
  | { type: "AUTHORIZED"; role: "admin" | "researcher" | "reviewer" }
  | { type: "TOKEN_EXPIRED" }
  | { type: "SIGNED_OUT" }
  | { type: "VERIFICATION_FAILED" };

export function transitionSession(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "SIGNED_OUT":
      return { status: "signed_out" };
    case "TOKEN_EXPIRED":
      return { status: "expired" };
    case "TOKEN_RECEIVED":
      return { status: "verifying" };
    case "VERIFICATION_FAILED":
      return { status: "error" };
    case "AUTHORIZED":
      return state.status === "verifying"
        ? { status: "authorized", role: event.role }
        : { status: "error" };
  }
}
