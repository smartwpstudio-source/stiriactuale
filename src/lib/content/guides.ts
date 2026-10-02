import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Ghiduri evergreen (diaspora, acte, ajutoare, sănătate...) — fișiere JSON în
// content/ghiduri/, scrise de sesiuni Claude Code în cloud și aprobate de
// editor prin Pull Request. Citite DOAR la build (paginile sunt statice), deci
// nu depind de baza de date. Validare: npm run check:content.

export const GUIDE_CATEGORIES = {
  diaspora: "Diaspora",
  acte: "Acte și documente",
  bani: "Bani, pensii și ajutoare",
  sanatate: "Sănătate",
  auto: "Auto și transport",
  afaceri: "Afaceri și muncă",
  educatie: "Educație",
  siguranta: "Siguranță și drepturi",
  dosare: "Dosare: subiectele mari",
  orase: "Orașe: contacte utile",
} as const;

export type GuideCategory = keyof typeof GUIDE_CATEGORIES;

export interface Guide {
  slug: string;
  title: string;
  description: string; // 140-160 caractere, meta description
  category: GuideCategory;
  updated: string; // AAAA-LL-ZZ — data verificării informațiilor
  sources: { name: string; url: string }[]; // surse oficiale consultate
  bodyHtml: string;
  faq?: { q: string; a: string }[];
}

const DIR = path.join(process.cwd(), "content", "ghiduri");

export async function getGuides(): Promise<Guide[]> {
  const files = (await readdir(DIR).catch(() => [])).filter((f) => f.endsWith(".json"));
  const guides = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(path.join(DIR, f), "utf8")) as Guide),
  );
  return guides.sort((a, b) => a.title.localeCompare(b.title, "ro"));
}

export async function getGuide(slug: string): Promise<Guide | undefined> {
  return (await getGuides()).find((g) => g.slug === slug);
}
