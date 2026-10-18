import { stripDiacritics } from "@/lib/pipeline/text-normalize";

// Căutarea în calculatoare și ghiduri (2026-10-17): fără diacritice, litere mici,
// fiecare cuvânt de 3+ litere trebuie să apară (după primele 5 litere, ca
// „salariu” să găsească „salariul”, „pensii” — „pensia”). Cuvintele „calculator”
// și „ghid” doar aleg tipul, nu se caută în text.
const norm = (s: string) => stripDiacritics(s).toLowerCase();
const META = /^(calcul\w*|ghid\w*)$/;

export function searchTerms(query: string): string[] {
  return norm(query)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !META.test(w))
    .map((w) => w.slice(0, 5));
}

export function matchTools<T extends { title: string; description: string }>(items: T[], terms: string[], max: number): T[] {
  if (!terms.length) return [];
  const all = (s: string) => terms.every((t) => norm(s).includes(t));
  const hits = items.filter((it) => all(`${it.title} ${it.description}`));
  // întâi cele cu toate cuvintele în titlu
  return [...hits.filter((it) => all(it.title)), ...hits.filter((it) => !all(it.title))].slice(0, max);
}
