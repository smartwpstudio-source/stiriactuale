// Calculatoare: formulele sunt aici, valorile (procente, plafoane) în
// content/calculatoare/parametri.json — verificate pe legis.md / sfs.md /
// cnas.gov.md de o sesiune cloud și aprobate prin PR, cu sursa fiecăreia.
// Un calculator fără parametri nu apare (nu afișăm cifre neverificate).
// Fără importuri de server aici: formulele rulează și în browser
// (citirea fișierului e în calculators-data.ts).

type Source = { name: string; url: string };

export interface CalcParams {
  updated: string;
  an: number;
  salariu?: {
    impozit_venit_pct: number;
    scutire_personala_anuala_lei: number;
    scutire_prag_venit_anual_lei?: number | null; // peste acest venit anual nu se acordă scutirea
    cnam_angajat_pct: number;
    cnas_angajat_pct: number;
    salariu_minim_lei: number;
    cnas_deductibil: boolean;
    cnam_deductibil: boolean;
    nota?: string;
    surse: Source[];
  };
  concediu_medical?: {
    trepte: { stagiu_min_ani: number; procent: number }[];
    baza?: string;
    luni_baza: number;
    zile_medii_luna: number;
    plafon_lei: number | null;
    primele_zile_angajator: number;
    angajator_pct?: number; // primele zile le plătește angajatorul, din salariul mediu
    surse: Source[];
  };
  maternitate?: {
    procent: number;
    luni_baza: number;
    zile_total: number;
    durate?: { zile: number; caz: string }[];
    zile_medii_luna: number;
    plafon_lei: number | null;
    surse: Source[];
  };
  taxa_drum?: {
    nota: string;
    categorii: RoadTaxCategory[];
    surse: Source[];
  };
  concediu_odihna?: { zile_minime: number; zile_medii_luna: number; nota: string; surse: Source[] };
  somaj?: {
    procent: number;
    stagiu_minim_luni: number;
    durate: { stagiu_min_luni: number; luni: number }[];
    nota: string;
    surse: Source[];
  };
  vamuire_auto?: {
    varste: string[]; // coloanele anexei: "0-2", "3-4", "5-6", "7" … "19", "20+"
    benzina: { max: number | null; cote: number[] }[];
    diesel: { max: number | null; cote: number[] }[];
    reducere_hibrid_pct: number;
    reducere_plugin_pct: number;
    lux: { de_la: number; pct: number }[];
    nota: string;
    surse: Source[];
  };
  impozit_imobil?: { cota_minima_pct: number; nota: string; surse: Source[] };
  crestere_copil?: {
    minim_lunar_lei: number;
    plafon_baza_lei: number;
    indemnizatie_unica_lei: number;
    suplimentar_lunar_lei: number;
    suplimentar_luni: number;
    optiuni: { id: string; nume: string; etape: { procent: number; luni: number; minim: number }[] }[];
    nota: string;
    surse: Source[];
  };
}

// Taxa pentru folosirea drumurilor (Codul fiscal, Anexa nr. 1 la Titlul IX):
// treapta = primul prag `max` (inclusiv) în care intră valoarea; suma =
// `suma` fixă sau `rata` × valoarea întreagă (nu doar partea din treaptă).
export interface RoadTaxCategory {
  id: string;
  nume: string;
  unitate: string | null; // null = sumă fixă, fără câmp
  camp?: string;
  implicit?: number;
  trepte: { max: number | null; rata?: number; suma?: number }[];
}


