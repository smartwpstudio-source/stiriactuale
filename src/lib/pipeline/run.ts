import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { pipelineRuns } from "./db/schema";
import { fetchAllSources } from "./sources";
import { groupCandidates } from "./dedup";
import { classifyGroup } from "./classify";
import { generateArticle } from "./generate";
import { computeQualityScore } from "./scoring";
import { generateSymbolImage, type ImageTier } from "./image";
import { publishArticle, wasRecentlyPublished } from "./publish";
import { mapWithConcurrency } from "./concurrency";
import type { Section } from "@/lib/content/types";
import type { CandidateGroup, ScoredCandidate } from "./types";

// Prag minim + plafon de siguranță INDEPENDENTE per secțiune — nu cotă fixă
// globală. Valori de pornire, ajustabile pe măsură ce se acumulează date
// reale de calibrare. Vezi plan-implementare-agregator-stiri-ai.md 3.3.
const SECTION_CONFIG: Record<Section, { minScore: number; cap: number }> = {
  regiuni: { minScore: 55, cap: 5 },
  national: { minScore: 55, cap: 5 },
  international: { minScore: 50, cap: 3 },
  diaspora: { minScore: 45, cap: 2 },
};

// Vercel Hobby: maxDuration 300s e plafon absolut, nu doar implicit
// (verificat în docs Vercel) — nu se poate mări. Clasificarea + generarea
// rulează cu concurență limitată în loc de secvențial, ca rularea completă
// să se încadreze confortabil sub 300s chiar și cu sute de candidați.
// Plafoane alese conservator față de rate-limit-urile Anthropic implicite.
const CLASSIFY_CONCURRENCY = 10;
const PUBLISH_CONCURRENCY = 4;

// Doar candidații cu semnal minim (2+ surse independente) merg la clasificare
// (Haiku) — evită cheltuiala pe zgomotul de fond al miilor de grupuri cu o
// singură sursă slabă, care oricum n-ar trece pragul de calitate.
function isWorthClassifying(group: CandidateGroup): boolean {
  return group.sourceNames.length >= 2;
}

export interface PipelineRunSummary {
  candidatesFetched: number;
  groupsFormed: number;
  candidatesClassified: number;
  articlesPublished: number;
  failedFeeds: number;
  bySection: Record<Section, number>;
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
  };

  try {
    const { candidates, failedFeeds } = await fetchAllSources();
    summary.candidatesFetched = candidates.length;
    summary.failedFeeds = failedFeeds.length;

    const groups = groupCandidates(candidates);
    summary.groupsFormed = groups.length;

    const worthClassifying = groups.filter(isWorthClassifying);
    const classifyResults = await mapWithConcurrency(
      worthClassifying,
      CLASSIFY_CONCURRENCY,
      async (group): Promise<ScoredCandidate | null> => {
        try {
          const classification = await classifyGroup(group);
          return {
            group,
            classification,
            qualityScore: computeQualityScore(group, classification),
          };
        } catch {
          // un candidat eșuat la clasificare nu oprește rularea
          return null;
        }
      },
    );
    const scored = classifyResults.filter((c): c is ScoredCandidate => c !== null);
    summary.candidatesClassified = scored.length;

    // grupare pe secțiune + aplicare prag/plafon independent per secțiune
    const bySection = new Map<Section, ScoredCandidate[]>();
    for (const candidate of scored) {
      const { section } = candidate.classification;
      if (candidate.qualityScore < SECTION_CONFIG[section].minScore) continue;
      bySection.set(section, [...(bySection.get(section) ?? []), candidate]);
    }

    const toPublish: ScoredCandidate[] = [];
    for (const [section, list] of bySection) {
      const top = list
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, SECTION_CONFIG[section].cap);
      toPublish.push(...top);
    }

    // FLUX Pro doar pentru articolul cu scorul de calitate cel mai mare din
    // toată rularea (nu per secțiune) — plan-implementare-agregator-stiri-ai.md 3.6.
    const topCandidate = toPublish.reduce<ScoredCandidate | null>(
      (best, c) => (!best || c.qualityScore > best.qualityScore ? c : best),
      null,
    );

    const publishResults = await mapWithConcurrency(
      toPublish,
      PUBLISH_CONCURRENCY,
      async (candidate): Promise<Section | null> => {
        if (await wasRecentlyPublished(candidate.group.representativeTitle)) return null;

        try {
          const generated = await generateArticle(candidate.group, candidate.classification);
          const tier: ImageTier = candidate === topCandidate ? "pro" : "schnell";
          const image = await generateSymbolImage(
            `Imagine simbol pentru un articol de știri despre: ${generated.titlu}`,
            tier,
          );
          await publishArticle(candidate, generated, image?.url ?? null);
          return candidate.classification.section;
        } catch {
          // un articol eșuat la generare/publicare nu oprește restul rulării
          return null;
        }
      },
    );

    for (const section of publishResults) {
      if (!section) continue;
      summary.articlesPublished++;
      summary.bySection[section]++;
    }

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
