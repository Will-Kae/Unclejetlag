import { PolicyPage, policyMetadata } from "@/components/pages/PolicyPage";

export const metadata = policyMetadata("cookies");

export default function Page() {
  return <PolicyPage slug="cookies" />;
}
