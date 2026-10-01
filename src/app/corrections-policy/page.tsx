import { PolicyPage, policyMetadata } from "@/components/pages/PolicyPage";

export const metadata = policyMetadata("corrections-policy");

export default function Page() {
  return <PolicyPage slug="corrections-policy" />;
}
