// Articolele importate din WordPress cu emoji sau litere chirilice în slug
// (salvate codificat: „%f0%9f%94%b4-provocarea-…”) nu se puteau deschide:
// proxy.ts redirecționează orice adresă ne-ASCII spre varianta ASCII, care nu
// exista în bază. Scriptul trece slug-urile pe varianta ASCII (asciiSlug).
// Rulează în GitHub Actions (fix-slugs.yml); fără „--aplica” doar afișează.
import { sql, eq } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";
import { asciiSlug, isAsciiSlug } from "../../src/lib/ascii-slug";

(async () => {
  const apply = process.argv.includes("--aplica");
  const db = getDb();
  const rows = await db
    .select({ id: articles.id, slug: articles.slug })
    .from(articles)
    .where(sql`${articles.slug} !~ '^[a-z0-9]+(-[a-z0-9]+)*$'`);
  for (const r of rows) {
    let decoded = r.slug;
    try {
      decoded = decodeURIComponent(r.slug);
    } catch {}
    const next = asciiSlug(decoded);
    if (!isAsciiSlug(next)) {
      console.log(`SARIT ${r.id}: „${r.slug}” -> „${next}” nu e valid`);
      continue;
    }
    const taken = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, next));
    if (taken.length) {
      console.log(`SARIT ${r.id}: „${next}” e deja folosit de articolul ${taken[0].id}`);
      continue;
    }
    if (apply) await db.update(articles).set({ slug: next }).where(eq(articles.id, r.id));
    console.log(`${apply ? "schimbat" : "de schimbat"} ${r.id}: ${r.slug} -> ${next}`);
  }
  console.log(`total: ${rows.length}${apply ? "" : " (doar afișare; rulează cu --aplica)"}`);
  process.exit(0);
})();
