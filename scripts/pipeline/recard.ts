// O singură dată (2026-10-27): articolele din ultimele 14 zile cu poză de stoc sau
// generată (AI) despre state, politicieni, instituții primesc cardul cu steaguri
// (src/lib/pipeline/flag-card.ts). Rulează în GitHub Actions (recard.yml); fără
// „--aplica” doar afișează ce ar schimba.
import { and, eq, gte, isNull, or, ilike, isNotNull } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";
import { HAIKU_MODEL, structured } from "../../src/lib/pipeline/llm";
import { SCHEMA } from "../../src/lib/pipeline/generate";
import { flagCardImage } from "../../src/lib/pipeline/flag-card";
import { requestRevalidate } from "../../src/lib/revalidate";

const { card_eticheta, card_tari } = SCHEMA.properties;

(async () => {
  const apply = process.argv.includes("--aplica");
  const since = new Date().toISOString();
  const db = getDb();
  const rows = await db
    .select({ id: articles.id, slug: articles.slug, title: articles.title, lead: articles.leadText, url: articles.imageUrl })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        isNull(articles.wpId),
        gte(articles.publishedAt, new Date(Date.now() - 14 * 86400_000)),
        // doar pozele alese automat: stocul (resourceId) sau cele generate
        or(isNotNull(articles.imageResourceId), ilike(articles.imageUrl, "%/articole/ai-%")),
      ),
    );
  console.log(`${rows.length} articole cu stoc / AI`);
  let changed = 0;
  for (const r of rows) {
    const { card_eticheta: label, card_tari: tari } = await structured<{ card_eticheta: string; card_tari: string[] }>({
      model: HAIKU_MODEL,
      system: "Decizi dacă știrea primește card în loc de poză. Răspunzi doar cu câmpurile cerute.",
      prompt: `${r.title}\n\n${r.lead}`,
      schema: { type: "object", properties: { card_eticheta, card_tari }, required: ["card_eticheta", "card_tari"] },
      maxBudgetUsd: 0.05,
    }).catch(() => ({ card_eticheta: "", card_tari: [] as string[] }));
    if (!label.trim()) continue;
    console.log(`${r.slug}: ${label} [${tari.join(", ")}]`);
    changed++;
    if (!apply) continue;
    const img = await flagCardImage(tari.map((t) => t.toLowerCase()), label.trim().slice(0, 40), r.slug);
    await db
      .update(articles)
      .set({ imageUrl: img.url, imageResourceId: null, imageCredit: img.credit, imageAltText: img.alt, updatedAt: new Date() })
      .where(eq(articles.id, r.id));
  }
  console.log(`${changed} ${apply ? "schimbate" : "de schimbat"}`);
  if (apply && changed) console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
})();
