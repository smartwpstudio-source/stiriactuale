import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { AnalysisCard } from "@/components/analysis-card";
import { getAnalyses } from "@/lib/content/analyses";

export const metadata: Metadata = {
  title: "Analiză: opinia autorului despre subiectele zilei",
  description: "Analize semnate de Radu Druță despre politica, economia și societatea din Moldova: opinie argumentată, fapte verificate, întrebări fără răspuns.",
  alternates: { canonical: "/analiza/" },
};

export default async function AnalysesPage() {
  const list = await getAnalyses();
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Analiză" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Analiză</h1>
      <p className="mt-3 text-lg text-sub">
        Opinia autorului despre subiectele care contează: ce stă în spatele știrii, ce lipsește din discursul public și ce
        întrebări trebuie puse. Opinia e asumată; faptele sunt verificate și au sursă.
      </p>
      <div className="mt-8 space-y-5">
        {list.map((a) => (
          <AnalysisCard key={a.slug} a={a} />
        ))}
        {list.length === 0 && <p className="text-sub">Prima analiză apare în curând.</p>}
      </div>
    </div>
  );
}
