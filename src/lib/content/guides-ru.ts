import { listContent, readAllContent, readContent } from "./store";
import type { Guide } from "./guides";
import { CALCULATORS } from "@/lib/calculators";

// Ghidurile în rusă (content/ghiduri-ru/<slug>.json): aceeași structură ca
// ghidurile românești, același slug — legătura dintre limbi (hreflang) e slug-ul.
// `ruOnly`: pagină doar în rusă (ex. cetățenia pentru relocanți), fără pereche
// în română. Paginile NU se construiesc la build (cost Vercel): se generează la
// prima vizită și rămân în cache — vezi /ru/ghiduri/[slug].
export type GuideRu = Guide & { ruOnly?: boolean };

// o dată pe proces în producție, citite pe rând (EMFILE — vezi guides.ts)
let cache: Promise<GuideRu[]> | undefined;

export function getGuidesRu(): Promise<GuideRu[]> {
  if (process.env.NODE_ENV !== "production") return loadGuidesRu();
  return (cache ??= loadGuidesRu().catch((e) => ((cache = undefined), Promise.reject(e))));
}

function loadGuidesRu(): Promise<GuideRu[]> {
  return readAllContent<GuideRu>("ghiduri-ru");
}

// un singur fișier (nu toată lista): pagina unui ghid RU se generează la prima vizită
export function getGuideRu(slug: string): Promise<GuideRu | undefined> {
  return readContent<GuideRu>("ghiduri-ru", slug);
}

export async function ruSlugs(): Promise<Set<string>> {
  return new Set(await listContent("ghiduri-ru"));
}

// În textul rusesc, linkurile spre ghidurile românești devin linkuri spre
// varianta rusă, când există — traducătorii lasă linkurile neschimbate.
export function localizeLinks(html: string, ru: Set<string>): string {
  return html
    .replace(/href="\/ghiduri\/([a-z0-9-]+)\/"/g, (m, slug: string) => (ru.has(slug) ? `href="/ru/ghiduri/${slug}/"` : m))
    // modelele de reclamații au toate varianta rusă (/ru/modele-reclamatii/)
    .replace(/href="\/modele-reclamatii\/([a-z0-9-]+\/)?"/g, 'href="/ru/modele-reclamatii/$1"')
    // calculatoarele au toate varianta rusă (/ru/calculatoare/)
    .replace(/href="\/calculatoare\/([a-z0-9-]+)\/"/g, (m, slug: string) => (CALC_SLUGS.has(slug) ? `href="/ru/calculatoare/${slug}/"` : m))
    .replace(/href="\/calculatoare\/"/g, 'href="/ru/calculatoare/"');
}

const CALC_SLUGS = new Set<string>(CALCULATORS.map((c) => c.slug));

export const ruPath = (slug: string) => `/ru/ghiduri/${slug}/`;
