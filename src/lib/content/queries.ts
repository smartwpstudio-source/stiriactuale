import { and, count, desc, eq, gt, gte, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles as t } from "@/lib/pipeline/db/schema";
import type { Article, Section, Topic } from "./types";
import { youtubeThumb } from "@/lib/video";

// Doar articole "published" — draft-urile stau în /admin. Listele nu citesc
// corpul articolului (bodyHtml): cu arhiva WordPress sunt mii de rânduri, iar
// o listă are nevoie doar de titlu, dată, imagine.

export const PAGE_SIZE = 24; // se împarte la 2 și 3 coloane

const listColumns = {
  slug: t.slug,
  title: t.title,
  leadText: t.leadText,
  section: t.section,
  locality: t.locality,
  country: t.country,
  topics: t.topics,
  publishedAt: t.publishedAt,
  sourceCount: t.sourceCount,
  imageUrl: t.imageUrl,
  imageAltText: t.imageAltText,
  sources: t.sources,
  archived: t.archived,
  videoUrl: t.videoUrl,
};

type ListRow = { [K in keyof typeof listColumns]: (typeof t.$inferSelect)[K] };

function mapRow(row: ListRow & { bodyHtml?: string }): Article {
  return {
    slug: row.slug,
    title: row.title,
    lead: row.leadText,
    bodyHtml: row.bodyHtml ?? "",
    section: row.section,
    locality: row.locality ?? undefined,
    country: row.country ?? undefined,
    topics: (row.topics as Topic[]) ?? [],
    publishedAt: row.publishedAt.toISOString(),
    sourceCount: row.sourceCount,
    // cu video YouTube în sursă: captura din video, nu poza de stock
    imageUrl: youtubeThumb(row.videoUrl) ?? row.imageUrl ?? undefined,
    imageAlt: row.imageAltText ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    sources: row.sources,
    archived: row.archived,
  };
}

export interface ArticleFilter {
  section?: Section;
  locality?: string;
  country?: string;
  topic?: Topic;
  q?: string;
  includeArchived?: boolean; // doar căutarea — arhiva preluată nu apare în liste
}

function where(f: ArticleFilter): SQL {
  const c: SQL[] = [eq(t.status, "published")];
  if (!f.includeArchived) c.push(eq(t.archived, false));
  if (f.section) c.push(eq(t.section, f.section));
  if (f.locality) c.push(eq(t.locality, f.locality));
  if (f.country) c.push(eq(t.country, f.country));
  if (f.topic) c.push(sql`${t.topics} @> ${JSON.stringify([f.topic])}::jsonb`);
  if (f.q) {
    // unaccent: "chisinau" găsește "Chișinău". ponytail: scanare secvențială,
    // ok la câteva mii de rânduri; index trigram dacă arhiva crește mult.
    const pattern = `%${f.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    c.push(sql`(unaccent(${t.title}) ILIKE unaccent(${pattern}) OR unaccent(${t.leadText}) ILIKE unaccent(${pattern}))`);
  }
  return and(...c)!;
}

export async function listArticles(f: ArticleFilter, page = 1, pageSize = PAGE_SIZE) {
  const db = getDb();
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(listColumns)
      .from(t)
      .where(where(f))
      .orderBy(desc(t.publishedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(t).where(where(f)),
  ]);
  return { items: rows.map(mapRow), total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getLatestArticle(): Promise<Article | null> {
  return (await listArticles({}, 1, 1)).items[0] ?? null;
}

// Știrea din prim-plan — trebuie să se schimbe odată cu știrile (cea mai
// importantă din ultimele 12 ore ținea sus o știre de dimineață până seara):
//  1. fixată de editor în /admin (featuredUntil în viitor);
//  2. cea mai nouă marcată pentru notificare (interes național) din ultimele 6 ore;
//  3. cea mai nouă importantă (scor ≥ 65) din ultimele 6 ore;
//  4. cea mai nouă.
const HERO_MIN_SCORE = 65;

export async function getHeroArticle(): Promise<Article | null> {
  const now = new Date();
  const since = new Date(now.getTime() - 6 * 3600_000);
  const newest = (cond: SQL) =>
    getDb().select(listColumns).from(t).where(and(where({}), cond)).orderBy(desc(t.publishedAt)).limit(1);
  for (const cond of [
    gt(t.featuredUntil, now),
    and(eq(t.pushWorthy, true), gte(t.publishedAt, since))!,
    and(gte(t.qualityScore, HERO_MIN_SCORE), gte(t.publishedAt, since))!,
  ]) {
    const [row] = await newest(cond);
    if (row) return mapRow(row);
  }
  return getLatestArticle();
}

// "Cele mai citite" — afișări pe site (ViewBeacon), articole din ultimele 48 de ore.
export async function getMostRead(limit = 5): Promise<Article[]> {
  const rows = await getDb()
    .select(listColumns)
    .from(t)
    .where(and(where({}), gte(t.publishedAt, new Date(Date.now() - 48 * 3600_000)), gt(t.views, 0)))
    .orderBy(desc(t.views))
    .limit(limit);
  return rows.map(mapRow);
}

export async function getArticleBySection(
  section: Section,
  slug: string,
  locality?: string,
  country?: string,
): Promise<Article | undefined> {
  const c = [eq(t.status, "published"), eq(t.section, section), eq(t.slug, slug)];
  if (locality !== undefined) c.push(eq(t.locality, locality));
  if (country !== undefined) c.push(eq(t.country, country));
  const [row] = await getDb()
    .select({ ...listColumns, bodyHtml: t.bodyHtml })
    .from(t)
    .where(and(...c))
    .limit(1);
  return row ? mapRow(row) : undefined;
}

// Același subiect sau, pentru regiuni/diaspora, același raion/țară.
export async function getSimilarArticles(article: Article, limit = 3): Promise<Article[]> {
  const related: SQL[] = [];
  for (const topic of article.topics) related.push(sql`${t.topics} @> ${JSON.stringify([topic])}::jsonb`);
  if (article.locality) related.push(eq(t.locality, article.locality));
  if (article.country) related.push(eq(t.country, article.country));
  if (!related.length) related.push(eq(t.section, article.section));

  const rows = await getDb()
    .select(listColumns)
    .from(t)
    .where(and(where({}), ne(t.slug, article.slug), or(...related)))
    .orderBy(desc(t.publishedAt))
    .limit(limit);
  return rows.map(mapRow);
}

// Câte articole are fiecare raion/țară — hub-urile goale primesc noindex,
// ies din sitemap și din filtre.
export async function getHubCounts() {
  const rows = await getDb()
    .select({ locality: t.locality, country: t.country, n: count() })
    .from(t)
    .where(where({}))
    .groupBy(t.locality, t.country);
  const localities: Record<string, number> = {};
  const countries: Record<string, number> = {};
  for (const r of rows) {
    if (r.locality) localities[r.locality] = (localities[r.locality] ?? 0) + r.n;
    if (r.country) countries[r.country] = (countries[r.country] ?? 0) + r.n;
  }
  return { localities, countries };
}

export async function getSitemapArticles() {
  return getDb()
    .select({ slug: t.slug, section: t.section, locality: t.locality, country: t.country, publishedAt: t.publishedAt })
    .from(t)
    .where(where({}))
    .orderBy(desc(t.publishedAt));
}
