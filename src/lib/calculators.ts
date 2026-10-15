// Calculatoare: formulele sunt aici, valorile (procente, plafoane) în
// content/calculatoare/parametri.json — verificate pe legis.md / sfs.md /
// cnas.gov.md de o sesiune cloud și aprobate prin PR, cu sursa fiecăreia.
// Un calculator fără parametri nu apare (nu afișăm cifre neverificate).
// Fără importuri de server aici: formulele rulează și în browser
// (citirea fișierului e în calculators-data.ts).
import { addDays, holidayOn, isDayOff, type HolidayId } from "./orthodox";

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
  { slug: "factura-gaz", title: "Verifică factura la gaz", description: "Cât trebuie să plătești pentru gazul consumat, din metri cubi sau din indexul contorului, la prețul ANRE în vigoare, cu TVA.", needs: null, guide: "cum-citesti-factura-de-gaz-sau-de-energie-electrica" },
  { slug: "factura-curent", title: "Factura la curent și consumul aparatelor", description: "Cât plătești pentru kWh consumați la Premier Energy sau FEE Nord, la prețul ANRE, și cât consumă boilerul, caloriferul sau frigiderul.", needs: null, guide: "cum-economisesti-energie-electrica-acasa" },
  { slug: "cost-incalzire", title: "Costul încălzirii pe sezon", description: "Cât te costă iarna cu gaz, termoficare, curent, lemne sau peleți, după suprafața și izolația locuinței.", needs: null, guide: "cum-reduci-factura-la-incalzire-sfaturi-practice" },
  { slug: "calorii", title: "Câte calorii îți trebuie pe zi", description: "Necesarul zilnic de calorii după vârstă, greutate, înălțime și activitate: pentru menținere, slăbit sau pus în greutate.", needs: null, recipes: true },
  { slug: "putere-calorifere", title: "Câte calorifere și ce centrală îți trebuie", description: "Puterea de încălzire necesară pentru o cameră sau o locuință, câte elemente de calorifer și ce putere de centrală să alegi, după suprafață, tavan și izolație.", needs: null, guide: "cum-reduci-factura-la-incalzire-sfaturi-practice" },
  { slug: "lemne-peleti", title: "Câte lemne sau peleți îți trebuie pentru iarnă", description: "Câți metri steri de lemne sau câte tone de peleți îți trebuie pe un sezon de încălzire și cât costă, după suprafața și izolația casei.", needs: null, guide: "pregatirea-gospodariei-de-iarna-beci-conserve-pomi" },
  { slug: "dobanda-depozit", title: "Dobânda la depozit", description: "Cât câștigi dintr-un depozit bancar: dobânda brută, impozitul de 6% reținut de bancă, suma netă și creșterea lună de lună, cu sau fără capitalizare.", needs: null, guide: "depozitul-bancar-ce-garanteaza-statul-fgdsb" },
  { slug: "ore-suplimentare", title: "Plata orelor suplimentare, de noapte și de sărbători", description: "Cât trebuie să primești, brut, pentru orele suplimentare, munca de noapte și munca în zilele de odihnă sau de sărbătoare, după Codul muncii.", needs: null, guide: "plangere-la-inspectoratul-de-stat-al-muncii-cand-si-cum" },
  { slug: "zile-lucratoare", title: "Câte zile lucrătoare are luna", description: "Zilele și orele lucrătoare dintr-o lună sau dintr-o perioadă, fără weekenduri și sărbători legale, plus calculul unui termen în zile lucrătoare.", needs: null, guide: "sarbatorile-legale-in-moldova-in-2027-zile-libere" },
  { slug: "cost-calatorie", title: "Costul unei călătorii cu mașina", description: "Cât te costă drumul cu mașina: litrii de benzină, motorină sau GPL, prețul maxim ANRE și suma pe fiecare pasager.", needs: null, guide: "economia-la-benzina-si-motorina-pret-si-consum" },
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

