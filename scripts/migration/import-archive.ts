// Importă arhiva WordPress (wp-content.json) în tabelul articles:
//  - articole proprii -> text complet, indexate, cu imaginea reprezentativă
//    (încă pe URL-ul WordPress; upload-images.ts le mută în Blob după Pro);
//  - articole preluate de la alte redacții (încep cu linkul sursei) ->
//    archived: doar primul paragraf + link "Citește la sursă", noindex, fără
//    reclame (decizia proprietarului, 2026-10-01).
// Secțiunea/raionul/țara vin din aceleași reguli ca redirecturile 301
// (taxonomy-map.ts), ca URL-ul nou să coincidă cu cel din legacy-redirects.json.
// Idempotent: upsert pe wp_id.
//
// Rulare: npm run migrate:import

import { config } from "dotenv";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { sql } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";
import { normalizeTitle } from "../../src/lib/pipeline/dedup";
import type { Topic } from "../../src/lib/content/types";
import type { WpContentPost } from "./export-wp-content";
import type { WpCategory } from "./lib/wp-types";
import { classifyPost } from "./lib/taxonomy-map";
import { bodyWithoutLead, copiedSource, firstParagraph, metaDescription, title } from "./lib/wp-archive";

const DATA = path.join(import.meta.dirname, "data");
const BATCH = 200;

// Restul curățeniei (promoții, paragraful-link) se face în bodyWithoutLead.
function cleanBody(html: string): string {
  return html.replace(/\n{3,}/g, "\n\n").trim();
}

async function main() {
  const { posts } = JSON.parse(await readFile(path.join(DATA, "wp-content.json"), "utf8")) as { posts: WpContentPost[] };
  const { categories } = JSON.parse(await readFile(path.join(DATA, "wp-categories.json"), "utf8")) as {
    categories: WpCategory[];
  };
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]));

  const rows = posts.map((p) => {
    const cl = classifyPost(p.categories.map((id) => catSlug.get(id)).filter((s): s is string => !!s));
    const source = copiedSource(p);
    const t = title(p);
    const leadText = firstParagraph(p);
    return {
      wpId: p.id,
      slug: p.slug,
      title: t,
      leadText,
      bodyHtml: source ? "" : cleanBody(bodyWithoutLead(p)),
      metaDescription: metaDescription(leadText),
      section: cl.section,
      locality: cl.locality ?? null,
      country: cl.country ?? null,
      topics: cl.topics as Topic[],
      status: "published" as const,
      archived: !!source,
      normalizedTitleHash: crypto.createHash("sha256").update(normalizeTitle(t)).digest("hex"),
      sourceCount: source ? 1 : 0,
      qualityScore: 0,
      imageUrl: source ? null : (p.featured?.url ?? null),
      imageAltText: source ? null : p.featured?.alt || t,
      sourceUrls: source ? [source.url] : [],
      sources: source ? [source] : [],
      publishedAt: new Date(`${p.date_gmt}Z`),
    };
  });

  const db = getDb();
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db
      .insert(articles)
      .values(rows.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: articles.wpId,
        set: {
          title: sql`excluded.title`,
          leadText: sql`excluded.lead_text`,
          bodyHtml: sql`excluded.body_html`,
          metaDescription: sql`excluded.meta_description`,
          section: sql`excluded.section`,
          locality: sql`excluded.locality`,
          country: sql`excluded.country`,
          topics: sql`excluded.topics`,
          archived: sql`excluded.archived`,
          sources: sql`excluded.sources`,
          sourceUrls: sql`excluded.source_urls`,
          publishedAt: sql`excluded.published_at`,
          // imaginea NU se suprascrie: după upload-images.ts ar reveni la URL-ul WordPress
        },
      });
    done += Math.min(BATCH, rows.length - i);
    console.log(`${done}/${rows.length}`);
  }

  const archived = rows.filter((r) => r.archived).length;
  console.log(`Gata: ${rows.length} articole — ${rows.length - archived} proprii, ${archived} preluate (rezumat + link)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
