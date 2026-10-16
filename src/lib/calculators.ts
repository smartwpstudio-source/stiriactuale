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
  { slug: "imc", title: "IMC și greutatea ideală", description: "Indicele de masă corporală din greutate și înălțime, categoria după clasificarea OMS și intervalul de greutate sănătoasă pentru înălțimea ta.", needs: null, recipes: true, see: ["calorii"] },
  { slug: "sarcina", title: "Săptămâna de sarcină și data probabilă a nașterii", description: "Data probabilă a nașterii din prima zi a ultimei menstruații sau din data concepției: săptămâna de sarcină, trimestrul și câte zile au rămas.", needs: null, guide: "concediul-de-maternitate-si-paternal-durata-plata-acte", see: ["concediu-maternitate", "indemnizatie-nastere"] },
  { slug: "indemnizatie-nastere", title: "Indemnizația unică la nașterea copilului", description: "Cât primește mama de la stat pentru fiecare copil născut viu, după anul nașterii: gemenii — pentru fiecare copil, fără cerere.", needs: null, guide: "indemnizatia-unica-la-nasterea-copilului-suma-acte-termen", see: ["indemnizatie-crestere-copil", "concediu-maternitate"] },
  { slug: "masuri-culinare", title: "Măsuri culinare: pahar, lingură → grame", description: "Câte grame de făină, zahăr, orez, unt sau miere încap într-un pahar, o cană, o lingură sau o linguriță — și invers, din grame în linguri și pahare.", needs: null, recipes: true },
  { slug: "varsta-pensionare", title: "Vârsta de pensionare și stagiul", description: "La ce vârstă și de la ce dată poți ieși la pensie, după data nașterii și calendarul din Legea pensiilor, plus stagiul de cotizare minim și complet și cât îți mai lipsește.", needs: null, guide: "varsta-de-pensionare-in-moldova-calendar-femei-barbati" },
  { slug: "amenzi-rutiere", title: "Amenzi rutiere", description: "Amenda în lei pentru cele mai dese încălcări — viteza, centura, telefonul, alcoolul, semaforul, parcarea, lipsa RCA sau a permisului —, cât plătești în 3 zile lucrătoare, punctele de penalizare și suspendarea permisului.", needs: null, guide: "reguli-de-circulatie-incalcate-des-si-amenzile", see: ["rca-carte-verde", "taxa-drum", "vamuire-auto"] },
  { slug: "tva", title: "Calculator TVA", description: "Adaugi TVA la un preț sau scoți TVA dintr-o sumă, la cota standard de 20% sau la cota redusă de 8%, după Codul fiscal.", needs: null, guide: "impozitele-firmei-mici-regimul-imm-4-la-suta-tva-dividende", see: ["penalitati-intarziere"] },
  { slug: "penalitati-intarziere", title: "Penalități de întârziere", description: "Cât datorezi pentru o plată întârziată: dobânda de întârziere din Codul civil, penalitatea din contract sau majorarea de întârziere la impozite, după zilele de întârziere.", needs: null, guide: "cum-eviti-datoriile-microcredite-dae-restante", see: ["rata-credit", "tva"] },
  { slug: "materiale-renovare", title: "Materiale pentru renovare", description: "Câtă vopsea, câte plăci de gresie sau faianță, câte role de tapet și câte pachete de parchet sau laminat îți trebuie, cu rezervă, după dimensiunile camerei.", needs: null, guide: "casa-si-blocul-intretinere-siguranta-drepturi", see: ["putere-calorifere"] },
  { slug: "rca-carte-verde", title: "RCA și Carte Verde, estimativ", description: "Prima de referință a Băncii Naționale pentru RCA internă, după vehicul, localitate și șofer, și pentru Cartea Verde, după zonă, vehicul și durată.", needs: null, guide: "rca-si-cartea-verde-ce-acopera-si-cum-le-cumperi", see: ["amenzi-rutiere", "taxa-drum", "regula-90-180"] },
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

