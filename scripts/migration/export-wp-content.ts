// Exportă conținutul complet al articolelor WordPress (text, rezumat, date,
// imagine reprezentativă) pentru importul arhivei. Doar citire, prin API-ul
// public WP, cu pauză între cereri ca să nu încarce serverul live.
// Scrie scripts/migration/data/wp-content.json (gitignored — ~20 MB).
//
// Rulare: npm run migrate:export-content

import { writeFile } from "node:fs/promises";
import path from "node:path";

const SITE = "https://stiriactuale.info";
const HEADERS = { "User-Agent": "Mozilla/5.0 (stiriactuale-migration-script)" };
const OUT = path.join(import.meta.dirname, "data", "wp-content.json");
const PAUSE_MS = 1000;

export interface WpContentPost {
  id: number;
  slug: string;
  date_gmt: string;
  modified_gmt: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  categories: number[];
  featured?: { url: string; alt: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get<T>(url: string): Promise<{ data: T; totalPages: number }> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60_000) });
    if (res.ok) return { data: (await res.json()) as T, totalPages: Number(res.headers.get("X-WP-TotalPages") ?? 1) };
    if (attempt === 3) throw new Error(`HTTP ${res.status}: ${url}`);
    await sleep(5000 * attempt);
  }
}

async function main() {
  const fields = "id,slug,date_gmt,modified_gmt,title,excerpt,content,featured_media,categories";
  const posts: WpContentPost[] = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const r = await get<WpContentPost[]>(`${SITE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=${fields}`);
    totalPages = r.totalPages;
    posts.push(...r.data);
    console.log(`articole: pagina ${page}/${totalPages} (${posts.length})`);
    await sleep(PAUSE_MS);
  }

  const mediaIds = [...new Set(posts.map((p) => p.featured_media).filter(Boolean))];
  const media = new Map<number, { url: string; alt: string }>();
  for (let i = 0; i < mediaIds.length; i += 100) {
    const ids = mediaIds.slice(i, i + 100).join(",");
    const r = await get<{ id: number; source_url: string; alt_text: string }[]>(
      `${SITE}/wp-json/wp/v2/media?include=${ids}&per_page=100&_fields=id,source_url,alt_text`,
    );
    for (const m of r.data) media.set(m.id, { url: m.source_url, alt: m.alt_text });
    console.log(`imagini reprezentative: ${media.size}/${mediaIds.length}`);
    await sleep(PAUSE_MS);
  }
  for (const p of posts) p.featured = media.get(p.featured_media);

  await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), count: posts.length, posts }));
  console.log(`Scris: ${OUT} — ${posts.length} articole, ${media.size} imagini reprezentative`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
