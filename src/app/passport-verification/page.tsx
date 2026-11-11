import { PassportSignIn } from "@/components/passport/verification/PassportSignIn";

/**
 * The parent server layout fails closed unless the private workspace flag is
 * explicitly enabled. This page never receives or renders service credentials.
 * Supabase Auth and /me authorize the role before any dashboard is shown.
 */
export default function PassportVerificationPage() {
  return <PassportSignIn />;
}
