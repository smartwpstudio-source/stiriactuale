import { readFileSync } from "node:fs";
import path from "node:path";
import { HAIKU_MODEL, structured } from "./llm";
import { and, desc, ilike, like } from "drizzle-orm";
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

// Pozele încărcate de editor cu eticheta „imagine simbol” (regula
// proprietarului, 2026-10-07): intră în arhivă ca teme ilustrative și se
// refolosesc la alte știri pe același subiect, cu aceeași rotație.
// ponytail: ultimele 150; o arhivă separată pe teme dacă devin sute.
export async function loadSymbolPhotos(): Promise<Place[]> {
  const rows = await getDb()
    .select({ id: articles.id, title: articles.title, alt: articles.imageAltText, url: articles.imageUrl })
    .from(articles)
    .where(and(ilike(articles.imageCredit, "%simbol%"), like(articles.imageUrl, "%/articole/manual-%")))
    .orderBy(desc(articles.publishedAt))
    .limit(150);
  const seen = new Set<string>();
  return rows.flatMap((r) =>
    !r.url || seen.has(r.url) || !seen.add(r.url)
      ? []
      : [{ id: `simbol-${r.id}`, name: `TEMĂ (poză simbol): ${r.alt ?? r.title}`, keywords: r.title, photos: [{ url: r.url, credit: "Imagine simbol", source: "", alt: r.alt ?? undefined }] }],
  );
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
