// Generează tabelul final old_slug -> new_url pe baza exportului WP real și a regulilor
// de taxonomie din lib/taxonomy-map.ts. Scrie:
//   - scripts/migration/data/redirects.json + .csv -- tabel complet, pentru audit/revizuire
//   - src/data/legacy-redirects.json               -- hartă slimă (slug -> url), citită de proxy.ts la runtime
//   - src/data/legacy-categories.json              -- /category/{slug}/ -> hub nou, citită de proxy.ts
//
// Rulare: npm run migrate:redirects

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WpCategory, WpPost } from "./lib/wp-types";
import { classifyPost, buildNewUrl, DIASPORA_GENERIC_SLUG } from "./lib/taxonomy-map";

const DATA_DIR = path.join(import.meta.dirname, "data");
const SRC_DATA_DIR = path.join(import.meta.dirname, "..", "..", "src", "data");

interface RedirectRow {
  oldSlug: string;
  oldUrl: string;
  newUrl: string;
  section: string;
  locality?: string;
  country?: string;
  topics: string[];
  fallbackApplied: boolean;
}

async function main() {
  const { categories } = JSON.parse(
    await readFile(path.join(DATA_DIR, "wp-categories.json"), "utf-8"),
  ) as { categories: WpCategory[] };
  const { posts } = JSON.parse(
    await readFile(path.join(DATA_DIR, "wp-posts.json"), "utf-8"),
  ) as { posts: WpPost[] };

  const catSlugById = new Map(categories.map((c) => [c.id, c.slug]));

  const rows: RedirectRow[] = [];
  const seenSlugs = new Map<string, number>();
  let duplicateSlugCount = 0;

  for (const post of posts) {
    if (seenSlugs.has(post.slug)) {
      duplicateSlugCount++;
      console.warn(
        `ATENTIE: slug duplicat "${post.slug}" -- postID ${post.id} si ${seenSlugs.get(post.slug)}`,
      );
    }
    seenSlugs.set(post.slug, post.id);

    const categorySlugs = post.categories
      .map((id) => catSlugById.get(id))
      .filter((s): s is string => Boolean(s));

    const classification = classifyPost(categorySlugs);
    const newUrl = buildNewUrl(classification, post.slug);

    rows.push({
      oldSlug: post.slug,
      oldUrl: `/${post.slug}/`,
      newUrl,
      section: classification.section,
      locality: classification.locality,
      country: classification.country,
      topics: classification.topics,
      fallbackApplied: classification.fallbackApplied,
    });
  }

  await writeFile(
    path.join(DATA_DIR, "redirects.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), count: rows.length, rows }, null, 2),
  );

  const csvHeader = "old_slug,new_url,section,locality,country,topics,fallback\n";
  const csvBody = rows
    .map((r) =>
      [
        r.oldSlug,
        r.newUrl,
        r.section,
        r.locality ?? "",
        r.country ?? "",
        r.topics.join("|"),
        r.fallbackApplied ? "1" : "0",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  await writeFile(path.join(DATA_DIR, "redirects.csv"), csvHeader + csvBody);

  const slimMap: Record<string, string> = {};
  for (const r of rows) slimMap[r.oldSlug] = r.newUrl;
  await mkdir(SRC_DATA_DIR, { recursive: true });
  await writeFile(
    path.join(SRC_DATA_DIR, "legacy-redirects.json"),
    JSON.stringify(slimMap),
  );

  // Categoria WP -> pagina nouă echivalentă (raion, țară, secțiune, subiect).
  // Categoriile fără echivalent lipsesc din hartă -> proxy trimite pe prima pagină.
  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const cl = classifyPost([c.slug]);
    if (cl.locality) categoryMap[c.slug] = `/regiuni/${cl.locality}/`;
    else if (cl.country) categoryMap[c.slug] = `/diaspora/${cl.country}/`;
    else if (c.slug === DIASPORA_GENERIC_SLUG) categoryMap[c.slug] = "/diaspora/";
    else if (!cl.fallbackApplied) categoryMap[c.slug] = `/${cl.section}/`;
    else if (cl.topics[0]) categoryMap[c.slug] = `/subiect/${cl.topics[0]}/`;
  }
  await writeFile(path.join(SRC_DATA_DIR, "legacy-categories.json"), JSON.stringify(categoryMap));
  console.log(`Categorii WP mapate: ${Object.keys(categoryMap).length} din ${categories.length}`);

  const bySection = new Map<string, number>();
  let fallbackCount = 0;
  for (const r of rows) {
    bySection.set(r.section, (bySection.get(r.section) ?? 0) + 1);
    if (r.fallbackApplied) fallbackCount++;
  }

  console.log(`\n=== Tabel redirect-uri generat: ${rows.length} rânduri ===`);
  for (const [section, count] of bySection) console.log(`  ${section}: ${count}`);
  console.log(`  (din care fallback /national/ fără categorie de secțiune: ${fallbackCount})`);
  console.log(`  slug-uri duplicate detectate: ${duplicateSlugCount}`);
  console.log(`\nScris: ${path.join(DATA_DIR, "redirects.json")}`);
  console.log(`Scris: ${path.join(DATA_DIR, "redirects.csv")}`);
  console.log(`Scris: ${path.join(SRC_DATA_DIR, "legacy-redirects.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