// Gaz, curent, căldură: prețurile reglementate ANRE pentru casnici, verificate la
// `verificat` în Monitorul Oficial (hotărârile, cu anexele). ANRE le publică fără
// TVA. Pe factura casnicilor: gazul + TVA 8% (Codul fiscal, art. 96 lit. b);
// curentul și căldura pentru locuințe sunt scutite de TVA (art. 104 lit. b), deci
// factura = prețul ANRE. La o nouă hotărâre ANRE se schimbă doar valorile de aici.
export const ENERGY = {
  verificat: "2026-10-15",
  gaz: { lei_m3: 24.202, tva_pct: 8, de_la: "2026-10-01" }, // ANRE nr. 578/2026: 24 202 lei/1000 m³, joasă presiune
  // ANRE nr. 222 și 224 din 31.03.2026 (MO 02.04.2026), serviciul universal, joasă tensiune
  curent: {
    premier: { lei_kwh: 3.56, zi: 3.75, noapte: 2.94 },
    "fee-nord": { lei_kwh: 3.95, zi: 4.11, noapte: 3.43 },
  },
  // ANRE nr. 579–585 din 28.09.2026, în vigoare din 01.10.2026
  caldura: [
    { id: "termoelectrica", lei_gcal: 3277 },
    { id: "cet-nord", lei_gcal: 3374 },
    { id: "apa-canal", lei_gcal: 2957 },
    { id: "comrat", lei_gcal: 4393 },
    { id: "antermo", lei_gcal: 3544 },
    { id: "comgaz", lei_gcal: 3835 },
    { id: "glodeni", lei_gcal: 4322 },
  ],
} as const;

export type PowerSupplier = keyof typeof ENERGY.curent;
export type HeatSupplier = (typeof ENERGY.caldura)[number]["id"];

const MO_SEP = "https://monitorul.gov.md/ro/monitor/3352";
const CODUL_FISCAL = { name: "Codul fiscal, art. 96 lit. b) și art. 104 lit. b) — TVA (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=155071&lang=ro" };
export const ENERGY_SOURCES: Record<"gaz" | "curent" | "caldura", Source[]> = {
  gaz: [
    { name: "Hotărârea ANRE nr. 578 din 28.09.2026 (Monitorul Oficial nr. 486-489 din 29.09.2026)", url: MO_SEP },
    { name: "ANRE — tarife în vigoare: gaze naturale", url: "https://anre.md/gaze-naturale-3-205" },
    { name: "Energocom — cota TVA la gazele naturale", url: "https://energocom.md/gaze-naturale-intrebari-frecvente/" },
    CODUL_FISCAL,
  ],
  curent: [
    { name: "Hotărârile ANRE nr. 222 și 224 din 31.03.2026 (Monitorul Oficial nr. 146-147 din 02.04.2026)", url: "https://monitorul.gov.md/ro/monitor/3253" },
    { name: "ANRE — tarife în vigoare: energie electrică", url: "https://anre.md/energie-electrica-3-290" },
    CODUL_FISCAL,
  ],
  caldura: [
    { name: "Hotărârile ANRE nr. 578–585 din 28.09.2026 (Monitorul Oficial nr. 486-489 din 29.09.2026)", url: MO_SEP },
    { name: "ANRE — tarife în vigoare: energie termică", url: "https://anre.md/energie-termica-3-247" },
    { name: "Hotărârile ANRE nr. 222 și 224 din 31.03.2026 — energie electrică", url: "https://monitorul.gov.md/ro/monitor/3253" },
    CODUL_FISCAL,
  ],
};

// Factura la gaz: m³ × prețul ANRE, plus TVA.
export function gasBill(m3: number) {
  const net = round(m3 * ENERGY.gaz.lei_m3);
  const vat = round((net * ENERGY.gaz.tva_pct) / 100);
  return { m3, net, vat, total: round(net + vat) };
}

// Factura la curent: preț unic, sau zi (07–23) / noapte (23–07) cu contor pe ore. Fără TVA (scutit).
export function powerBill(s: PowerSupplier, dayKwh: number, nightKwh: number | null) {
  const p = ENERGY.curent[s];
  if (nightKwh === null) return { kwh: dayKwh, total: round(dayKwh * p.lei_kwh) };
  return { kwh: dayKwh + nightKwh, total: round(dayKwh * p.zi + nightKwh * p.noapte) };
}

// Un aparat: putere (W) × ore pe zi × zile.
export function applianceUse(watts: number, hours: number, days: number, leiKwh: number) {
  const kwh = round((watts * hours * days) / 1000);
  return { kwh, lei: round(kwh * leiKwh) };
}

