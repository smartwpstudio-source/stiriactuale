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

export async function matchPlacePhoto(
  subject: string,
  all: Place[],
  locality?: string,
): Promise<{ url: string; credit: string } | null> {
  const places = all.filter((p) => !p.locality || p.locality === locality);
  if (!places.length) return null;
  try {
    const { match } = await structured<{ match: number }>({
      model: HAIKU_MODEL,
      system:
        "Alegi poza unui loc real pentru o știre. Poza trebuie să arate SUBIECTUL PRINCIPAL al știrii. Răspunzi cu numărul locului doar dacă subiectul principal ESTE acel loc sau acea instituție (ex. zborurile de pe Aeroportul Chișinău, o decizie a Parlamentului, nivelul Nistrului, cozile la vama Leușeni). Dacă subiectul principal e un obiect sau o întâmplare (o dronă, un accident, un incendiu), locul unde s-a petrecut NU e subiectul: -1. Locurile generice (vie, lan, sat, școală, vreme, poliție, pompieri) doar dacă știrea chiar e despre ele. Graficele de avertizare (cod galben/portocaliu/roșu) doar dacă știrea E acea avertizare, cu același cod și același fenomen. Clădirea unei instituții dintr-un raion (poliția, judecătoria, spitalul) doar dacă instituția aceea e în centrul știrii. În caz de dubiu: -1.",
      prompt: `Știrea: ${subject}\n\nLocuri:\n${places.map((p, i) => `${i}. ${p.name} (${p.keywords})`).join("\n")}`,
      schema: { type: "object", properties: { match: { type: "integer" } }, required: ["match"] },
      maxBudgetUsd: 0.05,
    });
    const photos = places[match]?.photos;
    if (!photos?.length) return null;
    const p = photos[Math.floor(Math.random() * photos.length)]; // mai multe poze per loc: nu mereu aceeași
    return { url: p.url, credit: p.credit };
  } catch {
    return null;
  }
}
