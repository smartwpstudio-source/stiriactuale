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
  photos: { url: string; credit: string; source: string }[];
}

export function loadPlaces(): Place[] {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "content", "locuri", "locuri.json"), "utf8"));
  } catch {
    return [];
  }
}

export async function matchPlacePhoto(subject: string, places: Place[]): Promise<{ url: string; credit: string } | null> {
  if (!places.length) return null;
  try {
    const { match } = await structured<{ match: number }>({
      model: HAIKU_MODEL,
      system:
        "Alegi poza unui loc real pentru o știre. Răspunzi cu numărul locului doar dacă știrea e despre ACEL loc sau instituție (evenimentul s-a petrecut acolo, ori instituția e actorul principal), altfel -1. Locurile generice (vie, lan, sat, școală) doar dacă știrea chiar e despre ele, nu dacă sunt doar decorul. În caz de dubiu: -1.",
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
