import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintForm } from "@/components/complaint-form";
import { EmbedHeight } from "@/components/calc/embed-height";
import { COMPLAINT_MODELS, loadComplaintModel } from "@/lib/complaint-models";

// Modelul de reclamație inserat pe alte site-uri (iframe), ca widget-ul
// calculatoarelor. noindex: pagina canonică e /modele-reclamatii/<slug>/.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export function generateStaticParams() {
  return COMPLAINT_MODELS.map((m) => ({ slug: m.slug }));
}

export default async function ComplaintEmbedPage({ params }: PageProps<"/embed/reclamatie/[slug]">) {
  const { slug } = await params;
  const r = await loadComplaintModel(slug);
  if (!r) notFound();
  return (
    <div className="mx-auto w-full max-w-[680px] bg-paper p-3 sm:p-4">
      <EmbedHeight slug={`reclamatie-${slug}`} />
      <h1 className="font-serif text-xl text-ink sm:text-2xl print:hidden">Model: {r.model.title}</h1>
      <div className="mt-4">
        <ComplaintForm template={r.template} title={r.model.title} />
      </div>
      <p className="mt-3 text-xs text-sub print:hidden">
        <a href={`/modele-reclamatii/${slug}/`} target="_blank" rel="noopener" className="underline">
          Știri Actuale — modele de reclamații și ghiduri
        </a>
      </p>
    </div>
  );
}
