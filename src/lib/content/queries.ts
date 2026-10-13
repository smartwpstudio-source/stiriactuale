import { and, count, desc, eq, gt, gte, isNotNull, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles as t } from "@/lib/pipeline/db/schema";
import type { Article, Section, Topic } from "./types";
import type { ImpactType } from "@/lib/impact-types";
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
  imageCredit: t.imageCredit,
  sources: t.sources,
  archived: t.archived,
  videoUrl: t.videoUrl,
  postUrl: t.postUrl,
  kind: t.kind,
  updatedAt: t.updatedAt,
  continuesId: t.continuesId,
  impact: t.impact,
  guideTool: t.guideTool,
};

type ListRow = { [K in keyof typeof listColumns]: (typeof t.$inferSelect)[K] };

function mapRow(row: ListRow & { bodyHtml?: string; hasRu?: boolean }): Article {
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
    // descrierea pozei e doar a editorului (AI-ul nu vede poza); altfel titlul
    imageAlt: row.imageAltText ?? row.title,
    imageDescription: row.imageAltText ?? undefined,
    imageCredit: row.imageCredit ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    postUrl: row.postUrl ?? undefined,
    kind: row.kind,
    updatedAt: row.updatedAt?.toISOString(),
    continuesId: row.continuesId ?? undefined,
    impact: row.impact ?? undefined,
    guideTool: row.guideTool ?? undefined,
    sources: row.sources,
    archived: row.archived,
    hasRu: row.hasRu,
  };
}

export interface ArticleFilter {
  section?: Section;
  locality?: string;
  country?: string;
  topic?: Topic;
  kind?: string; // rubrica Util: articolele proprii (kind = "util")
  video?: boolean; // rubrica Video: articolele cu player (YouTube, Facebook, Telegram)
  q?: string;
  includeArchived?: boolean; // doar căutarea — arhiva preluată nu apare în liste
  impact?: true | ImpactType; // știrile cu blocul „Ce înseamnă pentru tine” (de un tip)
}

function where(f: ArticleFilter): SQL {
  const c: SQL[] = [eq(t.status, "published")];
  if (!f.includeArchived) c.push(eq(t.archived, false));
  if (f.section) c.push(eq(t.section, f.section));
  if (f.locality) c.push(eq(t.locality, f.locality));
  if (f.country) c.push(eq(t.country, f.country));
  if (f.topic) c.push(sql`${t.topics} @> ${JSON.stringify([f.topic])}::jsonb`);
  if (f.kind) c.push(eq(t.kind, f.kind));
  if (f.video) c.push(isNotNull(t.videoUrl));
  if (f.impact === true) c.push(isNotNull(t.impact));
  else if (f.impact) c.push(sql`${t.impact}->>'tip' = ${f.impact}`);
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
    .select({ ...listColumns, bodyHtml: t.bodyHtml, hasRu: sql<boolean>`${t.ru} is not null` })
    .from(t)
    .where(and(...c))
    .limit(1);
  return row ? mapRow(row) : undefined;
}

// Știrile în rusă (/ru/novosti/, /ru/): doar cele publicate, cu traducere.
export async function getRuArticle(slug: string) {
  const [row] = await getDb()
    .select({ ...listColumns, bodyHtml: t.bodyHtml, ru: t.ru })
    .from(t)
    .where(and(where({}), eq(t.slug, slug), isNotNull(t.ru)))
    .limit(1);
  return row?.ru ? { article: mapRow(row), ru: row.ru } : undefined;
}

export async function listRuArticles(limit: number) {
  const rows = await getDb()
    .select({ ...listColumns, ru: t.ru, ruUpdatedAt: t.ruUpdatedAt })
    .from(t)
    .where(and(where({}), isNotNull(t.ru)))
    .orderBy(desc(t.publishedAt))
    .limit(limit);
  return rows.map((r) => ({ article: mapRow(r), ru: r.ru!, ruUpdatedAt: r.ruUpdatedAt }));
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

// Titlul și adresa unui articol publicat — pentru caseta „Context” a continuărilor.
export async function getArticleLink(id: number) {
  const [row] = await getDb()
    .select({ title: t.title, slug: t.slug, section: t.section, locality: t.locality, country: t.country, publishedAt: t.publishedAt })
    .from(t)
    .where(and(eq(t.id, id), eq(t.status, "published")))
    .limit(1);
  return row ?? null;
}

// Știrile care au recomandat unealta (id „ghid:<slug>”, „calc:<slug>”) în
// blocul de impact — „Ultimele știri care schimbă asta” pe ghid / calculator.
export async function getToolNews(tool: string, n: number): Promise<Article[]> {
  const rows = await getDb()
    .select(listColumns)
    .from(t)
    .where(and(where({}), sql`${t.impact}->'unelte' ? ${tool}`))
    .orderBy(desc(t.publishedAt))
    .limit(n);
  return rows.map(mapRow);
}

// Alertele încă în vigoare: blocul de impact de tip alertă / urgent, până la
// data „pana” sau, fără ea, 3 zile de la publicare.
export async function getActiveAlerts(o: { country?: string; urgentOnly?: boolean; diaspora?: boolean }): Promise<Article[]> {
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 3 * 86400_000);
  const rows = await getDb()
    .select(listColumns)
    .from(t)
    .where(
      and(
        where({ ...(o.diaspora && { section: "diaspora" as const }), ...(o.country && { country: o.country }) }),
        o.urgentOnly ? sql`${t.impact}->>'tip' = 'urgent'` : sql`${t.impact}->>'tip' in ('alerta', 'urgent')`,
        sql`coalesce(${t.impact}->>'pana' >= ${today}, ${t.publishedAt} >= ${since.toISOString()})`,
      ),
    )
    .orderBy(desc(t.publishedAt))
    .limit(4);
  return rows.map(mapRow);
}