// IMC = kg / m², rotunjit la o zecimală, categoria după clasificarea OMS pentru adulți
// (OMS Europa, „Nutrition for a healthy life”, verificat la 15.10.2026): sub 18,5 subponderal,
// 18,5–24,9 normal, 25–29,9 preobezitate, 30–34,9 / 35–39,9 / 40+ obezitate de gradul I / II / III.
// Sub 18 ani IMC se compară cu curbele de creștere pe vârstă și sex — fără categorie.
export const BMI_CLASSES = [
  { id: "sub", below: 18.5 },
  { id: "normal", below: 25 },
  { id: "supra", below: 30 },
  { id: "ob1", below: 35 },
  { id: "ob2", below: 40 },
  { id: "ob3", below: Infinity },
] as const;
export type BmiClass = (typeof BMI_CLASSES)[number]["id"];
export const BMI_HEALTHY = { min: 18.5, max: 24.9, adult_age: 18 } as const;

export function bmi(kg: number, cm: number, age = 0) {
  if (!(kg > 0 && cm >= 50 && cm <= 250)) return null;
  const m2 = (cm / 100) ** 2;
  const value = Math.round((kg / m2) * 10) / 10;
  const minor = age > 0 && age < BMI_HEALTHY.adult_age;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    value,
    category: minor ? null : BMI_CLASSES.find((c) => value < c.below)!.id,
    minor,
    minKg: r1(BMI_HEALTHY.min * m2),
    maxKg: r1(BMI_HEALTHY.max * m2),
  };
}

// Sarcina: regula lui Naegele — data probabilă = prima zi a ultimei menstruații + 280 de zile
// (40 de săptămâni), la un ciclu de 28 de zile; la alt ciclu se mută cu (ciclu − 28) zile. Din
// data concepției: + 266 de zile (concepția ≈ ziua 14). Trimestrele după convenția obișnuită:
// I până la 13 săptămâni și 6 zile, II până la 27 + 6, III de la 28 de săptămâni.
export type PregnancyFrom = "menstruatie" | "conceptie";
export const PREGNANCY = { zile: 280, conceptie: 14, ciclu: 28, ciclu_min: 21, ciclu_max: 45, trimestrul2: 98, trimestrul3: 196 } as const;

export function pregnancy(from: PregnancyFrom, date: string, cycle: number, today: string) {
  const d = dayNo(date);
  const now = dayNo(today);
  if (Number.isNaN(d) || Number.isNaN(now) || d > now) return null;
  if (from === "menstruatie" && !(cycle >= PREGNANCY.ciclu_min && cycle <= PREGNANCY.ciclu_max)) return null;
  const P = PREGNANCY;
  // „ziua 0” a sarcinii: ultima menstruație corectată după ciclu, sau concepția − 14 zile
  const start = from === "menstruatie" ? d + Math.round(cycle) - P.ciclu : d - P.conceptie;
  const days = now - start;
  if (days > 44 * 7) return null; // peste 44 de săptămâni: data e, cel mai probabil, greșită
  const iso = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
  return {
    due: iso(start + P.zile),
    weeks: Math.floor(days / 7),
    days: days % 7,
    trimester: days < P.trimestrul2 ? 1 : days < P.trimestrul3 ? 2 : 3,
    left: start + P.zile - now,
    milestones: {
      trimestrul1: iso(start + P.trimestrul2 - 1),
      trimestrul2: iso(start + P.trimestrul3 - 1),
      termen: iso(start + 37 * 7),
      depasire: iso(start + 42 * 7),
    },
  };
}

// Indemnizația unică la nașterea copilului (Legea nr. 315/2016, art. 5: coșul minim pentru
// nașterea unui copil, aprobat anual de Guvern în anexa nr. 1 la HG nr. 1478/2002), pentru
// fiecare copil născut viu, după anul nașterii. 2026: 21 886 lei (CNAS, verificat la 15.10.2026;
// HG aprobată de Guvern la 17.12.2025); 2025: 21 350 lei (nota de fundamentare a aceleiași HG).
// 2027: neaprobat la 15.10.2026 — se adaugă când Guvernul aprobă suma.
export const BIRTH_ALLOWANCE: { verificat: string; lei: Record<number, number> } = { verificat: "2026-10-15", lei: { 2025: 21350, 2026: 21886 } };

export function birthAllowance(year: number, children: number) {
  const perChild = BIRTH_ALLOWANCE.lei[year];
  const n = Math.floor(children);
  if (!perChild || n < 1) return null;
  return { perChild, children: n, total: perChild * n };
}

