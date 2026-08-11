// Promovează un articol din "draft" în "published" după review manual —
// vezi plan-implementare-agregator-stiri-ai.md secțiunea 3.8.
//
// Rulare: npm run articles:publish -- <id>

import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { eq } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";

async function main() {
  const idArg = process.argv[2];
  const id = Number(idArg);
  if (!idArg || Number.isNaN(id)) {
    console.error("Folosire: npm run articles:publish -- <id>");
    console.error("Vezi id-urile disponibile cu: npm run articles:list-drafts");
    process.exit(1);
  }

  const db = getDb();
  const [row] = await db
    .update(articles)
    .set({ status: "published" })
    .where(eq(articles.id, id))
    .returning({ id: articles.id, title: articles.title, slug: articles.slug });

  if (!row) {
    console.error(`Niciun articol cu id ${id}.`);
    process.exit(1);
  }

  console.log(`Publicat: [${row.id}] ${row.title} (${row.slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
