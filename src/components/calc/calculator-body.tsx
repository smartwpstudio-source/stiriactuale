import { CurrencyConverter } from "./currency";
import { MaternityCalculator } from "./maternity";
import { SalaryCalculator } from "./salary";
import { SickPayCalculator } from "./sick-pay";
import { RoadTaxCalculator } from "./road-tax";
import { getBnmRates } from "@/lib/bnm";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

type Source = { name: string; url: string };

// Calculatorul + sursele lui — același pe pagina din site și în widget (/embed/).
export async function loadCalculator(slug: string) {
  const p = await getCalcParams();
  const c = availableCalculators(p).find((x) => x.slug === slug);
  if (!c) return null;
  let body: React.ReactNode = null;
  let sources: Source[] = [];
  if (slug === "convertor-valutar") {
    const bnm = await getBnmRates();
    body = bnm ? <CurrencyConverter rates={bnm.rates} /> : <p className="text-sub">Cursul BNM nu e disponibil acum. Revino peste câteva minute.</p>;
    if (bnm) sources = [{ name: `Banca Națională a Moldovei — curs oficial din ${bnm.date}`, url: "https://www.bnm.md/ro/content/ratele-de-schimb" }];
  } else if (slug === "salariu-net" && p?.salariu) {
    body = <SalaryCalculator p={p.salariu} />;
    sources = p.salariu.surse;
  } else if (slug === "concediu-medical" && p?.concediu_medical) {
    body = <SickPayCalculator p={p.concediu_medical} />;
    sources = p.concediu_medical.surse;
  } else if (slug === "concediu-maternitate" && p?.maternitate) {
    body = <MaternityCalculator p={p.maternitate} />;
    sources = p.maternitate.surse;
  } else if (slug === "taxa-drum" && p?.taxa_drum) {
    body = <RoadTaxCalculator p={p.taxa_drum} />;
    sources = p.taxa_drum.surse;
  }
  const note =
    slug === "convertor-valutar" || !p
      ? ""
      : slug === "taxa-drum" && p.taxa_drum
        ? `${p.taxa_drum.nota} Suma exactă o confirmă Serviciul Fiscal de Stat.`
        : `Estimare orientativă, cu valorile oficiale pentru ${p.an} (verificate la ${p.updated}). Suma exactă o stabilește angajatorul sau instituția care plătește.`;
  return { calc: c, body, sources, note };
}