// Măsuri de bucătărie: volume obișnuite și densități tipice (g/ml) pentru ingrediente
// turnate fără îndesare, cu lingura rasă. Valori tipice de bucătărie, nu o normă:
// greutatea reală depinde de cât de afânat e ingredientul.
export const KITCHEN_UNITS = [
  { id: "pahar200", ml: 200 },
  { id: "pahar250", ml: 250 },
  { id: "cana", ml: 240 }, // cana din rețetele americane (cup), rotunjită
  { id: "lingura", ml: 15 },
  { id: "lingurita", ml: 5 },
  { id: "ml", ml: 1 },
] as const;
export type KitchenUnit = (typeof KITCHEN_UNITS)[number]["id"];
export const KITCHEN_G_ML = {
  faina: 0.65,
  zahar: 0.8,
  "zahar-pudra": 0.6,
  orez: 0.9,
  gris: 0.8,
  malai: 0.65,
  hrisca: 0.84,
  "fulgi-ovaz": 0.36,
  sare: 1.3,
  cacao: 0.45,
  "nuci-macinate": 0.5,
  unt: 0.91, // topit
  ulei: 0.92,
  lapte: 1.03,
  apa: 1,
  smantana: 1,
  miere: 1.4,
} as const;
export type KitchenIngredient = keyof typeof KITCHEN_G_ML;

// cantitatea într-o unitate (sau în grame) -> grame + aceeași cantitate în fiecare unitate de volum
export function kitchenMeasure(ingredient: KitchenIngredient, qty: number, unit: KitchenUnit | "g") {
  if (!(qty > 0)) return null;
  const density = KITCHEN_G_ML[ingredient];
  const ml = unit === "g" ? qty / density : qty * KITCHEN_UNITS.find((u) => u.id === unit)!.ml;
  return { grams: round(ml * density), ml: round(ml), units: KITCHEN_UNITS.map((u) => ({ id: u.id, qty: round(ml / u.ml) })) };
}

// ---------------------------------------------------------------- lotul 4

const isoOf = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);

// data + n luni; ziua care nu există în luna nouă (31 -> februarie) trece pe ultima zi a lunii
function addMonthsIso(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  const ny = Math.floor(t / 12);
  const nm = t % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ny, nm, Math.min(d, last))).toISOString().slice(0, 10);
}

// Vârsta de pensionare: Legea nr. 156/1998 privind sistemul public de pensii, versiunea în vigoare
// din 02.10.2026 (legis.md, citită la 16.10.2026; modificarea din 28.10.2026 nu atinge aceste
// articole). Art. 41 alin. (1), tabelul nr. 2: vârsta standard, de la 1 iulie al fiecărui an (în
// luni); alin. (2): femeile care au născut și educat 5 sau mai mulți copii până la 8 ani — minus
// 3 ani. Art. 15 alin. (1): stagiul minim 15 ani. Art. 42 alin. (1), tabelul nr. 5: stagiul
// complet (34 de ani pentru toți din 1 iulie 2024). Art. 15² alin. (1): pensia anticipată pentru
// carieră lungă cere un stagiu contributiv cu 5 ani (bărbați) / 3 ani (femei) peste cel complet.
// Te poți pensiona din ziua în care vârsta ta atinge vârsta standard în vigoare în ziua aceea.
export const PENSION = {
  verificat: "2026-10-16",
  varste: [
    [2017, 748, 690],
    [2018, 752, 696],
    [2019, 756, 702],
    [2020, 756, 708],
    [2021, 756, 714],
    [2022, 756, 720],
    [2023, 756, 726],
    [2024, 756, 732],
    [2025, 756, 738],
    [2026, 756, 744],
    [2027, 756, 750],
    [2028, 756, 756],
  ],
  stagiu_complet: [
    [2017, 402, 366],
    [2018, 408, 372],
    [2019, 408, 378],
    [2020, 408, 384],
    [2021, 408, 390],
    [2022, 408, 396],
    [2023, 408, 402],
    [2024, 408, 408],
  ],
  reducere_5_copii_luni: 36,
  stagiu_minim_ani: 15,
  cariera_lunga_ani: { m: 5, f: 3 },
} as const;

const fromJuly = (rows: readonly (readonly number[])[], iso: string) => [...rows].reverse().find((r) => iso >= `${r[0]}-07-01`) ?? rows[0];

