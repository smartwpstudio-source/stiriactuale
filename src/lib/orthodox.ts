// Calendarul creștin-ortodox, calculat: Paștele (pascalia iuliană, aceeași
// pentru stil vechi și nou), sărbătorile mobile, posturile, și conversia
// sărbătorilor fixe pe cele două stiluri:
//  - stil nou (Mitropolia Basarabiei): data bisericească = data civilă;
//  - stil vechi (Mitropolia Moldovei): data bisericească e în calendarul
//    iulian, deci în calendarul civil cade cu 13 zile mai târziu.
// ponytail: diferența de 13 zile e valabilă 1900–2099; din 2100 devine 14.

export type Style = "vechi" | "nou";

const DAY = 86_400_000;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

// Paștele ortodox: algoritmul Meeus pentru calendarul iulian, apoi +13 zile.
export function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return addDays(utc(year, month, day), 13);
}

// Data civilă a unei sărbători fixe (lună/zi bisericească) în anul civil `year`.
// Pe stil vechi, sărbătorile de la sfârșitul lui decembrie cad în ianuarie, deci
// căutăm în anul bisericesc curent și în cel anterior.
export function fixedDate(month: number, day: number, year: number, style: Style): Date | null {
  if (style === "nou") return month === 2 && day === 29 && !isGregorianLeap(year) ? null : utc(year, month, day);
  for (const y of [year, year - 1]) {
    if (month === 2 && day === 29 && y % 4 !== 0) continue;
    const g = addDays(utc(y, month, day), 13);
    if (g.getUTCFullYear() === year) return g;
  }
  return null;
}

const isGregorianLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export interface Feast {
  date: Date;
  name: string;
  kind: "mare" | "post" | "sfant";
  guide?: string;
}

// Sărbătorile mobile, față de Paști (aceleași pe ambele stiluri).
const MOVABLE: [number, string, string?][] = [
  [-48, "Începutul Postului Mare", "postul-mare-cand-incepe-si-cum-se-tine"],
  [-7, "Floriile — Intrarea Domnului în Ierusalim", "floriile-traditii-si-onomastica"],
  [-2, "Vinerea Mare", "saptamana-mare-si-vinerea-mare"],
  [0, "Învierea Domnului — Paștele", "pastele-traditii-in-moldova"],
  [1, "A doua zi de Paști", "pastele-traditii-in-moldova"],
  [8, "Paștele Blajinilor (Memorialul)", "pastele-blajinilor-traditii-si-pomenirea-mortilor"],
  [39, "Înălțarea Domnului", "inaltarea-domnului-si-rusaliile-traditii"],
  [49, "Rusaliile — Pogorârea Sfântului Duh", "inaltarea-domnului-si-rusaliile-traditii"],
  [50, "A doua zi de Rusalii — Sfânta Treime", "inaltarea-domnului-si-rusaliile-traditii"],
];

