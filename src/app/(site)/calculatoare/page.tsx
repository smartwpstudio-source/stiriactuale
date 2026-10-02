import type { Metadata } from "next";
import Link from "next/link";
import { IconCalculator } from "@tabler/icons-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

export const metadata: Metadata = {
  title: "Calculatoare: salariu net, concedii, curs valutar",
  description: "Calculatoare gratuite pentru Moldova: salariul net din brut, indemnizația de concediu medical și de maternitate, convertor valutar la cursul BNM.",
  alternates: { canonical: "/calculatoare/" },
};

export default async function CalculatorsPage() {
  const list = availableCalculators(await getCalcParams());
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Calculatoare" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Calculatoare</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">
        Calcule rapide pentru bani și acte în Moldova, cu valorile oficiale în vigoare și sursa fiecăreia.
      </p>
      <ul className="mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
        {list.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/calculatoare/${c.slug}/`}
              className="flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-shadow hover:border-teal hover:shadow-md"
            >
              <IconCalculator size={28} stroke={1.75} className="text-teal" aria-hidden />
              <span className="mt-3 font-serif text-xl leading-snug text-ink">{c.title}</span>
              <span className="mt-2 flex-1 text-[0.95rem] text-sub">{c.description}</span>
              <span className="mt-4 font-medium text-teal">Calculează →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
