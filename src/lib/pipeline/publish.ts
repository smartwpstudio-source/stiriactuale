import crypto from "node:crypto";
import { gte } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";
import { normalizeTitle } from "./dedup";
import type { CandidateGroup, GeneratedArticle, ScoredCandidate } from "./types";

const RECENT_WINDOW_HOURS = 72;

function titleHash(title: string): string {
  return crypto.createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

// Verificare contra republicării aceluiași eveniment în rulările următoare —
// plan-implementare-agregator-stiri-ai.md 3.2. Hash-ul de titlu singur rata
// duplicatele (două rulări aleg titluri reprezentative diferite pentru aceeași
// știre — observat la "tranzit cereale"), așa că verificăm și dacă vreun URL
// sursă al grupului (link yam.md / Google News, stabil per știre) apare deja
// la un articol din ultimele 72h, draft sau publicat. O singură interogare
// per rulare, verificarea în memorie.
export async function loadRecentFingerprints() {
  const since = new Date(Date.now() - RECENT_WINDOW_HOURS * 60 * 60 * 1000);
  const rows = await getDb()
    .select({ hash: articles.normalizedTitleHash, urls: articles.sourceUrls })
    .from(articles)
    .where(gte(articles.publishedAt, since));
  return {
    hashes: new Set(rows.map((r) => r.hash)),
    urls: new Set(rows.flatMap((r) => r.urls)),
  };
}

export function isDuplicate(
  group: CandidateGroup,
  recent: Awaited<ReturnType<typeof loadRecentFingerprints>>,
): boolean {
  return (
    recent.hashes.has(titleHash(group.representativeTitle)) ||
    group.items.some((i) => i.sourceUrl && recent.urls.has(i.sourceUrl))
  );
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
