import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCalculator } from "@/components/calc/calculator-body";
import { CALCULATORS } from "@/lib/calculators";

// Widget-ul inserat pe alte site-uri (iframe): doar calculatorul, fără meniu
// și fără reclame (e în afara layout-ului (site)). noindex: pagina canonică e
// /calculatoare/<slug>/.
export const revalidate = 3600;
export const dynamicParams = false;
export const metadata: Metadata = { robots: { index: false, follow: true } };

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export default async function EmbedPage({ params }: PageProps<"/embed/[slug]">) {
  const { slug } = await params;
  const r = await loadCalculator(slug);
  if (!r) notFound();
  return (
    <div className="mx-auto w-full max-w-[640px] bg-paper p-4">
      <h1 className="font-serif text-2xl text-ink">{r.calc.title}</h1>
      <div className="mt-4">{r.body}</div>
      {r.note && <p className="mt-4 text-xs text-sub">{r.note}</p>}
      <p className="mt-3 text-xs text-sub">
        <a href={`/calculatoare/${slug}/`} target="_blank" rel="noopener" className="underline">
          Știri Actuale — calculatoare și știri din Moldova
        </a>
      </p>
    </div>
  );
}
