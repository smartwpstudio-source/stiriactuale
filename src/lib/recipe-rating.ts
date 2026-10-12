// Funcții pure pentru rețete: numele scurt al unui pas (JSON-LD HowToStep.name)
// și nota cititorilor (media, pluralele). Testate în scripts/checks/recipe-rating.ts.

const MAX_WORDS = 8;
const CUT_WORDS = 6;
// cuvinte care nu pot încheia un nume tăiat ("Se pune carnea în" → "Se pune carnea")
const DANGLING = new Set([
  "și", "sau", "cu", "în", "la", "de", "din", "pe", "pentru", "până", "după", "peste", "sub", "un", "o", "a", "al", "ale", "cât", "mai", "încă", "foarte", "cel", "cea",
  "и", "или", "с", "со", "в", "во", "на", "до", "по", "для", "из", "от", "к", "под", "над", "а", "но", "чтобы", "ещё", "еще", "очень",
]);

// Primele cuvinte ale pasului, până la prima virgulă / punct (fără punctuație la final);
// dacă prima bucată e prea scurtă („Între timp,”), se continuă până la a doua virgulă.
// Determinist: același text → același nume, în RO și RU.
export function stepName(text: string): string {
  const sentence = text.trim().split(/[.;:!?…](?=\s|$)|\s[–—-]\s|\(/)[0];
  const parts = sentence.split(/,(?=\s)/);
  let clause = parts[0];
  for (let i = 1; i < parts.length && clause.trim().split(/\s+/).length < 3; i++) clause += "," + parts[i];
  let words = clause.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) {
    words = words.slice(0, CUT_WORDS);
    const last = () => words[words.length - 1].toLowerCase();
    // nici cuvânt de legătură, nici cifră rămasă fără unitate („încă 5”)
    while (words.length > 2 && (DANGLING.has(last()) || /^[\d,.–-]+$/.test(last()))) words.pop();
  }
  return words.join(" ").replace(/[\s,.;:!?…–—-]+$/u, "");
}

export interface RatingSummary {
  value: number; // media cu o zecimală
  count: number;
}

// Media din suma și numărul notelor; null dacă nu există nicio notă (nu inventăm valori).
export function ratingSummary(sum: number, count: number): RatingSummary | null {
  if (!Number.isFinite(sum) || !Number.isInteger(count) || count < 1) return null;
  return { value: Math.round((sum / count) * 10) / 10, count };
}

export const isStars = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 5;

// „1 notă”, „3 note”, „20 de note”; „1 оценка”, „3 оценки”, „5 оценок”
export function ratingsLabel(n: number, lang: "ro" | "ru"): string {
  if (lang === "ru") {
    const d = n % 10;
    const dd = n % 100;
    if (d === 1 && dd !== 11) return `${n} оценка`;
    if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} оценки`;
    return `${n} оценок`;
  }
  if (n === 1) return "1 notă";
  const dd = n % 100;
  return n === 0 || (dd >= 1 && dd <= 19) ? `${n} note` : `${n} de note`;
}

export const formatRating = (v: number, lang: "ro" | "ru") => `${v.toFixed(1).replace(".", ",")} ${lang === "ru" ? "из" : "din"} 5`;
