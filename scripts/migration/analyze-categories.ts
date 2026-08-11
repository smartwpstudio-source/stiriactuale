// Analiză exploratorie a categoriilor WP reale față de taxonomia țintă (4 secțiuni + 10 subiecte).
// Nu scrie nimic — doar raportează, ca bază de discuție înainte de scriptul final de mapare.
//
// Rulare: npx tsx scripts/migration/analyze-categories.ts

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WpCategory, WpPost } from "./lib/wp-types";

const DATA_DIR = path.join(import.meta.dirname, "data");

const RAION_SLUGS = new Set([
  "stiri-drochia", "stiri-soroca", "stiri-edinet", "stiri-riscani", "stiri-falesti",
  "stiri-orhei", "stiri-briceni", "stiri-floresti", "stiri-donduseni", "stiri-straseni",
  "stiri-singerei", "stiri-sangerei", "stiri-telenesti", "stiri-cahul", "stiri-causeni",
  "stiri-ocnita", "stiri-anenii-noi", "stiri-glodeni", "stiri-stefan-voda", "stiri-criuleni",
  "stiri-soldanesti", "stiri-chisinau", "stiri-ialoveni", "stiri-ungheni", "stiri-balti",
  "stiri-cimislia", "stiri-hincesti", "stiri-hancesti", "stiri-leova", "stiri-nisporeni",
  "stiri-rezina", "stiri-calarasi", "stiri-cantemir", "stiri-dubasari",
]);

const NATIONAL_SLUGS = new Set(["stiri-moldova", "stiri-romania", "romania"]);
const INTERNATIONAL_SLUGS = new Set(["stiri-externe", "razboi-in-ucraina", "stiri-ucraina"]);
const DIASPORA_SLUGS = new Set(["diaspora", "stiri-italia", "stiri-franta"]);

const TOPIC_MAP: Record<string, string> = {
  "accidente": "accidente",
  "criminal": "criminal",
  "coruptie": "coruptie",
  "alerta-112": "alerta-112",
  "economic": "economic",
  "criza-energetica": "criza-energetica",
  "sanatate": "sanatate",
  "social": "social",
  "cultura": "cultura",
  "stiri-sportive": "sport",
};