// Sărbătorile mari cu dată fixă (data bisericească). Lista completă de sfinți
// pe zile vine din content/calendar/sfinti/ (calendar-data.ts).
// al 4-lea element: slug-ul paginii de sărbătoare din /ghiduri/ (categoria
// sarbatori), legat explicit — potrivirea pe cuvinte greșea între sărbători
// cu nume asemănătoare (Soborul / Nașterea / Tăierea capului Sf. Ioan).
export const FIXED_FEASTS: [number, number, string, string?][] = [
  [1, 1, "Tăierea împrejur a Domnului; Sfântul Vasile cel Mare", "sfantul-vasile-si-anul-nou-traditii"],
  [1, 6, "Botezul Domnului — Boboteaza", "boboteaza-traditii-si-agheasma-mare"],
  [1, 7, "Soborul Sfântului Ioan Botezătorul", "sfantul-ioan-botezatorul-soborul-onomastica"],
  [2, 2, "Întâmpinarea Domnului", "intampinarea-domnului-stretenia-traditii"],
  [3, 25, "Buna Vestire", "buna-vestire-traditii-si-credinte"],
  [4, 23, "Sfântul Mare Mucenic Gheorghe", "sfantul-gheorghe-traditii-si-onomastica"],
  [6, 24, "Nașterea Sfântului Ioan Botezătorul"],
  [6, 29, "Sfinții Apostoli Petru și Pavel"],
  [7, 20, "Sfântul Proroc Ilie"],
  [8, 6, "Schimbarea la Față a Domnului"],
  [8, 15, "Adormirea Maicii Domnului"],
  [8, 29, "Tăierea capului Sfântului Ioan Botezătorul"],
  [9, 8, "Nașterea Maicii Domnului"],
  [9, 14, "Înălțarea Sfintei Cruci"],
  [10, 1, "Acoperământul Maicii Domnului"],
  [10, 26, "Sfântul Mare Mucenic Dimitrie"],
  [11, 8, "Soborul Sfinților Arhangheli Mihail și Gavriil"],
  [11, 21, "Intrarea în Biserică a Maicii Domnului"],
  [11, 30, "Sfântul Apostol Andrei", "sfantul-andrei-traditii-si-credinte"],
  [12, 6, "Sfântul Ierarh Nicolae", "sfantul-nicolae-traditii-si-onomastica"],
  [12, 25, "Nașterea Domnului — Crăciunul", "craciunul-nasterea-domnului-traditii-in-moldova"],
  [12, 26, "Soborul Maicii Domnului"],
];

export function yearFeasts(year: number, style: Style): Feast[] {
  const easter = orthodoxEaster(year);
  const out: Feast[] = MOVABLE.map(([off, name, guide]) => ({ date: addDays(easter, off), name, kind: "mare" as const, guide }));
  for (const [m, d, name, guide] of FIXED_FEASTS) {
    const date = fixedDate(m, d, year, style);
    if (date) out.push({ date, name, kind: "mare", guide });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface Fast {
  name: string;
  guide?: string;
  from: Date;
  to: Date;
}

// Posturile de durată din anul civil (cele care încep în acel an).
export function yearFasts(year: number, style: Style): Fast[] {
  const easter = orthodoxEaster(year);
  const fd = (m: number, d: number, y = year) => fixedDate(m, d, y, style);
  const out: Fast[] = [
    { name: "Postul Mare (al Paștelui)", from: addDays(easter, -48), to: addDays(easter, -1), guide: "postul-mare-cand-incepe-si-cum-se-tine" },
  ];
  const peterEnd = fd(6, 28);
  const peterStart = addDays(easter, 57);
  if (peterEnd && peterEnd > peterStart) out.push({ name: "Postul Sfinților Apostoli Petru și Pavel", from: peterStart, to: peterEnd });
  const aug1 = fd(8, 1);
  const aug14 = fd(8, 14);
  if (aug1 && aug14) out.push({ name: "Postul Adormirii Maicii Domnului", from: aug1, to: aug14 });
  const nov15 = fd(11, 15);
  // pe stil vechi, 24 decembrie bisericesc cade pe 6 ianuarie anul următor
  const dec24 = style === "nou" ? fd(12, 24) : fixedDate(12, 24, year + 1, style);
  if (nov15 && dec24) out.push({ name: "Postul Nașterii Domnului (al Crăciunului)", from: nov15, to: dec24, guide: "postul-craciunului-cand-incepe-si-cum-se-tine" });
  return out;
}

// Data bisericească (lună, zi) a unei zile civile — pentru „sfântul zilei”.
export function churchDay(civil: Date, style: Style): { month: number; day: number } {
  const d = style === "vechi" ? addDays(civil, -13) : civil;
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

const MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const WEEKDAYS = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"];
export const formatDay = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
export const weekday = (d: Date) => WEEKDAYS[d.getUTCDay()];
export const monthName = (m: number) => MONTHS[m - 1];
