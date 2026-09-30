import crypto from "node:crypto";
import { gte, isNotNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";
import { normalizeTitle } from "./dedup";
import type { ArticleImage } from "./image";
import type { CandidateGroup, GeneratedArticle, ScoredCandidate } from "./types";

const RECENT_WINDOW_HOURS = 72;

function titleHash(title: string): string {
  return crypto.createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

// Contra republicării aceluiași eveniment în rulările următoare: hash de
// titlu SAU un URL sursă comun cu un articol din ultimele 72h (două rulări pot
// alege titluri reprezentative diferite pentru aceeași știre).
export async function loadRecentFingerprints() {
  const since = new Date(Date.now() - RECENT_WINDOW_HOURS * 3600_000);
  const rows = await getDb()
    .select({ hash: articles.normalizedTitleHash, urls: articles.sourceUrls })
    .from(articles)
    .where(gte(articles.createdAt, since));
  return {
    hashes: new Set(rows.map((r) => r.hash)),
    urls: new Set(rows.flatMap((r) => r.urls)),
  };
}

export function isDuplicate(group: CandidateGroup, recent: Awaited<ReturnType<typeof loadRecentFingerprints>>): boolean {
  return (
    recent.hashes.has(titleHash(group.representativeTitle)) ||
    group.items.some((i) => i.sourceUrl && recent.urls.has(i.sourceUrl))
  );
}

export async function loadUsedImageIds(): Promise<Set<number>> {
  const rows = await getDb()
    .select({ id: articles.imageResourceId })
    .from(articles)
    .where(isNotNull(articles.imageResourceId));
  return new Set(rows.map((r) => r.id!));
}

// status "draft" implicit din schema — review manual în /admin înainte de
// publicare (plan-implementare-agregator-stiri-ai.md 3.8).
export async function publishArticle(
  candidate: ScoredCandidate,
  generated: GeneratedArticle,
  image: ArticleImage | null,
): Promise<void> {
  const db = getDb();
  const sourceUrls = candidate.group.items.map((i) => i.sourceUrl).filter(Boolean);
  // o redacție o singură dată în "Surse:", chiar dacă a dat 2 știri (update)
  const sources = [...new Map(candidate.group.items.map((i) => [i.sourceName, i.sourceUrl])).entries()]
    .filter(([, url]) => url)
    .map(([name, url]) => ({ name, url }));

  // Slug-ul poate coincide cu un articol mai vechi (subiect recurent) ->
  // sufix -2, -3... Unicitatea o garantează constrângerea din DB.
  for (let n = 1; n <= 10; n++) {
    const slug = n === 1 ? generated.slug : `${generated.slug}-${n}`;
    const inserted = await db
      .insert(articles)
      .values({
        slug,
        title: generated.titlu,
        leadText: generated.lead,
        bodyHtml: generated.corp_html,
        metaDescription: generated.meta_description.slice(0, 200),
        section: candidate.classification.section,
        locality: candidate.classification.locality,
        country: candidate.classification.country,
        topics: candidate.classification.topics,
        normalizedTitleHash: titleHash(candidate.group.representativeTitle),
        sourceCount: candidate.group.sourceNames.length,
        qualityScore: candidate.qualityScore,
        imageUrl: image?.url,
        imageResourceId: image?.resourceId,
        imageAltText: generated.alt_text_imagine,
        sourceUrls,
        sources,
      })
      .onConflictDoNothing({ target: articles.slug })
      .returning({ id: articles.id });
    if (inserted.length) return;
  }
  throw new Error(`slug ocupat: ${generated.slug}`);
}
