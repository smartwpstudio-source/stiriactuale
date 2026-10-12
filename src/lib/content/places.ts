import { listContent, readContent } from "./store";
import { guideCountry } from "./guide-country";

// Informații practice pentru paginile de raion și de țară (contacte utile:
// Poliție, spital, primărie, consulat...). JSON în content/locuri/, scris și
// verificat la fel ca ghidurile. Lipsa fișierului = pagina rămâne doar listă.
// Varianta rusă: content/locuri-ru/ — același slug, aceleași telefoane și URL-uri
// (verificat în scripts/checks/content.ts), afișată pe ghidurile /ru/.

export interface PlaceInfo {
  intro?: string; // 1-3 propoziții despre raion/țară, din surse
  updated: string; // AAAA-LL-ZZ
  sources: { name: string; url: string }[];
  blocks: {
    title: string; // ex. "Urgențe", "Autorități locale", "Consulate"
    items: { name: string; phone?: string; address?: string; url?: string; note?: string }[];
  }[];
}

export type PlaceKind = "raioane" | "tari";

export function listPlaces(kind: PlaceKind): Promise<string[]> {
  return listContent(`locuri/${kind}`);
}

export async function getPlaceInfo(kind: PlaceKind, slug: string, lang: "ro" | "ru" = "ro"): Promise<PlaceInfo | null> {
  return (await readContent<PlaceInfo>(`${lang === "ru" ? "locuri-ru" : "locuri"}/${kind}`, slug)) ?? null;
}

// Raionul / țara unui ghid, după slug: ghidurile de oraș „<raion>-primaria-…”
// (Comrat -> Găgăuzia) și ghidurile din diaspora cu o singură țară.
export function guidePlace(slug: string, category: string): { kind: PlaceKind; slug: string } | null {
  if (category === "orase") {
    const m = slug.match(/^(.+)-primaria-spitalul-asp-transportul$/);
    return m ? { kind: "raioane", slug: m[1] === "comrat" ? "gagauzia" : m[1] } : null;
  }
  if (category === "diaspora") {
    const country = guideCountry(slug);
    return country ? { kind: "tari", slug: country } : null;
  }
  return null;
}
