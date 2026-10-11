import { notFound } from "next/navigation";

/**
 * Fail-closed placeholder. Never show submission or review data here
 * until authenticated Supabase sessions and role authorization are wired.
 */
export default function PassportVerificationPage() {
  notFound();
}
