import { PolicyPage, policyMetadata } from "@/components/pages/PolicyPage";

export const metadata = policyMetadata("privacy");

export default function Page() {
  return <PolicyPage slug="privacy" />;
}
