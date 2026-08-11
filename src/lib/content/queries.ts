import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles as articlesTable } from "@/lib/pipeline/db/schema";
import type { Article, Section, Topic } from "./types";

// Citește din Postgres (populat de pipeline-ul AI) — doar articole cu
// status "published". "draft" rămâne în review manual, nu apare pe site
// (plan-implementare-agregator-stiri-ai.md 3.8). Nu mai există fixtures în
// producție; decizia de conținut real de la pasul 4 e acum rezolvată.

function mapRow(row: typeof articlesTable.$inferSelect): Article {
  return {
    slug: row.slug,
    title: row.title,
    lead: row.leadText,
    bodyHtml: row.bodyHtml,
    section: row.section,
    locality: row.locality ?? undefined,
    country: row.country ?? undefined,
    topics: (row.topics as Topic[]) ?? [],
    publishedAt: row.publishedAt.toISOString(),
    sourceCount: row.sourceCount,
    imageUrl: row.imageUrl ?? undefined,
    imageAlt: row.imageAltText ?? undefined,
  };
}

export async function getAllArticles(): Promise<Article[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.publishedAt));
  return rows.map(mapRow);
}

export async function getLatestArticle(): Promise<Article | null> {
  const all = await getAllArticles();
  return all[0] ?? null;
}

export async function getArticleBySection(
  section: Section,
  slug: string,
  locality?: string,
  country?: string,
): Promise<Article | undefined> {
  const db = getDb();
  const conditions = [
    eq(articlesTable.status, "published"),
    eq(articlesTable.section, section),
    eq(articlesTable.slug, slug),
  ];
  if (locality !== undefined) conditions.push(eq(articlesTable.locality, locality));
  if (country !== undefined) conditions.push(eq(articlesTable.country, country));

  const rows = await db
    .select()
    .from(articlesTable)
    .where(and(...conditions))
    .limit(1);
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function getArticlesBySection(
  section: Section,
  opts?: { locality?: string; country?: string },
): Promise<Article[]> {
  const db = getDb();
  const conditions = [eq(articlesTable.status, "published"), eq(articlesTable.section, section)];
  if (opts?.locality) conditions.push(eq(articlesTable.locality, opts.locality));
  if (opts?.country) conditions.push(eq(articlesTable.country, opts.country));

  const rows = await db
    .select()
    .from(articlesTable)
    .where(and(...conditions))
    .orderBy(desc(articlesTable.publishedAt));
  return rows.map(mapRow);
}

export async function getArticlesByTopic(topic: Topic): Promise<Article[]> {
  // Dataset la scara actuală (zeci-sute de articole) — filtrare pe subiect
  // în JS, mai simplu și mai robust decât o interogare JSONB brută pe
  // container-ul de topics. De reconsiderat dacă volumul crește mult.
  const all = await getAllArticles();
  return all.filter((a) => a.topics.includes(topic));
}

export async function getSimilarArticles(article: Article, limit = 3): Promise<Article[]> {
  const all = await getAllArticles();
  return all
    .filter((a) => a.slug !== article.slug && a.topics.some((t) => article.topics.includes(t)))
    .slice(0, limit);
}
