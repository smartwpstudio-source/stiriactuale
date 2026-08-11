// Exportă toate categoriile și articolele publicate de pe stiriactuale.info (WP REST API)
// în fișiere JSON locale, ca bază pentru scriptul de mapare la taxonomia nouă.
//
// Rulare: npm run migrate:export

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WpCategory, WpPost } from "./lib/wp-types";

const SITE = "https://stiriactuale.info";
const PER_PAGE = 100;
const OUT_DIR = path.join(import.meta.dirname, "data");
const USER_AGENT = "Mozilla/5.0 (stiriactuale-migration-script)";

async function fetchAllPages<T>(
  endpoint: string,
  fields: string[],
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${SITE}/wp-json/wp/v2/${endpoint}?per_page=${PER_PAGE}&page=${page}&_fields=${fields.join(",")}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      throw new Error(`${endpoint} page ${page}: HTTP ${res.status}`);
    }
    totalPages = Number(res.headers.get("X-WP-TotalPages") ?? "1");
    const batch = (await res.json()) as T[];
    results.push(...batch);
    console.log(`  ${endpoint}: pagina ${page}/${totalPages} (${results.length} total)`);
    page += 1;
  } while (page <= totalPages);

  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Export categorii...");
  const categories = await fetchAllPages<WpCategory>("categories", [
    "id",
    "name",
    "slug",
    "count",
    "parent",
  ]);

  console.log("Export articole...");
  const posts = await fetchAllPages<WpPost>("posts", [
    "id",
    "date",
    "slug",
    "link",
    "categories",
    "title",
  ]);

  const fetchedAt = new Date().toISOString();

  await writeFile(
    path.join(OUT_DIR, "wp-categories.json"),
    JSON.stringify({ fetchedAt, count: categories.length, categories }, null, 2),
  );
  await writeFile(
    path.join(OUT_DIR, "wp-posts.json"),
    JSON.stringify({ fetchedAt, count: posts.length, posts }, null, 2),
  );

  console.log(`\nGata: ${categories.length} categorii, ${posts.length} articole -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