async function main() {
  const { categories } = JSON.parse(
    await readFile(path.join(DATA_DIR, "wp-categories.json"), "utf-8"),
  ) as { categories: WpCategory[] };
  const { posts } = JSON.parse(
    await readFile(path.join(DATA_DIR, "wp-posts.json"), "utf-8"),
  ) as { posts: WpPost[] };

  const catById = new Map(categories.map((c) => [c.id, c]));

  const known = new Set([
    ...RAION_SLUGS, ...NATIONAL_SLUGS, ...INTERNATIONAL_SLUGS, ...DIASPORA_SLUGS,
    ...Object.keys(TOPIC_MAP), "transnistria", "gagauzia",
  ]);
  const unmapped = categories.filter((c) => !known.has(c.slug));
  console.log(`\n=== Categorii NEmapate pe cele 2 axe (${unmapped.length}/${categories.length}) ===`);
  for (const c of unmapped.sort((a, b) => b.count - a.count)) {
    console.log(`  ${c.count.toString().padStart(5)}  ${c.name} (${c.slug})`);
  }

  let noSection = 0;
  let raion = 0, national = 0, international = 0, diaspora = 0;
  let multiSectionConflict = 0;
  const noSectionSamples: WpPost[] = [];
  const conflictSamples: { post: WpPost; sections: string[] }[] = [];
  let onlyUnmappedCats = 0;

  for (const post of posts) {
    const slugs = post.categories.map((id) => catById.get(id)?.slug).filter(Boolean) as string[];
    const hasRaion = slugs.some((s) => RAION_SLUGS.has(s) || s === "transnistria" || s === "gagauzia");
    const hasNational = slugs.some((s) => NATIONAL_SLUGS.has(s));
    const hasIntl = slugs.some((s) => INTERNATIONAL_SLUGS.has(s));
    const hasDiaspora = slugs.some((s) => DIASPORA_SLUGS.has(s));

    const sections: string[] = [];
    if (hasRaion) sections.push("regiuni");
    if (hasDiaspora) sections.push("diaspora");
    if (hasNational) sections.push("national");
    if (hasIntl) sections.push("international");

    if (sections.length === 0) {
      noSection++;
      if (noSectionSamples.length < 8) noSectionSamples.push(post);
      if (slugs.every((s) => !known.has(s))) onlyUnmappedCats++;
    } else {
      if (sections.length > 1) {
        multiSectionConflict++;
        if (conflictSamples.length < 8) conflictSamples.push({ post, sections });
      }
      // ladder rule: raion > national/diaspora ambiguity ignored here, just tally primary per brief order
      if (hasRaion) raion++;
      else if (hasDiaspora) diaspora++;
      else if (hasNational) national++;
      else if (hasIntl) international++;
    }
  }

  console.log(`\n=== Distribuție secțiune primară (din ${posts.length} articole) ===`);
  console.log(`  regiuni:        ${raion}`);
  console.log(`  national:       ${national}`);
  console.log(`  international:  ${international}`);
  console.log(`  diaspora:       ${diaspora}`);
  console.log(`  FARA sectiune:  ${noSection}  (din care doar categorii nemapate: ${onlyUnmappedCats})`);
  console.log(`  conflict multi-sectiune (are 2+ axe simultan): ${multiSectionConflict}`);

  console.log(`\n=== Exemple articole FARA secțiune determinabilă ===`);
  for (const p of noSectionSamples) {
    const names = p.categories.map((id) => catById.get(id)?.name).join(", ");
    console.log(`  [${p.id}] ${p.slug}\n      categorii: ${names}`);
  }

  console.log(`\n=== Exemple articole cu conflict multi-secțiune ===`);
  for (const { post, sections } of conflictSamples) {
    const names = post.categories.map((id) => catById.get(id)?.name).join(", ");
    console.log(`  [${post.id}] ${post.slug} -> ${sections.join(" + ")}\n      categorii: ${names}`);
  }

  // Diaspora fără țară
  const diasporaCatId = categories.find((c) => c.slug === "diaspora")?.id;
  const countrySlugsIds = new Set(
    categories.filter((c) => DIASPORA_SLUGS.has(c.slug) && c.slug !== "diaspora").map((c) => c.id),
  );
  let diasporaNoCountry = 0;
  for (const post of posts) {
    if (diasporaCatId && post.categories.includes(diasporaCatId)) {
      const hasCountry = post.categories.some((id) => countrySlugsIds.has(id));
      if (!hasCountry) diasporaNoCountry++;
    }
  }
  console.log(`\n=== Diaspora fără categorie de țară: ${diasporaNoCountry} articole ===`);

  // "Stiri actuale" catch-all co-occurrence
  const stiriActualeCat = categories.find((c) => c.slug === "stiri-actuale");
  if (stiriActualeCat) {
    let alone = 0;
    for (const post of posts) {
      if (post.categories.includes(stiriActualeCat.id) && post.categories.length === 1) alone++;
    }
    console.log(`\n=== "Stiri actuale" (id ${stiriActualeCat.id}, ${stiriActualeCat.count} posts) — articole cu DOAR această categorie: ${alone} ===`);
  }

  // Duplicate-spelling raion categories
  console.log(`\n=== Perechi de categorii-raion cu grafie dublă (verifică overlap) ===`);
  for (const [a, b] of [["stiri-singerei", "stiri-sangerei"], ["stiri-hincesti", "stiri-hancesti"]]) {
    const ca = categories.find((c) => c.slug === a);
    const cb = categories.find((c) => c.slug === b);
    console.log(`  ${a} (${ca?.count ?? 0}) vs ${b} (${cb?.count ?? 0})`);
  }
}

main();
