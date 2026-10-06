import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { ComplaintForm } from "@/components/complaint-form";
import { EmbedCode } from "@/components/calc/embed-code";
import { COMPLAINT_MODELS, loadComplaintModel } from "@/lib/complaint-models";
import { SITE_URL } from "@/lib/seo";

// Textul vine din ghidul legat, la build.
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPLAINT_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/modele-reclamatii/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = COMPLAINT_MODELS.find((x) => x.slug === slug);
  return m ? { title: `Model: ${m.title}`, description: m.description, alternates: { canonical: `/modele-reclamatii/${m.slug}/` } } : {};
}

export default async function ComplaintModelPage({ params }: PageProps<"/modele-reclamatii/[slug]">) {
  const { slug } = await params;
  const r = await loadComplaintModel(slug);
  if (!r) notFound();
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-8">
      <div className="print:hidden">
        <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Modele de reclamații", href: "/modele-reclamatii/" }, { label: r.model.title }]} />
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Model: {r.model.title}</h1>
        <p className="mt-3 text-lg text-sub">{r.model.description}</p>
        <p className="mt-3 text-sm text-sub">Completează câmpurile, apoi descarcă scrisoarea în Word sau PDF. Câmpurile goale rămân între paranteze, ca să le scrii de mână.</p>
      </div>
      <div className="mt-6">
        <ComplaintForm template={r.template} title={r.model.title} />
      </div>
      <div className="print:hidden">
        <Link href={`/ghiduri/${r.guide.slug}/`} className="mt-8 block rounded border border-line bg-white p-4 text-ink hover:border-teal">
          <span className="block font-mono text-xs uppercase tracking-wide text-teal">Ghid complet</span>
          <span className="mt-1 block font-medium">{r.guide.title} →</span>
          <span className="mt-1 block text-sm text-sub">Unde depui reclamația, termenele de răspuns și ce faci dacă nu primești răspuns.</span>
        </Link>
        <p className="mt-4 text-xs text-sub">
          Model informativ, verificat pe sursele oficiale din ghid la {r.guide.updated}. Nu înlocuiește consultația unui jurist.
        </p>
        <EmbedCode slug={`reclamatie-${slug}`} src={`/embed/reclamatie/${slug}/`} title={r.model.title} siteUrl={SITE_URL} kind="model" />
      </div>
    </div>
  );
}
