import crypto from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";
import { normalizeTitle } from "./dedup";
import type { GeneratedArticle, ScoredCandidate } from "./types";

const RECENT_WINDOW_HOURS = 72;

function titleHash(title: string): string {
  return crypto.createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

// Verificare contra republicării aceluiași eveniment în rulările următoare —
// plan-implementare-agregator-stiri-ai.md 3.2. Nu ține de pragul de calitate:
// un eveniment deja publicat nu trebuie să reapară doar pentru că mai multe
// surse îl preiau ulterior în aceeași fereastră de 72h.
export async function wasRecentlyPublished(title: string): Promise<boolean> {
  const db = getDb();
  const hash = titleHash(title);
  const since = new Date(Date.now() - RECENT_WINDOW_HOURS * 60 * 60 * 1000);

  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.normalizedTitleHash, hash), gte(articles.publishedAt, since)))
    .limit(1);

  return existing.length > 0;
}

// status: "draft" implicit din schema — primele 2-4 săptămâni, review manual
// înainte de auto-publish (plan-implementare-agregator-stiri-ai.md 3.8).
export async function publishArticle(
  candidate: ScoredCandidate,
  generated: GeneratedArticle,
  imageUrl: string | null,
): Promise<void> {
  const db = getDb();

  await db.insert(articles).values({
    slug: generated.slug,
    title: generated.titlu,
    leadText: generated.lead,
    bodyHtml: generated.corp_html,
    metaDescription: generated.meta_description,
    section: candidate.classification.section,
    locality: candidate.classification.locality,
    country: candidate.classification.country,
    topics: candidate.classification.topics,
    normalizedTitleHash: titleHash(candidate.group.representativeTitle),
    sourceCount: candidate.group.sourceNames.length,
    qualityScore: candidate.qualityScore,
    imageUrl,
    imageAltText: generated.alt_text_imagine,
    sourceUrls: candidate.group.items.map((i) => i.sourceUrl).filter(Boolean),
  });
}
