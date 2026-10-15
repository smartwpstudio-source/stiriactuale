import type { Metadata } from "next";
import { ComplaintModelView, complaintModelMetadata } from "@/components/complaint-model-page";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";

// Textul vine din ghidul legat, la build.

export function generateStaticParams() {
  return COMPLAINT_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/modele-reclamatii/[slug]">): Promise<Metadata> {
  return complaintModelMetadata((await params).slug, "ro");
}

export default async function ComplaintModelPage({ params }: PageProps<"/modele-reclamatii/[slug]">) {
  return <ComplaintModelView slug={(await params).slug} lang="ro" />;
}
