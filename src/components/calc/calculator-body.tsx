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
import { LoanCalculator } from "./loan";
import { SchengenCalculator } from "./schengen";
import { PortionsCalculator } from "./portions";
import { GasBillCalculator } from "./gas-bill";
import { PowerBillCalculator } from "./power-bill";
import { HeatingCalculator } from "./heating";
import { CaloriesCalculator } from "./calories";
import { RadiatorsCalculator } from "./radiators";
import { FirewoodCalculator } from "./firewood";
import { DepositCalculator } from "./deposit";
import { OvertimeCalculator } from "./overtime";
import { WorkdaysCalculator } from "./workdays";
import { TripCalculator } from "./trip";
import { BmiCalculator } from "./bmi";
import { PregnancyCalculator } from "./pregnancy";
import { BirthAllowanceCalculator } from "./birth-allowance";
import { KitchenCalculator } from "./kitchen";
import { RetirementCalculator } from "./retirement";
import { TrafficFinesCalculator } from "./traffic-fines";
import { VatCalculator } from "./vat";
import { LatePaymentCalculator } from "./late-payment";
import { RenovationCalculator } from "./renovation";
import { RcaCalculator } from "./rca";
import { T, calcText, noteText, type Lang, type NoteKey } from "./i18n";
import { getBnmRates } from "@/lib/bnm";
import { availableCalculators, ENERGY_SOURCES } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

type Source = { name: string; url: string };

// Sursele calculatoarelor din lotul 2 (citite la 15.10.2026)
const CODUL_MUNCII = "https://www.legis.md/cautare/getResults?doc_id=156323&lang=ro";
const LOT2_SOURCES: Record<string, Source[]> = {
  "dobanda-depozit": [
    { name: "Codul fiscal, art. 90¹ alin. (3⁷) — impozitul de 6% pe dobânzi (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=155071&lang=ro" },
    { name: "FGDSB — plafonul de garantare pentru deponenți", url: "https://fgdsb.md/pentru-deponenti/" },
  ],
  "ore-suplimentare": [{ name: "Codul muncii, art. 103, 104, 157, 158, 159 (legis.md)", url: CODUL_MUNCII }],
  "zile-lucratoare": [
    { name: "Codul muncii, art. 95, 100, 102, 111 (legis.md)", url: CODUL_MUNCII },
    { name: "HG nr. 963/2022 — transferul unor zile de odihnă în 2023 (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=134774&lang=ro" },
    { name: "HG nr. 289/2023 — zilele de odihnă 1 și 2 iunie 2023 (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=136974&lang=ro" },
  ],
  "cost-calatorie": [{ name: "ANRE — prețurile maxime la produsele petroliere (stabilite la 15.10.2026)", url: "https://anre.md/" }],
};