export const CALCULATORS = [
  { slug: "convertor-valutar", title: "Convertor valutar", description: "Lei în euro, dolari, lei românești și invers, la cursul oficial BNM de azi.", needs: null },
  { slug: "salariu-net", title: "Salariul net", description: "Cât primești „în mână” din salariul brut: impozit, CNAM și CNAS, pas cu pas.", needs: "salariu" },
  { slug: "concediu-medical", title: "Indemnizația de concediu medical", description: "Cât primești pentru zilele de boală, după venit și stagiul de cotizare.", needs: "concediu_medical" },
  { slug: "concediu-maternitate", title: "Indemnizația de maternitate", description: "Suma estimată pentru concediul de maternitate, după venitul asigurat.", needs: "maternitate" },
  { slug: "concediu-odihna", title: "Indemnizația de concediu de odihnă", description: "Cât primești pentru concediul anual, după salariul mediu din ultimele 3 luni.", needs: "concediu_odihna" },
  { slug: "indemnizatie-somaj", title: "Indemnizația de șomaj", description: "Cât primești lunar și câte luni, după venitul asigurat și stagiul de cotizare.", needs: "somaj" },
  { slug: "indemnizatie-crestere-copil", title: "Indemnizația pentru creșterea copilului", description: "Cele trei opțiuni (30%, 60%, 90%): cât primești lunar și în total, plus indemnizația unică la naștere.", needs: "crestere_copil" },
  { slug: "vamuire-auto", title: "Vămuirea mașinii (acciza)", description: "Cât plătești la vamă pentru o mașină adusă din străinătate: acciza după motor, capacitate și anul fabricației.", needs: "vamuire_auto" },
  { slug: "impozit-imobil", title: "Impozitul pe casă și teren", description: "Impozitul anual pe bunurile imobiliare, din valoarea estimată și cota primăriei.", needs: "impozit_imobil" },
  { slug: "taxa-drum", title: "Taxa pentru folosirea drumurilor", description: "Cât plătești pe an pentru mașină, motocicletă, remorcă sau autobuz, după cotele din Codul fiscal.", needs: "taxa_drum", guide: "taxa-pentru-folosirea-drumurilor-cat-platesti-si-cand" },
] as const;

export type CalculatorSlug = (typeof CALCULATORS)[number]["slug"];

export function availableCalculators(p: CalcParams | null) {
  return CALCULATORS.filter((c) => c.needs === null || (p && p[c.needs]));
}

const round = (n: number) => Math.round(n * 100) / 100;

export function netSalary(gross: number, s: NonNullable<CalcParams["salariu"]>) {
  const cnam = round((gross * s.cnam_angajat_pct) / 100);
  const cnas = round((gross * s.cnas_angajat_pct) / 100);
  const exempt = s.scutire_prag_venit_anual_lei && gross * 12 >= s.scutire_prag_venit_anual_lei ? 0 : s.scutire_personala_anuala_lei / 12;
  const base = Math.max(0, gross - (s.cnas_deductibil ? cnas : 0) - (s.cnam_deductibil ? cnam : 0) - exempt);
  const tax = round((base * s.impozit_venit_pct) / 100);
  return { gross: round(gross), cnam, cnas, tax, net: round(gross - cnam - cnas - tax) };
}

// brut pentru un net dorit — căutare binară (impozitul are prag, nu e liniar)
export function grossForNet(net: number, s: NonNullable<CalcParams["salariu"]>): number {
  let lo = net;
  let hi = net * 2 + 1000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (netSalary(mid, s).net < net) lo = mid;
    else hi = mid;
  }
  return round(hi);
}

// Primele zile: angajatorul (angajator_pct), restul: CNAS după stagiu.
// ponytail: un singur plafon pe venitul mediu și împărțire la media zilelor
// lunii — legea plafonează fiecare lună și împarte la zilele lunii (estimare).
export function sickPay(avgMonthly: number, years: number, days: number, c: NonNullable<CalcParams["concediu_medical"]>) {
  const pct = [...c.trepte].sort((a, b) => b.stagiu_min_ani - a.stagiu_min_ani).find((t) => years >= t.stagiu_min_ani)?.procent ?? 0;
  const base = c.plafon_lei ? Math.min(avgMonthly, c.plafon_lei) : avgMonthly;
  const perDay = base / c.zile_medii_luna;
  const empPct = c.angajator_pct ?? pct;
  const empDays = Math.min(days, c.primele_zile_angajator);
  const employer = round(((perDay * empPct) / 100) * empDays);
  const cnas = round(((perDay * pct) / 100) * (days - empDays));
  return { pct, empPct, empDays, daily: round((perDay * pct) / 100), employer, cnas, total: round(employer + cnas) };
}