export function retirement(birth: string, sex: Sex, fiveChildren: boolean, stagiuAni: number) {
  if (!/^\d{4}-\d\d-\d\d$/.test(birth) || Number.isNaN(dayNo(birth))) return null;
  const P = PENSION;
  const col = sex === "m" ? 1 : 2;
  const red = sex === "f" && fiveChildren ? P.reducere_5_copii_luni : 0;
  for (let i = 0; i < P.varste.length; i++) {
    const months = P.varste[i][col] - red;
    const start = `${P.varste[i][0]}-07-01`;
    const end = i + 1 < P.varste.length ? `${P.varste[i + 1][0]}-07-01` : "9999-12-31";
    const reached = addMonthsIso(birth, months);
    // vârsta atinsă înainte de calendarul din tabel (1 iulie 2017): nu calculăm după regulile vechi
    if (i === 0 && reached < start) return { before2017: true as const };
    const date = reached > start ? reached : start;
    if (date < end) {
      const complet = fromJuly(P.stagiu_complet, date)[col] / 12;
      const s = stagiuAni > 0 ? stagiuAni : null;
      return {
        before2017: false as const,
        date,
        years: Math.floor(months / 12),
        months: months % 12,
        minimum: P.stagiu_minim_ani,
        complete: complet,
        longCareer: complet + P.cariera_lunga_ani[sex],
        missingMin: s === null ? null : Math.max(0, round(P.stagiu_minim_ani - s)),
        missingComplete: s === null ? null : Math.max(0, round(complet - s)),
      };
    }
  }
  return null;
}

// Amenzile rutiere: Codul contravențional nr. 218/2008, versiunea în vigoare din 13.09.2026
// (legis.md, citită la 16.10.2026; versiunea din 09.12.2026 nu schimbă art. 228–245). Art. 34
// alin. (1): 1 unitate convențională = 50 de lei; alin. (3): jumătate din amendă, dacă o plătești
// în cel mult 3 zile lucrătoare de la aducerea la cunoștință a deciziei; alin. (2⁴): în 30 de zile.
// Art. 36: la 15 puncte — suspendarea dreptului de a conduce (30 de zile prima dată); punctele se
// anulează după 6 luni. Textele faptelor și sancțiunile complementare: i18n.ts (fines.items).
export const UC_LEI = 50;
export const FINES_VERIFIED = "2026-10-16";
export type TrafficFine = { id: string; art: string; min: number; max: number; warning?: boolean; points?: number; extra?: boolean };
export const TRAFFIC_FINES: TrafficFine[] = [
  { id: "viteza-10", art: "art. 236 alin. (1)", min: 12, max: 18, points: 3 },
  { id: "viteza-20", art: "art. 236 alin. (2)", min: 18, max: 24, points: 4 },
  { id: "viteza-40", art: "art. 236 alin. (3)", min: 30, max: 36, points: 5 },
  { id: "viteza-60", art: "art. 236 alin. (4)", min: 45, max: 50, extra: true },
  { id: "viteza-80", art: "art. 236 alin. (5)", min: 75, max: 100, extra: true },
  { id: "centura", art: "art. 235 alin. (1)", min: 9, max: 12, points: 3 },
  { id: "telefon", art: "art. 235 alin. (2)", min: 9, max: 12, points: 3 },
  { id: "copii", art: "art. 235¹", min: 12, max: 24, points: 2 },
  { id: "alcool", art: "art. 233 alin. (1)", min: 700, max: 1000, extra: true },
  { id: "semafor", art: "art. 240 alin. (2)", min: 15, max: 18, points: 3 },
  { id: "pietoni", art: "art. 238 alin. (3)", min: 30, max: 36, points: 5 },
  { id: "pietoni-repetat", art: "art. 238 alin. (3¹)", min: 45, max: 50, extra: true },
  { id: "indicatoare", art: "art. 240 alin. (1)", min: 10, max: 12, warning: true, points: 2 },
  { id: "depasire", art: "art. 240 alin. (1¹)", min: 12, max: 15 },
  { id: "oprire", art: "art. 238 alin. (1)", min: 3, max: 6, warning: true },
  { id: "parcare", art: "art. 238 alin. (2)", min: 18, max: 30 },
  { id: "rca", art: "art. 229 alin. (3)", min: 30, max: 60, points: 3 },
  { id: "fara-permis", art: "art. 231 alin. (2)", min: 30, max: 60 },
  { id: "categorie", art: "art. 231 alin. (1)", min: 18, max: 30 },
  { id: "inspectie", art: "art. 229 alin. (2¹)", min: 9, max: 12 },
  { id: "lumini-zi", art: "art. 230 alin. (4¹)", min: 6, max: 9, warning: true },
  { id: "geamuri", art: "art. 228 alin. (7)", min: 12, max: 24, points: 3 },
  { id: "girofar", art: "art. 241 alin. (2)", min: 15, max: 18, points: 4 },
  { id: "oprire-politie", art: "art. 241 alin. (1)", min: 350, max: 500, extra: true },
  { id: "agresiv", art: "art. 241¹ alin. (1)", min: 30, max: 40, points: 5, extra: true },
  { id: "accident-parasit", art: "art. 243 alin. (1)", min: 40, max: 50, extra: true },
  { id: "pieton", art: "art. 245 alin. (1)", min: 6, max: 9, warning: true },
];

