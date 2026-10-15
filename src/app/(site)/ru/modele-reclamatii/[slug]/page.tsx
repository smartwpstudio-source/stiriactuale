import type { Metadata } from "next";
import { ComplaintModelView, complaintModelMetadata } from "@/components/complaint-model-page";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";

// Varianta rusă: interfața în rusă, scrisoarea în română (limba în care o
// primesc instituțiile). Doar 13 pagini — se construiesc la build, ca cele românești.

export function generateStaticParams() {
  return COMPLAINT_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/ru/modele-reclamatii/[slug]">): Promise<Metadata> {
  return complaintModelMetadata((await params).slug, "ru");
}

export default async function RuComplaintModelPage({ params }: PageProps<"/ru/modele-reclamatii/[slug]">) {
  return <ComplaintModelView slug={(await params).slug} lang="ru" />;
}
