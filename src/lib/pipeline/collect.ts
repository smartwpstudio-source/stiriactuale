import { and, eq, lt } from "drizzle-orm";
import { getDb } from "./db/client";
import { candidates } from "./db/schema";
import { fetchAllSources } from "./sources";
import { updateTelegramSignals } from "./telegram-signal";

const MAX_ITEM_AGE_HOURS = 24;
const KEEP_DAYS = 7;

// RSS -> tabelul candidates, fără AI. Rulează la 30 de minute (cron Vercel)
// și la începutul fiecărei generări, ca rezervă. Idempotent: URL-ul e unic.
export async function collectCandidates() {
  const db = getDb();
  const { candidates: fetched, failedFeeds } = await fetchAllSources();
  const minDate = Date.now() - MAX_ITEM_AGE_HOURS * 3600_000;

  const rows = fetched
    .filter((c) => c.title && c.sourceUrl && c.publishedAt.getTime() > minDate)
    // pubDate în viitor (fus orar greșit al feed-ului) -> acum
    .map((c) => ({
      url: c.sourceUrl,
      title: c.title,
      summary: c.summary,
      sourceName: c.sourceName,
      feedId: c.feedId,
      publishedAt: c.publishedAt.getTime() > Date.now() ? new Date() : c.publishedAt,
    }));

  const inserted = rows.length
    ? await db.insert(candidates).values(rows).onConflictDoNothing().returning({ id: candidates.id })
    : [];

  await db
    .delete(candidates)
    .where(and(lt(candidates.publishedAt, new Date(Date.now() - KEEP_DAYS * 86400_000)), eq(candidates.manual, false)));

  const telegram = await updateTelegramSignals();
  return { fetched: fetched.length, inserted: inserted.length, failedFeeds, telegram };
}
