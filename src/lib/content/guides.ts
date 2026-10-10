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
  orase: "Orașe și raioane: contacte utile",
  costuri: "Cât costă în Moldova",
  explicat: "Explicat simplu",
  sarbatori: "Sărbători și tradiții",
  calatorii: "Călătorii din Moldova",
  lumea: "Lumea: dosare",
  gospodarie: "Gospodărie, grădină și vie",
  bucatarie: "Bucătăria moldovenească",
  turism: "Moldova turistică",
  animale: "Animalul de companie",
  casa: "Casa și blocul",
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

// Citite o dată pe proces în producție (fișierele nu se schimbă între deploy-uri):
// sute de ghiduri deschise în paralel, de mai multe ori pe pagină, depășeau
// limita de fișiere deschise pe Vercel (EMFILE → 500, 2026-10-09).
let cache: Promise<Guide[]> | undefined;

export function getGuides(): Promise<Guide[]> {
  if (process.env.NODE_ENV !== "production") return loadGuides();
  return (cache ??= loadGuides().catch((e) => ((cache = undefined), Promise.reject(e))));
}

async function loadGuides(): Promise<Guide[]> {
  const files = (await readdir(DIR).catch(() => [])).filter((f) => f.endsWith(".json"));
  const guides: Guide[] = [];
  for (const f of files) guides.push(JSON.parse(await readFile(path.join(DIR, f), "utf8")) as Guide);
  return guides.sort((a, b) => a.title.localeCompare(b.title, "ro"));
}

export async function getGuide(slug: string): Promise<Guide | undefined> {
  return (await getGuides()).find((g) => g.slug === slug);
}