export function fineLei(f: TrafficFine) {
  return { min: f.min * UC_LEI, max: f.max * UC_LEI, halfMin: (f.min * UC_LEI) / 2, halfMax: (f.max * UC_LEI) / 2 };
}

// TVA: Codul fiscal, art. 96 (legis.md, versiunile din 01.07.2026 și 01.01.2027 — același text,
// citite la 16.10.2026): cota standard 20%, cotele reduse de 8% (pentru ce — în nota din i18n.ts).
export const VAT = { verificat: "2026-10-16", cote: [20, 8] } as const;
export type VatMode = "adauga" | "scoate";

export function vat(amount: number, ratePct: number, mode: VatMode) {
  if (!(amount > 0) || !(ratePct >= 0)) return null;
  if (mode === "adauga") {
    const tax = round((amount * ratePct) / 100);
    return { net: round(amount), tax, gross: round(amount + tax) };
  }
  const net = round((amount * 100) / (100 + ratePct));
  return { net, tax: round(amount - net), gross: round(amount) };
}

// Penalitățile de întârziere. Rata de bază BNM (bnm.md, deciziile de politică monetară, citite la
// 16.10.2026): 3,60% (05.12.2024) -> 5,60% (10.01.2025) -> 6,50% -> 6,25% (07.08.2025) -> 6,00%
// (18.09.2025, menținută 06.11.2025) -> 5,00% (11.12.2025) -> 6,50% (07.05.2026) -> 7,00%
// (18.06.2026) -> 7,50% (06.08.2026) -> 9,00% (17.09.2026).
// Codul civil (legis.md, versiunea din 01.04.2026): art. 942 alin. (2) — dobânda de întârziere =
// rata din art. 874 + 5 puncte (debitor consumator) sau + 9 puncte (ceilalți); art. 874 alin. (2) —
// rata BNM în vigoare la 1 ianuarie (semestrul I) și la 1 iulie (semestrul II); se datorează din
// ziua de după scadență până la ziua plății. Codul fiscal, art. 228 alin. (2)–(3): pe fiecare zi după
// scadență, inclusiv ziua plății; procentul pe zi = (rata BNM din noiembrie anul precedent,
// rotunjită în sus la procent întreg, + 5) / zilele anului, cu 4 zecimale.
export const BNM_RATES = {
  verificat: "2026-10-16",
  semestre: [
    ["2025-01-01", 3.6],
    ["2025-07-01", 6.5],
    ["2026-01-01", 5],
    ["2026-07-01", 7],
  ] as [string, number][],
  noiembrie: { 2024: 3.6, 2025: 6 } as Record<number, number>,
};
export type LateKind = "consumator" | "profesionist" | "contract" | "fiscal";

const leapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// majorarea de întârziere la impozite, % pe zi, pentru anul `year` (null: rata BNM încă necunoscută)
export function fiscalDailyPct(year: number) {
  const b = BNM_RATES.noiembrie[year - 1];
  if (b === undefined) return null;
  return Math.round(((Math.ceil(b - 1e-9) + 5) / (leapYear(year) ? 366 : 365)) * 10000) / 10000;
}

// rata de bază BNM aplicabilă (art. 874) într-o zi; null înainte de primul semestru din tabel
function semesterRate(iso: string) {
  return [...BNM_RATES.semestre].reverse().find(([from]) => iso >= from)?.[1] ?? null;
}

