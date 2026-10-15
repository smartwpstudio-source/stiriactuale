// Calendarul creștin-ortodox, calculat: Paștele (pascalia iuliană, aceeași
// pentru stil vechi și nou), sărbătorile mobile, posturile, și conversia
// sărbătorilor fixe pe cele două stiluri:
//  - stil nou (calendarul îndreptat, doar unele parohii): data bisericească = data civilă;
//  - stil vechi (majoritatea parohiilor din Moldova, din ambele mitropolii): data bisericească e în calendarul
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
  kind: "mare" | "post" | "sfant" | "laic";
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
  [6, 29, "Sfinții Apostoli Petru și Pavel", "sfintii-petru-si-pavel-traditii"],
  [7, 20, "Sfântul Proroc Ilie", "sfantul-ilie-traditii-si-credinte"],
  [8, 6, "Schimbarea la Față a Domnului", "schimbarea-la-fata-traditii"],
  [8, 15, "Adormirea Maicii Domnului", "sfanta-maria-mare-adormirea-maicii-domnului"],
  [8, 29, "Tăierea capului Sfântului Ioan Botezătorul", "taierea-capului-sfantului-ioan-traditii"],
  [9, 8, "Nașterea Maicii Domnului", "sfanta-maria-mica-nasterea-maicii-domnului"],
  [9, 14, "Înălțarea Sfintei Cruci", "inaltarea-sfintei-cruci-ziua-crucii"],
  [10, 1, "Acoperământul Maicii Domnului"],
  [10, 26, "Sfântul Mare Mucenic Dimitrie", "sfantul-dumitru-traditii-si-onomastica"],
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

// Sărbătorile populare și zilele naționale (calendar civil, aceleași pe
// ambele stiluri), cu pagina lor din /ghiduri/ — legată doar dacă există.
const firstWeekday = (year: number, month: number, weekday: number) => {
  const d = utc(year, month, 1);
  return addDays(d, (weekday - d.getUTCDay() + 7) % 7);
};

export function civilDays(year: number): Feast[] {
  const wineSat = firstWeekday(year, 10, 6);
  const days: [Date, string, string?][] = [
    [utc(year, 1, 1), "Anul Nou", "revelionul-traditii-si-cum-il-petreci"],
    [utc(year, 2, 14), "Ziua Îndrăgostiților — Sfântul Valentin", "sfantul-valentin-in-moldova"],
    [utc(year, 2, 24), "Dragobete", "dragobete-traditii"],
    [utc(year, 3, 1), "Mărțișorul", "martisorul-traditii"],
    [utc(year, 3, 8), "Ziua Internațională a Femeii", "8-martie-ziua-femeii"],
    [firstWeekday(year, 5, 0), "Ziua Mamei", "ziua-mamei-in-moldova"],
    [utc(year, 5, 9), "Ziua Europei și Ziua Victoriei", "9-mai-ziua-europei-si-ziua-victoriei"],
    [utc(year, 6, 1), "Ziua Ocrotirii Copilului", "1-iunie-ziua-copilului"],
    [utc(year, 8, 27), "Ziua Independenței", "ziua-independentei-27-august"],
    [utc(year, 8, 31), "Ziua Limbii Române („Limba noastră”)", "limba-noastra-cea-romana-31-august"],
    [wineSat, "Ziua Națională a Vinului (primul weekend din octombrie)", "ziua-nationala-a-vinului"],
    [utc(year, 10, 14), "Hramul orașului Chișinău (Acoperământul Maicii Domnului)", "hramul-chisinaului-14-octombrie"],
    [utc(year, 12, 31), "Revelionul", "revelionul-traditii-si-cum-il-petreci"],
  ];
  return days.map(([date, name, guide]) => ({ date, name, kind: "laic" as const, guide }));
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
  if (peterEnd && peterEnd > peterStart) out.push({ name: "Postul Sfinților Apostoli Petru și Pavel", from: peterStart, to: peterEnd, guide: "sfintii-petru-si-pavel-traditii" });
  const aug1 = fd(8, 1);
  const aug14 = fd(8, 14);
  if (aug1 && aug14) out.push({ name: "Postul Adormirii Maicii Domnului", from: aug1, to: aug14, guide: "sfanta-maria-mare-adormirea-maicii-domnului" });
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

// Zilele de sărbătoare nelucrătoare la nivel național (Codul muncii, art. 111
// alin. (1), verificat pe legis.md la 15.10.2026). Fără hramurile locale (lit. j).
export type HolidayId =
  | "anul-nou" | "craciun-vechi-1" | "craciun-vechi-2" | "ziua-femeii" | "paste-1" | "paste-2" | "blajini"
  | "1-mai" | "9-mai" | "1-iunie" | "independenta" | "limba-romana" | "craciun-nou";

export function publicHolidays(y: number): { date: Date; id: HolidayId }[] {
  const easter = orthodoxEaster(y);
  const list: [Date, HolidayId][] = [
    [utc(y, 1, 1), "anul-nou"], [utc(y, 1, 7), "craciun-vechi-1"], [utc(y, 1, 8), "craciun-vechi-2"], [utc(y, 3, 8), "ziua-femeii"],
    [easter, "paste-1"], [addDays(easter, 1), "paste-2"], [addDays(easter, 8), "blajini"], // Paștele Blajinilor: lunea, o săptămână după Paști
    [utc(y, 5, 1), "1-mai"], [utc(y, 5, 9), "9-mai"], [utc(y, 6, 1), "1-iunie"], [utc(y, 8, 27), "independenta"], [utc(y, 8, 31), "limba-romana"],
    [utc(y, 12, 25), "craciun-nou"],
  ];
  return list.map(([date, id]) => ({ date, id }));
}

export const holidayOn = (day: Date) => publicHolidays(day.getUTCFullYear()).find((h) => h.date.getTime() === day.getTime());
export const isPublicHoliday = (day: Date) => holidayOn(day) !== undefined;

// Zi liberă: sâmbătă, duminică sau sărbătoare legală
export const isDayOff = (day: Date) => day.getUTCDay() === 0 || day.getUTCDay() === 6 || isPublicHoliday(day);
