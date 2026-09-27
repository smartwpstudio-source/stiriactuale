import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { pipelineRuns } from "./db/schema";
import { fetchAllSources } from "./sources";
import { groupCandidates } from "./dedup";
import { classifyGroups } from "./classify";
import { generateArticle } from "./generate";
import { computeQualityScore } from "./scoring";
import { findStockImage } from "./image";
import { isDuplicate, loadRecentFingerprints, publishArticle } from "./publish";
import { mapWithConcurrency } from "./concurrency";
import { spentUsd } from "./llm";
import type { Section } from "@/lib/content/types";
import type { ScoredCandidate } from "./types";

// Prag minim + plafon de siguranță INDEPENDENTE per secțiune — nu cotă fixă
// globală. Vezi plan-implementare-agregator-stiri-ai.md 3.3.
const SECTION_CONFIG: Record<Section, { minScore: number; cap: number }> = {
  regiuni: { minScore: 55, cap: 5 },
  national: { minScore: 55, cap: 5 },
  international: { minScore: 50, cap: 3 },
  diaspora: { minScore: 45, cap: 2 },
};

// Top N grupuri cu 2+ surse, după numărul de surse (35% din scor) — plafon
// generos (>2.5x maximul publicabil per rulare), taie coada lungă.
const MAX_CANDIDATES_TO_CLASSIFY = 40;
const PUBLISH_CONCURRENCY = 4;

export interface PipelineRunSummary {
  candidatesFetched: number;
  groupsFormed: number;
  candidatesClassified: number;
  articlesPublished: number;
  failedFeeds: number;
  bySection: Record<Section, number>;
  costUsd: number; // echivalent consumat din creditul Agent SDK al abonamentului
}

export async function runPipeline(): Promise<PipelineRunSummary> {
  const db = getDb();
  const [run] = await db.insert(pipelineRuns).values({}).returning({ id: pipelineRuns.id });

  const summary: PipelineRunSummary = {
    candidatesFetched: 0,
    groupsFormed: 0,
    candidatesClassified: 0,
    articlesPublished: 0,
    failedFeeds: 0,
    bySection: { regiuni: 0, national: 0, international: 0, diaspora: 0 },
    costUsd: 0,
  };

  try {
    const { candidates, failedFeeds } = await fetchAllSources();
    summary.candidatesFetched = candidates.length;
    summary.failedFeeds = failedFeeds.length;

    const groups = groupCandidates(candidates);
    summary.groupsFormed = groups.length;

    // Evenimentele deja publicate/draft în ultimele 72h se elimină ÎNAINTE de
    // clasificare — nu plătim clasificare/generare pentru duplicate.
    const recent = await loadRecentFingerprints();
    const fresh = groups
      .filter((g) => g.sourceNames.length >= 2 && !isDuplicate(g, recent))
      .sort((a, b) => b.sourceNames.length - a.sourceNames.length)
      .slice(0, MAX_CANDIDATES_TO_CLASSIFY);

    const classifications = fresh.length ? await classifyGroups(fresh) : [];
    const scored: ScoredCandidate[] = [];
    classifications.forEach((classification, i) => {
      if (!classification) return;
      scored.push({
        group: fresh[i],
        classification,
        qualityScore: computeQualityScore(fresh[i], classification),
      });
    });
    summary.candidatesClassified = scored.length;

    const bySection = new Map<Section, ScoredCandidate[]>();
    for (const candidate of scored) {
      const { section } = candidate.classification;
      if (candidate.qualityScore < SECTION_CONFIG[section].minScore) continue;
      bySection.set(section, [...(bySection.get(section) ?? []), candidate]);
    }

    const toPublish: ScoredCandidate[] = [];
    for (const [section, list] of bySection) {
      toPublish.push(
        ...list.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, SECTION_CONFIG[section].cap),
      );
    }

    const published = await mapWithConcurrency(
      toPublish,
      PUBLISH_CONCURRENCY,
      async (candidate): Promise<Section | null> => {
        try {
          const generated = await generateArticle(candidate.group, candidate.classification);
          const imageUrl = await findStockImage(generated.stock_query, generated.slug);
          await publishArticle(candidate, generated, imageUrl);
          return candidate.classification.section;
        } catch (err) {
          console.error(`Articol eșuat: ${err instanceof Error ? err.message : String(err)}`);
          return null;
        }
      },
    );

    for (const section of published) {
      if (!section) continue;
      summary.articlesPublished++;
      summary.bySection[section]++;
    }
    summary.costUsd = Math.round(spentUsd() * 1000) / 1000;

    await db
      .update(pipelineRuns)
      .set({
        finishedAt: new Date(),
        candidatesFetched: summary.candidatesFetched,
        candidatesClassified: summary.candidatesClassified,
        articlesPublished: summary.articlesPublished,
      })
      .where(eq(pipelineRuns.id, run.id));

    return summary;
  } catch (err) {
    await db
      .update(pipelineRuns)
      .set({ finishedAt: new Date(), errorMessage: String(err) })
      .where(eq(pipelineRuns.id, run.id));
    throw err;
  }
}