// ponytail: dobânda civilă pe zi = rata anuală / 365 (și în anii bisecți) — convenția uzuală; legea nu fixează baza
export function latePayment(amount: number, due: string, paid: string, kind: LateKind, contractDailyPct = 0) {
  const a = dayNo(due);
  const b = dayNo(paid);
  if (!(amount > 0) || Number.isNaN(a) || Number.isNaN(b) || b < a || b - a > 3660) return null;
  const parts: { from: string; to: string; days: number; rate: number; perDay: boolean; sum: number }[] = [];
  let total = 0;
  for (let d = a + 1; d <= b; d++) {
    const iso = isoOf(d);
    let rate: number | null;
    let perDayPct: number;
    if (kind === "contract") {
      rate = contractDailyPct;
      perDayPct = rate;
    } else if (kind === "fiscal") {
      rate = fiscalDailyPct(Number(iso.slice(0, 4)));
      perDayPct = rate ?? 0;
    } else {
      const base = semesterRate(iso);
      rate = base === null ? null : base + (kind === "consumator" ? 5 : 9);
      perDayPct = (rate ?? 0) / 365;
    }
    if (rate === null) return { missing: iso, days: b - a, total: 0, parts: [] };
    const sum = (amount * perDayPct) / 100;
    total += sum;
    const last = parts[parts.length - 1];
    if (last && last.rate === rate) {
      last.to = iso;
      last.days++;
      last.sum += sum;
    } else parts.push({ from: iso, to: iso, days: 1, rate, perDay: kind === "contract" || kind === "fiscal", sum });
  }
  return { missing: null, days: b - a, total: round(total), parts: parts.map((p) => ({ ...p, sum: round(p.sum) })) };
}

// Materiale pentru renovare: valori tipice ale redacției, nu norme — consumul real e pe ambalaj.
export const RENOVATION = {
  vopsea_m2_l: 10, // un litru de vopsea lavabilă acoperă circa 8–12 m² într-un strat
  straturi: 2,
  galeata_l: 10,
  rezerva_pct: 10,
  placa_cm: [30, 60],
  placi_cutie: 8,
  rola_latime_m: 0.53,
  rola_lungime_m: 10.05,
  tapet_adaos_cm: 10, // 5 cm sus și 5 cm jos, pentru tăiere
  laminat_m2_pachet: 2,
  laminat_rezerva_pct: 7,
} as const;

const up = (n: number) => Math.ceil(n - 1e-9);

export function paint(o: { length: number; width: number; height: number; openings: number; ceiling: boolean; coats: number; m2PerL: number; bucketL: number; reservePct: number }) {
  const walls = Math.max(0, 2 * (o.length + o.width) * o.height - o.openings);
  const area = round(walls + (o.ceiling ? o.length * o.width : 0));
  if (!(area > 0) || !(o.m2PerL > 0) || !(o.coats >= 1)) return null;
  const liters = round(((area * Math.floor(o.coats)) / o.m2PerL) * (1 + o.reservePct / 100));
  return { area, liters, buckets: o.bucketL > 0 ? up(liters / o.bucketL) : null };
}

export function tiles(area: number, wCm: number, hCm: number, perBox: number, reservePct: number) {
  const tile = (wCm * hCm) / 10000;
  if (!(area > 0) || !(tile > 0)) return null;
  const withReserve = round(area * (1 + reservePct / 100));
  const count = up(withReserve / tile);
  return { withReserve, tile: round(tile * 10000) / 10000, count, boxes: perBox > 0 ? up(count / Math.floor(perBox)) : null };
}

// ponytail: raportul de model se adaugă întreg la fiecare fâșie (estimare acoperitoare); ușile și ferestrele nu se scad
export function wallpaper(perimeter: number, height: number, rollW: number, rollL: number, repeatCm: number, extraCm: number) {
  const strip = height + (repeatCm + extraCm) / 100;
  if (!(perimeter > 0) || !(height > 0) || !(rollW > 0) || !(strip > 0)) return null;
  const perRoll = Math.floor(rollL / strip + 1e-9);
  if (perRoll < 1) return null;
  const strips = up(perimeter / rollW);
  return { strip: round(strip), strips, perRoll, rolls: up(strips / perRoll) };
}

