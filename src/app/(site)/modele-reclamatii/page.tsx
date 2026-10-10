import { ComplaintModelsList, complaintListMetadata } from "@/components/complaint-model-page";

export const metadata = complaintListMetadata("ro");

export default function ComplaintModelsPage() {
  return <ComplaintModelsList lang="ro" />;
}
