import { readFileSync } from "node:fs";
import path from "node:path";
import { HAIKU_MODEL, structured } from "./llm";
import { and, desc, ilike, isNotNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";

// Arhiva de locuri reale din Moldova (Aeroportul Chișinău, vama Leușeni,
// Parlamentul, Nistrul…): poze Wikimedia Commons cu licență liberă, semnate cu
// autorul (scripts/locuri/import.ts). Când știrea e despre un loc din arhivă,
// poza reală a locului bate orice poză de stoc.
export interface Place {
  id: string;
  name: string;
  keywords: string;
  locality?: string; // clădirile din raioane: doar la știrile din acel raion
  photos: { url: string; credit: string; source: string; alt?: string }[];
}

export function loadPlaces(): Place[] {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "content", "locuri", "locuri.json"), "utf8"));
  } catch {
    return [];
  }
}

// Pozele marcate „Imagine simbol” (regula proprietarului, 2026-10-07; extinsă
// 2026-10-13): oricine le-a pus — la adăugarea linkului, din pagina articolului
// în admin sau refolosite de pipeline — intră în arhivă ca teme ilustrative și
// se refolosesc la alte știri pe același subiect, ÎNAINTE de stoc / AI.
// Pozele pe aceeași temă (aceeași descriere a editorului, sau foarte apropiată)
// formează un singur loc cu mai multe poze, ca pickRotated să le rotească.
// ponytail: ultimele 300; o arhivă separată pe teme dacă devin sute.
export interface SymbolRow {
  id: number;
  title: string;
  alt: string | null;
  url: string | null;
}

const words = (s: string) =>
  new Set(
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3)
      .map((w) => w.slice(0, 5)),
  );

// aceeași temă: descrieri cu cel puțin jumătate din cuvinte comune (rădăcini de 5 litere)
export function sameTheme(a: string, b: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return false;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.min(wa.size, wb.size) >= 0.5 && common / Math.max(wa.size, wb.size) >= 0.34;
}

export function groupSymbolPhotos(rows: SymbolRow[]): Place[] {
  const seen = new Set<string>();
  const groups: { theme: string; ids: number[]; titles: string[]; photos: Place["photos"] }[] = [];
  for (const r of rows) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    // fără descriere, tema e titlul articolului (rămâne de obicei singură)
    const theme = r.alt?.trim() || r.title;
    const g = r.alt?.trim() ? groups.find((x) => sameTheme(x.theme, theme)) : undefined;
    const photo = { url: r.url, credit: "Imagine simbol", source: "", alt: r.alt ?? undefined };
    if (g) {
      g.photos.push(photo);
      g.ids.push(r.id);
      if (g.titles.length < 3) g.titles.push(r.title);
    } else groups.push({ theme, ids: [r.id], titles: [r.title], photos: [photo] });
  }
  return groups.map((g) => ({
    id: `simbol-${g.ids[0]}`,
    name: `TEMĂ (poză simbol): ${g.theme}`,
    keywords: g.titles.join(" / "),
    photos: g.photos,
  }));
}

export async function loadSymbolPhotos(): Promise<Place[]> {
  const rows = await getDb()
    .select({ id: articles.id, title: articles.title, alt: articles.imageAltText, url: articles.imageUrl })
    .from(articles)
    .where(and(ilike(articles.imageCredit, "%simbol%"), isNotNull(articles.imageUrl)))
    .orderBy(desc(articles.publishedAt))
    .limit(300);
  return groupSymbolPhotos(rows);
}

// Rotație: `recent` = pozele ultimelor articole, cele mai noi primele. Se
// alege poza locului folosită cel mai demult (sau niciodată); dacă toate au
// apărut în ultimele NEIGHBOURS articole, nu se folosește locul — altfel două
// știri diferite stau alăturate cu aceeași poză (2026-10-04). Lista se
// actualizează pe loc, ca rulările paralele să nu aleagă aceeași poză.
const NEIGHBOURS = 12;

export function pickRotated<P extends { url: string }>(photos: P[], recent: string[]): P | null {
  const age = (url: string) => {
    const i = recent.indexOf(url);
    return i < 0 ? Infinity : i;
  };
  const best = [...photos].sort((a, b) => age(b.url) - age(a.url))[0];
  if (!best || age(best.url) < NEIGHBOURS) return null;
  recent.unshift(best.url);
  return best;
}

export async function matchPlacePhoto(
  subject: string,
  all: Place[],
  locality: string | undefined,
  recent: string[],
): Promise<{ url: string; credit: string; alt?: string } | null> {
  const places = all.filter((p) => !p.locality || p.locality === locality);
  if (!places.length) return null;
  try {
    const { match } = await structured<{ match: number }>({
      model: HAIKU_MODEL,
      system:
        "Alegi poza pentru o știre; poza trebuie să arate SUBIECTUL PRINCIPAL. Lista are două feluri de intrări. (1) LOCURI și INSTITUȚII reale (Aeroportul Chișinău, Parlamentul, vama Leușeni, spitalul din Fălești): le alegi doar dacă subiectul principal ESTE acel loc sau acea instituție (zborurile de pe aeroport, o decizie a Parlamentului, cozile la vamă); locul unde s-a întâmplat un accident sau un incendiu NU e subiectul. (2) TEME ilustrative (accident rutier, incendiu, pompieri, poliție, ambulanță, vreme, bani, prețuri, vot, grafice de avertizare, escrocherie): le alegi când știrea e despre acel tip de întâmplare (orice accident rutier -> accident rutier; ninsoarea -> ninsoare). Graficele de avertizare (cod galben/portocaliu/roșu) doar dacă știrea E acea avertizare, cu același cod și fenomen. Drona, racheta, obiectele care nu sunt în listă: -1 (se caută altă poză). În caz de dubiu: -1.",
      prompt: `Știrea: ${subject}\n\nLocuri:\n${places.map((p, i) => `${i}. ${p.name} (${p.keywords})`).join("\n")}`,
      schema: { type: "object", properties: { match: { type: "integer" } }, required: ["match"] },
      maxBudgetUsd: 0.05,
    });
    const p = pickRotated(places[match]?.photos ?? [], recent);
    return p && { url: p.url, credit: p.credit, alt: p.alt };
  } catch {
    return null;
  }
}