// Încălzirea pe sezon. Necesarul de căldură: kWh/m² pe un sezon întreg (6 luni,
// 15 octombrie – 15 aprilie), ipoteze ale redacției pentru clădiri tipice din
// Moldova — utilizatorul le poate schimba. Randamentele și puterea calorifică
// sunt valori tipice, nu oficiale. 1 Gcal = 1163 kWh (definiție).
export type Dwelling = "apartament" | "casa";
export type Insulation = "slaba" | "medie" | "buna";
export const HEAT_NEED_KWH_M2: Record<Dwelling, Record<Insulation, number>> = {
  apartament: { slaba: 180, medie: 120, buna: 70 },
  casa: { slaba: 250, medie: 160, buna: 90 },
};
export const HEAT_TYPICAL = {
  luni_sezon: 6,
  kwh_gcal: 1163,
  gaz_kwh_m3: 9.3, // puterea calorifică inferioară, ~8 000 kcal/m³
  centrala_gaz: 0.9,
  lemn_kwh_m3: 1600, // 1 m³ (ster) de lemn de esență tare, uscat
  soba_lemne: 0.65,
  pelet_kwh_kg: 4.8,
  centrala_pelet: 0.85,
} as const;

export function heatingCost(o: {
  area: number;
  needKwhM2: number;
  months: number;
  heat: HeatSupplier;
  power: PowerSupplier;
  woodLeiM3: number; // NaN / 0 = fără preț
  pelletLeiT: number;
}) {
  const h = HEAT_TYPICAL;
  const need = round((o.area * o.needKwhM2 * o.months) / h.luni_sezon);
  const gasM3 = need / (h.gaz_kwh_m3 * h.centrala_gaz);
  const gcal = need / h.kwh_gcal;
  const woodM3 = need / (h.lemn_kwh_m3 * h.soba_lemne);
  const pelletT = need / (h.pelet_kwh_kg * h.centrala_pelet) / 1000;
  const heatTariff = ENERGY.caldura.find((x) => x.id === o.heat)!.lei_gcal;
  const price = (n: number) => (n > 0 ? n : null);
  const wood = price(o.woodLeiM3);
  const pellet = price(o.pelletLeiT);
  return {
    need,
    options: [
      { id: "gaz", qty: round(gasM3), unit: "m3", lei: gasBill(gasM3).total },
      { id: "termoficare", qty: round(gcal), unit: "gcal", lei: round(gcal * heatTariff) },
      { id: "curent", qty: need, unit: "kwh", lei: round(need * ENERGY.curent[o.power].lei_kwh) },
      { id: "lemne", qty: round(woodM3), unit: "m3", lei: wood && round(woodM3 * wood) },
      { id: "peleti", qty: round(pelletT), unit: "t", lei: pellet && round(pelletT * pellet) },
    ],
  };
}

// Necesarul de calorii: Mifflin-St Jeor (rata metabolică de bază) × factorul de
// activitate. Slăbit: −500 kcal, dar nu sub 1200 (femei) / 1500 (bărbați); îngrășat: +500.
export type Sex = "f" | "m";
export const ACTIVITY = [
  { id: "sedentar", factor: 1.2 },
  { id: "usor", factor: 1.375 },
  { id: "moderat", factor: 1.55 },
  { id: "activ", factor: 1.725 },
  { id: "foarte", factor: 1.9 },
] as const;
export type Activity = (typeof ACTIVITY)[number]["id"];

export function calories(sex: Sex, age: number, kg: number, cm: number, activity: Activity) {
  if (!(age > 0 && kg > 0 && cm > 0)) return null;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === "m" ? 5 : -161);
  const maintain = Math.round(bmr * ACTIVITY.find((a) => a.id === activity)!.factor);
  const floor = sex === "m" ? 1500 : 1200;
  return { bmr: Math.round(bmr), maintain, lose: Math.min(maintain, Math.max(floor, maintain - 500)), gain: maintain + 500, floor };
}


// Puterea de încălzire: metoda practică W/m² (la tavan de 2,7 m), corectată după
// înălțimea tavanului, camera de colț și ferestrele mari. Valori tipice ale
// redacției, nu o normă: calculul exact (SM EN 12831) îl face un proiectant.
export const RADIATOR_W_M2: Record<Dwelling, Record<Insulation, number>> = {
  apartament: { slaba: 120, medie: 100, buna: 70 },
  casa: { slaba: 150, medie: 120, buna: 80 },
};
export const RADIATOR_TYPICAL = {
  tavan_m: 2.7,
  colt: 1.15, // cameră de colț: +15%
  geamuri: 1.1, // ferestre mari sau vechi: +10%
  element_w: 160, // un element de aluminiu/bimetal la ΔT 50 °C
  rezerva_centrala: 1.2, // centrala: +20% peste necesarul locuinței
} as const;

