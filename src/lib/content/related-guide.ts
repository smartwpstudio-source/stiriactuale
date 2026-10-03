import { getGuides, type Guide } from "./guides";

// Ghidul sau dosarul potrivit pentru o știre — afișat sub articol ("Ghid util").
// Potrivire pe cuvinte comune (titlu + lead vs titlu + descriere ghid), fără
// AI: rădăcina = primele 6 litere fără diacritice, cuvinte de minim 4 litere
// (sau acronime, cu pondere dublă),
// fără cele de umplutură. Minim 2 puncte comune, altfel nimic.
// ponytail: potrivire lexicală simplă; dacă apar perechi greșite, de trecut
// la o listă de cuvinte-cheie per ghid în JSON.
const MIN_SHARED = 2;
const STOP = new Set(
  "pentru care este sunt fost după despre între către până când unde cine cum ceea acest aceasta această acestea acum doar care spune spun anul anii lunii luni astăzi ieri mâine moldova moldovei republica republicii chișinău chisinau poate pot trebuie foarte mult multe mai noua noul nouă noile ghid cele celor dintre prin într printre fără ziua lei euro milioane miliarde".split(" "),
);

const isAcronym = (w: string) => w.length >= 3 && w === w.toUpperCase();

// rădăcină -> pondere; acronimele (RCA, ANRE, CNAS) contează dublu, chiar
// dacă sunt scurte — sunt cel mai precis semnal de subiect
function stems(text: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const w of text.split(/[^\p{L}]+/u)) {
    const lower = w.toLowerCase();
    if ((w.length < 4 && !isAcronym(w)) || STOP.has(lower)) continue;
    const stem = lower.normalize("NFD").replace(/\p{M}/gu, "").slice(0, 6);
    out.set(stem, Math.max(out.get(stem) ?? 0, isAcronym(w) ? 2 : 1));
  }
  return out;
}

export function bestGuide(text: string, guides: Guide[]): Guide | undefined {
  const target = stems(text);
  let best: { g: Guide; score: number } | undefined;
  for (const g of guides) {
    let score = 0;
    for (const [s, w] of stems(`${g.title} ${g.description}`)) if (target.has(s)) score += Math.max(w, target.get(s)!);
    if (score >= MIN_SHARED && (!best || score > best.score)) best = { g, score };
  }
  return best?.g;
}

// Ghidurile de oraș („Cahul: primăria, spitalul…”) au cuvinte comune cu orice
// accident sau spital: apar DOAR la știrile din acel oraș, după localitate.
const CITY_LOCALITY: Record<string, string> = { comrat: "gagauzia" };

export function pickGuide(text: string, locality: string | undefined, guides: Guide[]): Guide | undefined {
  const cities = guides.filter((g) => g.category === "orase");
  const own = cities.find((g) => {
    const city = g.slug.split("-")[0];
    return locality === (CITY_LOCALITY[city] ?? city);
  });
  return own ?? bestGuide(text, guides.filter((g) => g.category !== "orase"));
}

export async function getRelatedGuide(title: string, lead: string, locality?: string): Promise<Guide | undefined> {
  return pickGuide(`${title} ${lead}`, locality, await getGuides());
}
