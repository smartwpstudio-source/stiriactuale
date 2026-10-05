import { CurrencyConverter } from "./currency";
import { MaternityCalculator } from "./maternity";
import { SalaryCalculator } from "./salary";
import { SickPayCalculator } from "./sick-pay";
import { RoadTaxCalculator } from "./road-tax";
import { VacationCalculator } from "./vacation";
import { UnemploymentCalculator } from "./unemployment";
import { ChildcareCalculator } from "./childcare";
import { CustomsCalculator } from "./customs";
import { PropertyTaxCalculator } from "./property-tax";
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
  } else if (slug === "concediu-odihna" && p?.concediu_odihna) {
    body = <VacationCalculator p={p.concediu_odihna} />;
    sources = p.concediu_odihna.surse;
  } else if (slug === "indemnizatie-somaj" && p?.somaj) {
    body = <UnemploymentCalculator p={p.somaj} />;
    sources = p.somaj.surse;
  } else if (slug === "indemnizatie-crestere-copil" && p?.crestere_copil) {
    body = <ChildcareCalculator p={p.crestere_copil} />;
    sources = p.crestere_copil.surse;
  } else if (slug === "vamuire-auto" && p?.vamuire_auto) {
    body = <CustomsCalculator p={p.vamuire_auto} />;
    sources = p.vamuire_auto.surse;
  } else if (slug === "impozit-imobil" && p?.impozit_imobil) {
    body = <PropertyTaxCalculator p={p.impozit_imobil} />;
    sources = p.impozit_imobil.surse;
  } else if (slug === "taxa-drum" && p?.taxa_drum) {
    body = <RoadTaxCalculator p={p.taxa_drum} />;
    sources = p.taxa_drum.surse;
  }
  const note =
    slug === "convertor-valutar" || !p
      ? ""
      : slug === "taxa-drum" && p.taxa_drum
        ? `${p.taxa_drum.nota} Suma exactă o confirmă Serviciul Fiscal de Stat.`
        : slug === "concediu-odihna" && p.concediu_odihna
          ? `${p.concediu_odihna.nota} Estimare orientativă; suma exactă o calculează angajatorul.`
          : slug === "indemnizatie-somaj" && p.somaj
            ? `${p.somaj.nota} Estimare orientativă; suma exactă o stabilește CNAS.`
            : slug === "indemnizatie-crestere-copil" && p.crestere_copil
              ? `${p.crestere_copil.nota} Estimare orientativă; suma exactă o stabilește CNAS.`
              : slug === "vamuire-auto" && p.vamuire_auto
                ? `${p.vamuire_auto.nota} Estimare orientativă; suma exactă o stabilește Serviciul Vamal.`
                : slug === "impozit-imobil" && p.impozit_imobil
                  ? `${p.impozit_imobil.nota} Suma exactă e pe avizul de plată.`
        : `Estimare orientativă, cu valorile oficiale pentru ${p.an} (verificate la ${p.updated}). Suma exactă o stabilește angajatorul sau instituția care plătește.`;
  return { calc: c, body, sources, note };
}
