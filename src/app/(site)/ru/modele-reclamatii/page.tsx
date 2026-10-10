import { ComplaintModelsList, complaintListMetadata } from "@/components/complaint-model-page";

// Versiunea rusă a listei de modele de reclamații (același cod ca /modele-reclamatii/).
export const metadata = complaintListMetadata("ru");

export default function RuComplaintModelsPage() {
  return <ComplaintModelsList lang="ru" />;
}
