// Listează articolele în așteptare de review manual (status "draft") —
// vezi plan-implementare-agregator-stiri-ai.md secțiunea 3.8: primele
// 2-4 săptămâni, verificare manuală înainte de auto-publish.
//
// Rulare: npm run articles:list-drafts

import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { desc, eq } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";

async function main() {
  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "draft"))
    .orderBy(desc(articles.qualityScore));

  if (rows.length === 0) {
    console.log("Niciun draft în așteptare.");
    return;
  }

  console.log(`${rows.length} draft(uri) în așteptare:\n`);
  for (const row of rows) {
    const loc = row.locality ? `/${row.locality}` : row.country ? `/${row.country}` : "";
    console.log(`[${row.id}] scor ${row.qualityScore} — ${row.section}${loc} — ${row.title}`);
    console.log(`      slug: ${row.slug} | surse: ${row.sourceCount} | topics: ${(row.topics as string[]).join(",") || "-"}`);
    console.log(`      lead: ${row.leadText.slice(0, 140)}${row.leadText.length > 140 ? "..." : ""}\n`);
  }
  console.log(`Promovează cu: npm run articles:publish -- <id>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
