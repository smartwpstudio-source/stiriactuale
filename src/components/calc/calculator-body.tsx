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
import { T, calcText, noteText, type Lang, type NoteKey } from "./i18n";
import { getBnmRates } from "@/lib/bnm";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

type Source = { name: string; url: string };

const NOTE_KEY: Partial<Record<string, NoteKey>> = {
  "taxa-drum": "taxa_drum",
  "concediu-odihna": "concediu_odihna",
  "indemnizatie-somaj": "somaj",
  "indemnizatie-crestere-copil": "crestere_copil",
  "vamuire-auto": "vamuire_auto",
  "impozit-imobil": "impozit_imobil",
};

// Calculatorul + sursele lui — același pe pagina din site și în widget (/embed/),
// în română sau rusă (/ru/calculatoare/): aceeași logică, alte texte (i18n.ts).
export async function loadCalculator(slug: string, lang: Lang = "ro") {
  const p = await getCalcParams();
  const found = availableCalculators(p).find((x) => x.slug === slug);
  if (!found) return null;
  const c = calcText(found, lang);
  const t = T[lang];
  let body: React.ReactNode = null;
  let sources: Source[] = [];
  if (slug === "convertor-valutar") {
    const bnm = await getBnmRates();
    body = bnm ? <CurrencyConverter rates={bnm.rates} lang={lang} /> : <p className="text-sub">{t.currency.unavailable}</p>;
    if (bnm) sources = [{ name: t.currency.source(bnm.date), url: "https://www.bnm.md/ro/content/ratele-de-schimb" }];
  } else if (slug === "salariu-net" && p?.salariu) {
    body = <SalaryCalculator p={p.salariu} lang={lang} />;
    sources = p.salariu.surse;
  } else if (slug === "concediu-medical" && p?.concediu_medical) {
    body = <SickPayCalculator p={p.concediu_medical} lang={lang} />;
    sources = p.concediu_medical.surse;
  } else if (slug === "concediu-maternitate" && p?.maternitate) {
    body = <MaternityCalculator p={p.maternitate} lang={lang} />;
    sources = p.maternitate.surse;
  } else if (slug === "concediu-odihna" && p?.concediu_odihna) {
    body = <VacationCalculator p={p.concediu_odihna} lang={lang} />;
    sources = p.concediu_odihna.surse;
  } else if (slug === "indemnizatie-somaj" && p?.somaj) {
    body = <UnemploymentCalculator p={p.somaj} lang={lang} />;
    sources = p.somaj.surse;
  } else if (slug === "indemnizatie-crestere-copil" && p?.crestere_copil) {
    body = <ChildcareCalculator p={p.crestere_copil} lang={lang} />;
    sources = p.crestere_copil.surse;
  } else if (slug === "vamuire-auto" && p?.vamuire_auto) {
    body = <CustomsCalculator p={p.vamuire_auto} lang={lang} />;
    sources = p.vamuire_auto.surse;
  } else if (slug === "impozit-imobil" && p?.impozit_imobil) {
    body = <PropertyTaxCalculator p={p.impozit_imobil} lang={lang} />;
    sources = p.impozit_imobil.surse;
  } else if (slug === "taxa-drum" && p?.taxa_drum) {
    body = <RoadTaxCalculator p={p.taxa_drum} lang={lang} />;
    sources = p.taxa_drum.surse;
  }
  // nota din parametri.json (tradusă, dacă traducerea e la zi) + cine stabilește suma exactă
  const key = NOTE_KEY[slug];
  const section = key && p?.[key];
  const note =
    slug === "convertor-valutar" || !p
      ? ""
      : key && section
        ? `${noteText(key, section.nota, lang)} ${t.notes[key]}`
        : t.notes.generic(p.an, p.updated);
  return { calc: c, body, sources, note };
}
