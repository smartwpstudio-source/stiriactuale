import type { Metadata } from "next";
import Link from "next/link";
import { IconFileText } from "@tabler/icons-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";

export const metadata: Metadata = {
  title: "Modele de reclamații și plângeri gata de completat",
  description: "Modele gratuite de reclamație la bancă, asigurător, executor, notar, avocat, primărie, operator mobil, spital sau magazin online. Completezi și descarci în Word sau PDF.",
  alternates: { canonical: "/modele-reclamatii/" },
};

export default function ComplaintModelsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Modele de reclamații" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Modele de reclamații</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">
        Scrisori gata de completat, cu temeiul legal și termenul de răspuns. Completezi câmpurile și descarci reclamația în Word sau PDF — datele tale nu se trimit nicăieri.
      </p>
      <p className="mt-2 max-w-2xl text-sub">
        Nu știi cui să te adresezi? Vezi ghidul{" "}
        <Link href="/ghiduri/unde-reclami-ghid-cu-toate-institutiile/" className="underline hover:text-ink">
          Unde reclami: toate instituțiile
        </Link>
        .
      </p>
      <ul className="mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
        {COMPLAINT_MODELS.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/modele-reclamatii/${m.slug}/`}
              className="flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-shadow hover:border-teal hover:shadow-md"
            >
              <IconFileText size={28} stroke={1.75} className="text-teal" aria-hidden />
              <span className="mt-3 font-serif text-xl leading-snug text-ink">{m.title}</span>
              <span className="mt-2 flex-1 text-[0.95rem] text-sub">{m.description}</span>
              <span className="mt-4 font-medium text-teal">Completează modelul →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
