import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isVerificationEnabled } from "@/lib/passport/verification/server-config";

export const metadata = { title: "Passport Verification Workspace", robots: { index: false, follow: false } };

export default function PassportVerificationLayout({ children }: { children: ReactNode }) {
  // The workspace is not exposed until authentication and role-scoped
  // data access are fully implemented and security-tested.
  if (!isVerificationEnabled()) notFound();
  return <section aria-label="Private passport verification workspace">{children}</section>;
}