export function radiatorPower(o: { area: number; ceiling: number; dwelling: Dwelling; insulation: Insulation; corner: boolean; bigWindows: boolean; elementW: number }) {
  const t = RADIATOR_TYPICAL;
  const w = o.area * RADIATOR_W_M2[o.dwelling][o.insulation] * (o.ceiling / t.tavan_m) * (o.corner ? t.colt : 1) * (o.bigWindows ? t.geamuri : 1);
  const watts = Math.round(w);
  return {
    watts,
    elements: o.elementW > 0 ? Math.ceil(watts / o.elementW - 1e-9) : null,
    boilerKw: Math.round((watts * t.rezerva_centrala) / 100) / 10,
  };
}

// Lemne și peleți pe sezon: același necesar de căldură și aceleași randamente ca la
// costul încălzirii (HEAT_NEED_KWH_M2, HEAT_TYPICAL). Prețurile — doar ale utilizatorului.
export const PELLET_BAG_KG = 15; // sacul obișnuit de peleți

export function firewood(o: { area: number; needKwhM2: number; months: number; woodLeiM3: number; pelletLeiT: number }) {
  const r = heatingCost({ ...o, heat: "termoelectrica", power: "premier" });
  const wood = r.options.find((x) => x.id === "lemne")!;
  const pellet = r.options.find((x) => x.id === "peleti")!;
  return { need: r.need, woodM3: wood.qty, woodLei: wood.lei, pelletT: pellet.qty, pelletBags: Math.ceil((pellet.qty * 1000) / PELLET_BAG_KG - 1e-9), pelletLei: pellet.lei };
}

// Dobânda la depozit. Impozitul: 6% din dobânzile plătite persoanelor fizice
// rezidente, reținut final de bancă (Codul fiscal, art. 90¹ alin. (3⁷), legis.md,
// 15.10.2026). FGDSB garantează 200 000 lei de deponent la fiecare bancă (fgdsb.md).
export const DEPOSIT = { impozit_pct: 6, plafon_fgdsb_lei: 200000, verificat: "2026-10-15" } as const;
export type Capitalization = "lunar" | "scadenta";

export function deposit(amount: number, ratePct: number, months: number, cap: Capitalization, taxed: boolean) {
  const n = Math.floor(months);
  if (!(amount > 0) || n < 1 || n > 600) return null;
  const r = ratePct / 1200;
  const tax = taxed ? DEPOSIT.impozit_pct / 100 : 0;
  let bal = amount;
  let gross = 0;
  const rows: { month: number; interest: number; tax: number; balance: number }[] = [];
  for (let m = 1; m <= n; m++) {
    // lunar: dobânda netă se adaugă la depozit; la scadență: dobândă simplă, plătită la final
    const i = (cap === "lunar" ? bal : amount) * r;
    gross += i;
    if (cap === "lunar") bal += i * (1 - tax);
    rows.push({ month: m, interest: round(i), tax: round(i * tax), balance: round(cap === "lunar" ? bal : amount + gross * (1 - tax)) });
  }
  const taxTotal = round(gross * tax);
  return {
    gross: round(gross),
    tax: taxTotal,
    net: round(gross - taxTotal),
    final: round(amount + gross - taxTotal),
    effectivePct: round(cap === "lunar" ? ((1 + r) ** 12 - 1) * 100 : ratePct), // rata anuală efectivă, înainte de impozit
    overGuarantee: amount + gross - taxTotal > DEPOSIT.plafon_fgdsb_lei,
    rows,
  };
}

// Orele suplimentare, de noapte, de odihnă și de sărbătoare (Codul muncii, verificat pe
// legis.md la 15.10.2026): art. 157 — primele 2 ore suplimentare (pe zi) cel puțin ×1,5,
// următoarele cel puțin ×2; art. 159 — noaptea (22:00–6:00, art. 103) adaos de cel puțin
// 0,5; art. 158 — zi de repaus/sărbătoare: cel puțin încă un salariu pe oră în limita
// normei lunare, dublu peste normă. Minimele legale; contractul poate da mai mult.
export const LABOUR = { primele_ore: 2, supl_primele: 1.5, supl_urmatoarele: 2, noapte_adaos: 0.5, sarbatoare_in_norma: 1, sarbatoare_peste_norma: 2 } as const;

