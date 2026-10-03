// Ștergere de urgență a unor articole: din baza de date, din canalul Telegram
// și de pe pagina de Facebook (aceleași efecte ca butonul „Șterge” din admin).
// Rulează în GitHub Actions (cleanup.yml), unde sunt cheile Telegram/Facebook.
// Folosire: npx tsx scripts/pipeline/delete-articles.ts 123 124 125
import { inArray } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";
import { deleteFromChannel } from "../../src/lib/telegram";
import { deleteFromPage } from "../../src/lib/facebook";

(async () => {
  const ids = process.argv.slice(2).map(Number).filter(Number.isInteger);
  if (!ids.length) throw new Error("niciun id");
  const rows = await getDb()
    .delete(articles)
    .where(inArray(articles.id, ids))
    .returning({ id: articles.id, title: articles.title, tg: articles.telegramMessageId, fb: articles.facebookPostId });
  for (const r of rows) {
    if (r.tg) await deleteFromChannel(r.tg);
    if (r.fb) await deleteFromPage(r.fb);
    console.log(`șters: ${r.id} ${r.title.slice(0, 60)} (tg: ${r.tg ? "da" : "-"}, fb: ${r.fb ? "da" : "-"})`);
  }
  console.log(`total: ${rows.length}`);
  process.exit(0);
})();
