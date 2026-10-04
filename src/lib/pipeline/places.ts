import { readFileSync } from "node:fs";
import path from "node:path";
import { HAIKU_MODEL, structured } from "./llm";

// Arhiva de locuri reale din Moldova (Aeroportul Chișinău, vama Leușeni,
// Parlamentul, Nistrul…): poze Wikimedia Commons cu licență liberă, semnate cu
// autorul (scripts/locuri/import.ts). Când știrea e despre un loc din arhivă,
// poza reală a locului bate orice poză de stoc.
export interface Place {
  id: string;
  name: string;
  keywords: string;
  locality?: string; // clădirile din raioane: doar la știrile din acel raion
  photos: { url: string; credit: string; source: string }[];
}

export function loadPlaces(): Place[] {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "content", "locuri", "locuri.json"), "utf8"));
  } catch {
    return [];
  }
}

// Rotație: `recent` = pozele ultimelor articole, cele mai noi primele. Se
// alege poza locului folosită cel mai demult (sau niciodată); dacă toate au
// apărut în ultimele NEIGHBOURS articole, nu se folosește locul — altfel două
// știri diferite stau alăturate cu aceeași poză (2026-10-04). Lista se
// actualizează pe loc, ca rulările paralele să nu aleagă aceeași poză.
const NEIGHBOURS = 12;

export function pickRotated(photos: { url: string; credit: string }[], recent: string[]) {
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
): Promise<{ url: string; credit: string } | null> {
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
    return p && { url: p.url, credit: p.credit };
  } catch {
    return null;
  }
}