export function overtimePay(o: { hourly: number; overtimeHours: number; overtimeDays: number; nightHours: number; holidayHours: number; holidayInNorm: boolean }) {
  const L = LABOUR;
  const first = Math.min(o.overtimeHours, L.primele_ore * Math.max(1, Math.floor(o.overtimeDays)));
  const overtime = round(o.hourly * (first * L.supl_primele + (o.overtimeHours - first) * L.supl_urmatoarele));
  const night = round(o.hourly * o.nightHours * L.noapte_adaos);
  const holiday = round(o.hourly * o.holidayHours * (o.holidayInNorm ? L.sarbatoare_in_norma : L.sarbatoare_peste_norma));
  return { first, rest: o.overtimeHours - first, overtime, night, holiday, total: round(overtime + night + holiday) };
}

// Zilele lucrătoare: săptămâna de 5 zile, 8 ore pe zi (art. 95, 100 CM); în ajunul unei
// sărbători nelucrătoare ziua se scurtează cu cel puțin o oră (art. 102); sărbătorile din
// art. 111 (orthodox.ts). Transferurile zilelor de odihnă prin hotărâre de Guvern
// (art. 111 alin. (5); obligatorii pentru sectorul public, recomandare pentru firmele private):
// la 15.10.2026, pe legis.md nu există nicio hotărâre pentru 2024–2027; ultimele sunt din 2023.
export const DAY_TRANSFERS: { date: string; off: boolean; act: string }[] = [
  { date: "2023-01-02", off: true, act: "HG nr. 963/2022" },
  { date: "2023-01-28", off: false, act: "HG nr. 963/2022" },
  { date: "2023-05-08", off: true, act: "HG nr. 963/2022" },
  { date: "2023-05-13", off: false, act: "HG nr. 963/2022" },
  { date: "2023-06-02", off: true, act: "HG nr. 289/2023" }, // recuperată prin prelungirea zilei de muncă
];
export const WORKDAY_HOURS = 8;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const parseDay = (s: string) => {
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isNaN(t) ? null : new Date(t);
};

export function isWorkDay(d: Date) {
  const t = DAY_TRANSFERS.find((x) => x.date === isoDay(d));
  return t ? !t.off : !isDayOff(d);
}

export function workingDays(from: string, to: string) {
  const a = parseDay(from);
  const b = parseDay(to);
  if (!a || !b || b < a) return null;
  let calendar = 0;
  let work = 0;
  let short = 0;
  const holidays: { date: string; id: HolidayId }[] = [];
  const transfers: typeof DAY_TRANSFERS = [];
  // ponytail: maximum ~10 ani pe interval, cât să nu blocheze browserul
  for (let d = a; d <= b && calendar < 3700; d = addDays(d, 1)) {
    calendar++;
    const h = holidayOn(d);
    const wd = d.getUTCDay();
    if (h && wd !== 0 && wd !== 6) holidays.push({ date: isoDay(d), id: h.id });
    const t = DAY_TRANSFERS.find((x) => x.date === isoDay(d));
    if (t) transfers.push(t);
    if (!isWorkDay(d)) continue;
    work++;
    if (holidayOn(addDays(d, 1))) short++;
  }
  return { calendar, work, short, hours: work * WORKDAY_HOURS - short, holidays, transfers };
}

// Termenul: a N-a zi lucrătoare după data de pornire (ziua de pornire nu se numără).
export function addWorkingDays(start: string, n: number) {
  let d = parseDay(start);
  if (!d || n < 0 || n > 3000) return null;
  for (let k = 0; k < Math.floor(n); ) {
    d = addDays(d, 1);
    if (isWorkDay(d)) k++;
  }
  return isoDay(d);
}

// Costul drumului cu mașina. Prețurile maxime ANRE pentru benzina 95 și motorina
// standard (anre.md, stabilite la 15.10.2026, aplicabile pe 16.10.2026) — se schimbă
// aproape zilnic, utilizatorul le poate modifica. GPL-ul nu are preț maxim ANRE.
export const FUEL = { stabilit: "2026-10-15", de_la: "2026-10-16", benzina: 33.73, motorina: 35.2 } as const;
export type Fuel = "benzina" | "motorina" | "gpl";

export function tripCost(o: { km: number; roundTrip: boolean; lPer100: number; price: number; passengers: number; extra: number }) {
  const km = o.km * (o.roundTrip ? 2 : 1);
  const liters = (km * o.lPer100) / 100;
  const fuel = o.price > 0 ? round(liters * o.price) : null;
  const total = fuel === null ? null : round(fuel + (o.extra || 0));
  const people = Math.max(1, Math.floor(o.passengers));
  return { km, liters: round(liters), fuel, total, perPerson: total === null ? null : round(total / people), people };
}
