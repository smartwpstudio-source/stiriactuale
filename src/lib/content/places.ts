import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Informații practice pentru paginile de raion și de țară (contacte utile:
// Poliție, spital, primărie, consulat...). JSON în content/locuri/, scris și
// verificat la fel ca ghidurile. Lipsa fișierului = pagina rămâne doar listă.

export interface PlaceInfo {
  intro?: string; // 1-3 propoziții despre raion/țară, din surse
  updated: string; // AAAA-LL-ZZ
  sources: { name: string; url: string }[];
  blocks: {
    title: string; // ex. "Urgențe", "Autorități locale", "Consulate"
    items: { name: string; phone?: string; address?: string; url?: string; note?: string }[];
  }[];
}

export async function listPlaces(kind: "raioane" | "tari"): Promise<string[]> {
  const files = await readdir(path.join(process.cwd(), "content", "locuri", kind)).catch(() => []);
  return files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
}

export async function getPlaceInfo(kind: "raioane" | "tari", slug: string): Promise<PlaceInfo | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "content", "locuri", kind, `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}