export function maternityPay(avgMonthly: number, m: NonNullable<CalcParams["maternitate"]>, days = m.zile_total) {
  const base = m.plafon_lei ? Math.min(avgMonthly, m.plafon_lei) : avgMonthly;
  const daily = round(((base / m.zile_medii_luna) * m.procent) / 100);
  return { daily, total: round(daily * days), days };
}

export function roadTax(value: number, c: RoadTaxCategory) {
  const step = c.trepte.find((t) => t.max === null || value <= t.max) ?? c.trepte[c.trepte.length - 1];
  const tax = step.suma ?? round((step.rata ?? 0) * value);
  return { tax, step };
}

// Concediul de odihnă: estimare din salariul mediu lunar (zi calendaristică medie).
export function vacationPay(avgMonthly: number, days: number, v: NonNullable<CalcParams["concediu_odihna"]>) {
  const daily = round(avgMonthly / v.zile_medii_luna);
  return { daily, total: round(daily * days) };
}

// Șomaj: procent din venitul mediu asigurat; durata după stagiul total (luni).
export function unemployment(avgMonthly: number, stagiuLuni: number, s: NonNullable<CalcParams["somaj"]>) {
  if (stagiuLuni < s.stagiu_minim_luni) return null;
  const monthly = round((avgMonthly * s.procent) / 100);
  const luni = [...s.durate].reverse().find((d) => stagiuLuni >= d.stagiu_min_luni)?.luni ?? 0;
  return { monthly, luni, total: round(monthly * luni) };
}

// Creșterea copilului: fiecare opțiune, cu baza plafonată și minimul pe etapă.
export function childcare(avgMonthly: number, c: NonNullable<CalcParams["crestere_copil"]>) {
  const base = Math.min(avgMonthly, c.plafon_baza_lei);
  return c.optiuni.map((o) => {
    const etape = o.etape.map((e) => ({ ...e, lunar: Math.max(e.minim, round((base * e.procent) / 100)) }));
    return { id: o.id, nume: o.nume, etape, total: round(etape.reduce((t, e) => t + e.lunar * e.luni, 0)) };
  });
}

export type Engine = "benzina" | "diesel" | "hibrid-benzina" | "hibrid-diesel" | "plugin-benzina" | "plugin-diesel" | "electric";

// coloana de vârstă din anexa accizelor pentru o mașină de `age` ani
function ageColumn(age: number, cols: string[]): number {
  const a = Math.max(0, Math.floor(age));
  const i = cols.findIndex((c) => {
    if (c.endsWith("+")) return a >= Number(c.slice(0, -1));
    const [from, to = from] = c.split("-").map(Number);
    return a >= from && a <= to;
  });
  return i < 0 ? cols.length - 1 : i;
}

// Vămuirea: taxa vamală 0, TVA scutit — doar acciza (+ acciza de lux peste prag).
export function customsExcise(engine: Engine, cm3: number, age: number, customsValue: number, v: NonNullable<CalcParams["vamuire_auto"]>) {
  const luxPct = [...v.lux].reverse().find((t) => customsValue >= t.de_la)?.pct ?? 0;
  const lux = round((customsValue * luxPct) / 100);
  if (engine === "electric") return { rate: 0, reduction: 0, excise: 0, lux, luxPct, total: lux };
  const fuel = engine.endsWith("diesel") ? v.diesel : v.benzina;
  const row = fuel.find((t) => t.max === null || cm3 <= t.max) ?? fuel[fuel.length - 1];
  const rate = row.cote[ageColumn(age, v.varste)];
  const reduction = engine.startsWith("hibrid") ? v.reducere_hibrid_pct : engine.startsWith("plugin") ? v.reducere_plugin_pct : 0;
  const excise = round(rate * cm3 * (1 - reduction / 100));
  return { rate, reduction, excise, lux, luxPct, total: round(excise + lux) };
}

export function propertyTax(value: number, ratePct: number) {
  return round((value * ratePct) / 100);
}
