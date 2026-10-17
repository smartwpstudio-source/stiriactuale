import Link from "next/link";
import { IconCalculator, IconFileText } from "@tabler/icons-react";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

// Bara din dreapta a primei pagini: uneltele site-ului, mereu la îndemână —
// calculatoarele și modelele de reclamații.
export async function ToolsBox() {
  const calcs = availableCalculators(await getCalcParams());
  return (
    <>
      <section className="rounded-lg border border-line bg-white p-4">
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-teal">
          <IconCalculator size={16} stroke={1.75} aria-hidden /> Calculatoare
        </h2>
        <ul className="mt-2 divide-y divide-line">
          {calcs.map((c) => (
            <li key={c.slug}>
              <Link prefetch={false} href={`/calculatoare/${c.slug}/`} className="block py-1.5 text-[0.95rem] text-ink hover:text-teal">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Link prefetch={false} href="/modele-reclamatii/" className="block rounded-lg border-2 border-teal/50 bg-white p-4 hover:border-teal">
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-teal">
          <IconFileText size={16} stroke={1.75} aria-hidden /> Modele de reclamații
        </span>
        <span className="mt-1 block font-medium leading-snug text-ink">
          Bancă, executor, notar, primărie, operator mobil: completezi și descarci în Word sau PDF →
        </span>
      </Link>
    </>
  );
}
