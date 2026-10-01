import { PolicyPage, policyMetadata } from "@/components/pages/PolicyPage";

export const metadata = policyMetadata("affiliate-disclosure");

export default function Page() {
  return <PolicyPage slug="affiliate-disclosure" />;
}
