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
