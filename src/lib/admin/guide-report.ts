import { and, desc, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles, guideChecks } from "@/lib/pipeline/db/schema";
import { stripDiacritics } from "@/lib/pipeline/text-normalize";

// „Ghiduri care lipsesc” din /admin (regula „știre cu ghid”, guide-rule.ts):
// temele știrilor fără ghid, grupate, cu exemple, și volumul pe zile.
export interface GuideCheckRow {
  createdAt: Date;
  title: string;
  tool: string | null;
  exempt: string | null;
  topic: string | null;
  rejected: boolean;
}

export const NO_PRACTICAL_NEED = "fără nevoie practică";

const dayOf = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Chisinau" }); // AAAA-LL-ZZ
const topicKey = (t: string) =>
  stripDiacritics(t)
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export function missingGuidesReport(checks: GuideCheckRow[], publishedAt: Date[]) {
  const missing = checks.filter((c) => !c.tool && !c.exempt);

  const groups = new Map<string, { topic: string; count: number; examples: string[] }>();
  for (const c of missing) {
    const topic = c.topic?.trim() || "(fără temă)";
    const key = topicKey(topic);
    const g = groups.get(key) ?? { topic, count: 0, examples: [] };
    g.count++;
    if (g.examples.length < 3) g.examples.push(c.title);
    groups.set(key, g);
  }
  const noNeed = topicKey(NO_PRACTICAL_NEED);
  const topics = [...groups.entries()]
    // temele reale întâi, după număr; „fără nevoie practică” la final
    .sort(([ka, a], [kb, b]) => Number(ka === noNeed) - Number(kb === noNeed) || b.count - a.count)
    .map(([, g]) => g);

  const days = new Map<string, { day: string; published: number; checked: number; withoutGuide: number; rejected: number }>();
  const day = (d: Date) => {
    const k = dayOf(d);
    return days.get(k) ?? days.set(k, { day: k, published: 0, checked: 0, withoutGuide: 0, rejected: 0 }).get(k)!;
  };
  for (const d of publishedAt) day(d).published++;
  for (const c of checks) {
    const r = day(c.createdAt);
    r.checked++;
    if (!c.tool && !c.exempt) r.withoutGuide++;
    if (c.rejected) r.rejected++;
  }
  return { topics, days: [...days.values()].sort((a, b) => b.day.localeCompare(a.day)) };
}

// ultimele 7 zile: verificările și articolele pipeline-ului (fără arhiva WordPress)
export async function loadMissingGuidesReport() {
  const since = new Date(Date.now() - 7 * 86400_000);
  const db = getDb();
  const [checks, published] = await Promise.all([
    db.select().from(guideChecks).where(gte(guideChecks.createdAt, since)).orderBy(desc(guideChecks.createdAt)),
    db.select({ createdAt: articles.createdAt }).from(articles).where(and(isNull(articles.wpId), gte(articles.createdAt, since))),
  ]);
  return missingGuidesReport(checks, published.map((a) => a.createdAt));
}
