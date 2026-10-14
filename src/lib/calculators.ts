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
  { slug: "rata-credit", title: "Rata la credit", description: "Rata lunară, totalul de plată și dobânda pentru un credit, cu rate egale (anuități) sau descrescătoare.", needs: null, guide: "creditul-de-consum-ce-verifici-inainte-sa-semnezi" },
  { slug: "regula-90-180", title: "Regula 90/180 de zile în spațiul Schengen", description: "Câte zile ai stat și câte îți mai rămân din cele 90 permise în orice perioadă de 180 de zile, după datele călătoriilor.", needs: null },
  { slug: "portii-eveniment", title: "Câte porții pentru nuntă, cumătrie sau pomană", description: "Cantitățile de bucate reci, zeamă, sarmale, friptură, garnitură, dulciuri și pâine după numărul de invitați.", needs: null, guide: "cate-portii-calculezi-pentru-nunta-sau-pomana" },
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

// Rata la credit: anuități (rată egală) sau rate descrescătoare (principal egal),
// dobânda lunară = anuală / 12. Fără comisioane și asigurări (le arată DAE).
export type LoanType = "anuitate" | "descrescator";

export function loan(amount: number, ratePct: number, months: number, type: LoanType) {
  const n = Math.floor(months);
  if (amount <= 0 || n < 1) return null;
  const r = ratePct / 1200;
  const annuity = r ? (amount * r) / (1 - (1 + r) ** -n) : amount / n;
  let bal = amount;
  const pays: number[] = [];
  const years: { year: number; principal: number; interest: number; remaining: number }[] = [];
  for (let i = 0; i < n; i++) {
    const interest = bal * r;
    const principal = i === n - 1 ? bal : type === "anuitate" ? annuity - interest : amount / n;
    bal -= principal;
    pays.push(principal + interest);
    if (i % 12 === 0) years.push({ year: i / 12 + 1, principal: 0, interest: 0, remaining: 0 });
    const y = years[years.length - 1];
    y.principal += principal;
    y.interest += interest;
    y.remaining = Math.max(0, bal);
  }
  const total = pays.reduce((a, b) => a + b, 0);
  return {
    first: round(pays[0]),
    last: round(pays[n - 1]),
    total: round(total),
    interest: round(total - amount),
    years: years.map((y) => ({ year: y.year, principal: round(y.principal), interest: round(y.interest), remaining: round(y.remaining) })),
  };
}

// Regula 90/180 (Schengen): zilele de ședere în fereastra de 180 de zile care se
// încheie la data de control (data + cele 179 de zile dinainte). Ziua intrării și
// a ieșirii se numără; zilele din călătorii suprapuse se numără o singură dată.
// Datele: "AAAA-LL-ZZ"; rândurile goale sau inversate sunt ignorate.
export type Trip = { from: string; to: string };

const dayNo = (iso: string) => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? NaN : Math.round(t / 86400000);
};

export function schengenDays(trips: Trip[], controlDate: string) {
  const end = dayNo(controlDate);
  if (Number.isNaN(end)) return null;
  const start = end - 179;
  const days = new Set<number>();
  for (const t of trips) {
    const a = Math.max(dayNo(t.from), start);
    const b = Math.min(dayNo(t.to), end);
    for (let d = a; d <= b; d++) days.add(d); // NaN: bucla nu rulează
  }
  const used = days.size;
  return { used, remaining: Math.max(0, 90 - used), over: used > 90, windowStart: new Date(start * 86400000).toISOString().slice(0, 10) };
}

// Porții pentru o masă mare (nuntă, cumătrie, pomană): reperele practice din ghidul
// cate-portii-calculezi-pentru-nunta-sau-pomana (nu norme oficiale). Copiii mici:
// jumătate de porție; plus porțiile de rezervă.
export const PORTION_NORMS = [
  { id: "reci", min: 0.15, max: 0.2, unit: "kg" },
  { id: "salate", min: 0.15, max: 0.15, unit: "kg" },
  { id: "zeama", min: 0.3, max: 0.3, unit: "l" },
  { id: "sarmale", min: 5, max: 6, unit: "buc" },
  { id: "friptura", min: 0.15, max: 0.2, unit: "kg" },
  { id: "garnitura", min: 0.15, max: 0.15, unit: "kg" },
  { id: "dulciuri", min: 2, max: 3, unit: "buc" },
  { id: "paine", min: 0.08, max: 0.1, unit: "paini" }, // 2–3 felii; 8–10 pâini la 100 de oaspeți
  // băuturile (ghidul, 2026-10-14): vinul doar pentru adulți, sucul și apa pentru toți (copiii — porție întreagă)
  { id: "vin", min: 0.3, max: 0.5, unit: "l", base: "adulti" },
  { id: "suc", min: 0.5, max: 0.5, unit: "l", base: "toti" },
  { id: "apa", min: 0.5, max: 0.5, unit: "l", base: "toti" },
] as const;

export function eventPortions(adults: number, children: number, reserve: number) {
  const portions = Math.ceil(adults + children / 2 + reserve);
  const people = { adulti: adults + reserve, toti: adults + children + reserve };
  const amount = (n: number, x: number, unit: string) => (unit === "buc" || unit === "paini" ? Math.ceil(n * x - 1e-9) : Math.round(n * x * 10) / 10);
  return {
    portions,
    items: PORTION_NORMS.map((p) => {
      const n = "base" in p ? people[p.base] : portions;
      return { ...p, from: amount(n, p.min, p.unit), to: amount(n, p.max, p.unit) };
    }),
  };
}
