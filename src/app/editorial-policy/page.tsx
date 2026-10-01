import { PolicyPage, policyMetadata } from "@/components/pages/PolicyPage";

export const metadata = policyMetadata("editorial-policy");

export default function Page() {
  return <PolicyPage slug="editorial-policy" />;
}