// Sursele calculatoarelor din lotul 3 (citite la 15.10.2026). Sarcina: surse medicale
// secundare (spital, NHS) — regula lui Naegele nu e o normă legală.
const LOT3_SOURCES: Record<string, Source[]> = {
  imc: [
    { name: "OMS Europa — Nutrition for a healthy life: clasificarea IMC la adulți", url: "https://www.who.int/europe/news-room/fact-sheets/item/nutrition---maintaining-a-healthy-lifestyle" },
    { name: "OMS — Obesity and overweight (copii și adolescenți)", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight" },
  ],
  sarcina: [
    { name: "Cedars-Sinai — Calculating a Due Date (regula lui Naegele, 280 de zile)", url: "https://www.cedars-sinai.org/health-topics/calculating-a-due-date" },
    { name: "NHS — Due date calculator (ciclu diferit de 28 de zile)", url: "https://www.nhs.uk/pregnancy/finding-out/due-date-calculator/" },
  ],
  "indemnizatie-nastere": [
    { name: "CNAS — indemnizații adresate familiilor cu copii (21 886 lei pentru copiii născuți din 2026)", url: "https://cnas.gov.md/ro/servicii/servicii/indemnizatii/indemnizatii-adresate-familiilor-cu-copii" },
    { name: "Guvern — proiectul HG de modificare a anexei nr. 1 la HG nr. 1478/2002 și nota de fundamentare (ședința din decembrie 2025)", url: "https://www.gov.md/sites/default/files/media/documents/sedinte-de-guvern/2025-12/NU-927-MMPS-2025.pdf" },
    { name: "Legea nr. 315/2016 privind prestațiile sociale pentru copii, art. 5 (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=97157&lang=ro" },
  ],
};

// Sursele calculatoarelor din lotul 4 (citite la 16.10.2026). Materialele pentru renovare: doar
// valori tipice, fără sursă oficială.
const LEGIS = (id: number) => `https://www.legis.md/cautare/getResults?doc_id=${id}&lang=ro`;
const BNM_DECISION = (d: string) => `https://www.bnm.md/ro/content/decizia-de-politica-monetara-${d}`;
const LOT4_SOURCES: Record<string, Source[]> = {
  "varsta-pensionare": [{ name: "Legea nr. 156/1998 privind sistemul public de pensii, art. 15, 15², 41, 42 (legis.md, versiunea din 02.10.2026)", url: LEGIS(156676) }],
  "amenzi-rutiere": [{ name: "Codul contravențional nr. 218/2008, art. 34, 36, 228–245 (legis.md, versiunea din 13.09.2026)", url: LEGIS(155852) }],
  tva: [{ name: "Codul fiscal nr. 1163/1997, art. 96 (legis.md, versiunea din 01.07.2026)", url: LEGIS(138613) }],
  "penalitati-intarziere": [
    { name: "Codul civil nr. 1107/2002, art. 874, 942, 943 (legis.md, versiunea din 01.04.2026)", url: LEGIS(150498) },
    { name: "Codul fiscal nr. 1163/1997, art. 228 (legis.md, versiunea din 01.07.2026)", url: LEGIS(138613) },
    { name: "BNM — decizia de politică monetară din 05.12.2024 (rata de bază 3,60%)", url: BNM_DECISION("05122024") },
    { name: "BNM — decizia din 19.06.2025 (6,50%)", url: BNM_DECISION("19062025") },
    { name: "BNM — decizia din 06.11.2025 (6,00%)", url: BNM_DECISION("06112025") },
    { name: "BNM — decizia din 11.12.2025 (5,00%)", url: BNM_DECISION("11122025") },
    { name: "BNM — decizia din 18.06.2026 (7,00%)", url: BNM_DECISION("18062026") },
  ],
  "rca-carte-verde": [
    { name: "Hotărârea BNM nr. 198 din 20.08.2026 privind primele de bază, coeficienții de rectificare și primele de referință RCA internă și externă (MO nr. 390-393 din 25.08.2026)", url: "https://bnm.md/files/Hot%C4%83r%C3%A2rea%20nr.%20198%20din%2020.08.2026.pdf" },
    { name: "Legea nr. 106/2022 privind asigurarea obligatorie RCA, art. 12 (bnm.md)", url: "https://www.bnm.md/ro/content/legea-nr106-din-21-04-2022-privind-asigurarea-obligatorie-de-raspundere-civila-auto-pentru" },
    { name: "Monitorul Fiscal FISC.md (2017) — zonele Carte Verde (sursă secundară)", url: "https://monitorul.fisc.md/editorial/de-la-inceput-de-an-creste-prima-de-baza-la-rca-si-carte-verde.html" },
    { name: "Portalul RCA al BNM — calculatoare și clasa bonus-malus", url: "https://rca.bnm.md/online" },
  ],
};

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
  } else if (slug === "rata-credit") {
    body = <LoanCalculator lang={lang} />;
  } else if (slug === "regula-90-180") {
    body = <SchengenCalculator lang={lang} />;
  } else if (slug === "portii-eveniment") {
    body = <PortionsCalculator lang={lang} />;
  } else if (slug === "factura-gaz") {
    body = <GasBillCalculator lang={lang} />;
    sources = ENERGY_SOURCES.gaz;
  } else if (slug === "factura-curent") {
    body = <PowerBillCalculator lang={lang} />;
    sources = ENERGY_SOURCES.curent;
  } else if (slug === "cost-incalzire") {
    body = <HeatingCalculator lang={lang} />;
    sources = ENERGY_SOURCES.caldura;
  } else if (slug === "calorii") {
    body = <CaloriesCalculator lang={lang} />;
    sources = [{ name: "Mifflin MD, St Jeor ST et al., Am J Clin Nutr 1990;51(2):241–247 (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/2305711/" }];
  } else if (slug === "putere-calorifere") {
    body = <RadiatorsCalculator lang={lang} />;
  } else if (slug === "lemne-peleti") {
    body = <FirewoodCalculator lang={lang} />;
  } else if (slug === "dobanda-depozit") {
    body = <DepositCalculator lang={lang} />;
    sources = LOT2_SOURCES[slug];
  } else if (slug === "ore-suplimentare") {
    body = <OvertimeCalculator lang={lang} />;
    sources = LOT2_SOURCES[slug];
  } else if (slug === "zile-lucratoare") {
    body = <WorkdaysCalculator lang={lang} />;
    sources = LOT2_SOURCES[slug];
  } else if (slug === "cost-calatorie") {
    body = <TripCalculator lang={lang} />;
    sources = LOT2_SOURCES[slug];
  } else if (slug === "imc") {
    body = <BmiCalculator lang={lang} />;
    sources = LOT3_SOURCES[slug];
  } else if (slug === "sarcina") {
    body = <PregnancyCalculator lang={lang} />;
    sources = LOT3_SOURCES[slug];
  } else if (slug === "indemnizatie-nastere") {
    body = <BirthAllowanceCalculator lang={lang} />;
    sources = LOT3_SOURCES[slug];
  } else if (slug === "masuri-culinare") {
    body = <KitchenCalculator lang={lang} />;
  } else if (slug === "varsta-pensionare") {
    body = <RetirementCalculator lang={lang} />;
    sources = LOT4_SOURCES[slug];
  } else if (slug === "amenzi-rutiere") {
    body = <TrafficFinesCalculator lang={lang} />;
    sources = LOT4_SOURCES[slug];
  } else if (slug === "tva") {
    body = <VatCalculator lang={lang} />;
    sources = LOT4_SOURCES[slug];
  } else if (slug === "penalitati-intarziere") {
    body = <LatePaymentCalculator lang={lang} />;
    sources = LOT4_SOURCES[slug];
  } else if (slug === "materiale-renovare") {
    body = <RenovationCalculator lang={lang} />;
  } else if (slug === "rca-carte-verde") {
    body = <RcaCalculator lang={lang} />;
    sources = LOT4_SOURCES[slug];
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
  // calculatoarele fără parametri oficiali au nota lor (fără „valorile oficiale pentru anul X”)
  const note =
    t.notes.own[found.slug] ??
    (slug === "convertor-valutar" || !p
      ? ""
      : key && section
        ? `${noteText(key, section.nota, lang)} ${t.notes[key]}`
        : t.notes.generic(p.an, p.updated));
  return { calc: c, body, sources, note };
}