export function flooring(area: number, m2PerPack: number, reservePct: number) {
  if (!(area > 0) || !(m2PerPack > 0)) return null;
  const withReserve = round(area * (1 + reservePct / 100));
  return { withReserve, packs: up(withReserve / m2PerPack) };
}

// RCA și Carte Verde: Hotărârea BNM nr. 198 din 20.08.2026 (MO nr. 390-393 din 25.08.2026, în vigoare
// din 04.10.2026; bnm.md, citită la 16.10.2026), emisă în baza Legii nr. 106/2022, art. 12 alin. (11).
// Anexa 1: prima de bază RCA internă 1 420 lei × coeficienții K1 (vehicul), K2 (localitatea), K3
// (persoană fizică / juridică), K4 (vârsta și vechimea șoferului, doar la persoane fizice); taxi și
// troleibuz: fără K3 și K4; remorca: 0,2 × prima vehiculului care o tractează — așa ies exact sumele din
// anexa 2. Prima de referință e indicativă: asigurătorul își calculează prima, dar nu mai mică decât ea
// (Legea nr. 106/2022, art. 12 alin. (12)); clasa bonus-malus se aplică separat.
// Carte Verde (anexele 1 și 3, euro): prima de bază pe zonă × K1v; coeficienții pe durată de mai jos
// reproduc exact tabelul din anexa 3 (zona 2 nu se aplică: birourile din Rusia și Belarus sunt suspendate).
export const RCA = {
  verificat: "2026-10-16",
  de_la: "2026-10-04",
  baza: 1420,
  k1: {
    "auto-1200": 0.88,
    "auto-1600": 0.91,
    "auto-2000": 1.08,
    "auto-2400": 1.06,
    "auto-3000": 1.23,
    "auto-3000+": 1.17,
    "auto-electric": 1.99,
    taxi: 7.97,
    "pasageri-17": 0.67,
    "pasageri-30": 1.61,
    "pasageri-30+": 3.24,
    troleibuz: 10,
    "tractor-45": 0.15,
    "tractor-100": 0.11,
    "tractor-100+": 0.21,
    "camion-3500": 1.08,
    "camion-12000": 1.53,
    "camion-12000+": 2.18,
    "moto-300": 0.1,
    "moto-300+": 0.32,
  },
  k2: { chisinau: 1.35, alte: 0.71 },
  k3: { pf: 0.88, pj: 1.39 },
  k4: { "tanar-nou": 2.94, tanar: 1.74, nou: 1.75, experimentat: 0.82 },
  remorca: 0.2,
  externa: {
    zona1: { baza: 16, termen: [0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 1, 1, 1] },
    zona3: { baza: 336, termen: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 1, 1, 1] },
    k1: {
      zona1: { A: 0.83, B: 0.91, C1: 1.01, C2: 1.78, E1: 5.99, E2: 9.03 },
      zona3: { A: 0.94, B: 0.92, C1: 3.45, C2: 1.74, E1: 2.42, E2: 3.77 },
    },
    termene: ["15z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    remorca: 0.1,
  },
} as const;
export type RcaVehicle = keyof typeof RCA.k1;
export type RcaZone = keyof typeof RCA.k2;
export type RcaOwner = keyof typeof RCA.k3;
export type RcaDriver = keyof typeof RCA.k4;
export type GreenZone = keyof typeof RCA.externa.k1;
export type GreenVehicle = keyof typeof RCA.externa.k1.zona1;
export type GreenTerm = (typeof RCA.externa.termene)[number];

export function rcaPremium(v: RcaVehicle, zone: RcaZone, owner: RcaOwner, driver: RcaDriver) {
  const special = v === "taxi" || v === "troleibuz";
  const k3 = special ? 1 : RCA.k3[owner];
  const k4 = special || owner === "pj" ? 1 : RCA.k4[driver];
  const premium = round(RCA.baza * RCA.k1[v] * RCA.k2[zone] * k3 * k4);
  return { premium, trailer: round(premium * RCA.remorca), k1: RCA.k1[v], k2: RCA.k2[zone], k3, k4, special };
}

export function greenCard(zone: GreenZone, v: GreenVehicle, term: GreenTerm) {
  const z = RCA.externa[zone];
  const i = RCA.externa.termene.indexOf(term);
  const year = round(z.baza * RCA.externa.k1[zone][v]);
  const premium = round(year * z.termen[i]);
  return { premium, trailer: round(premium * RCA.externa.remorca) };
}
