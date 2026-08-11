import type { CandidateGroup, ClassificationResult } from "./types";
import { bestCredibilityTier } from "./credibility";

// Scor de calitate 0-100, combinație de semnale — nu doar numărul de surse,
// cf. plan-implementare-agregator-stiri-ai.md secțiunea 3.3 (actualizată cu
// tier-ul de credibilitate din 3.1). Ponderi însumează 100:
//   popularitate cross-sursă   35
//   recență                    15
//   bogăție factuală (LLM)     25
//   încredere clasificare (LLM) 15
//   credibilitatea sursei       10

const WEIGHTS = {
  popularity: 35,
  recency: 15,
  factualRichness: 25,
  confidence: 15,
  credibility: 10,
};

const RECENCY_FULL_MARKS_MINUTES = 30;
const RECENCY_ZERO_MARKS_MINUTES = 240; // 4 ore

function popularityScore(sourceCount: number): number {
  return Math.min(sourceCount, 5) / 5;
}

function recencyScore(group: CandidateGroup): number {
  const newest = group.items[0]?.publishedAt;
  if (!newest) return 0;
  const ageMinutes = (Date.now() - newest.getTime()) / 60_000;
  if (ageMinutes <= RECENCY_FULL_MARKS_MINUTES) return 1;
  if (ageMinutes >= RECENCY_ZERO_MARKS_MINUTES) return 0;
  return (
    1 -
    (ageMinutes - RECENCY_FULL_MARKS_MINUTES) /
      (RECENCY_ZERO_MARKS_MINUTES - RECENCY_FULL_MARKS_MINUTES)
  );
}

function credibilityScore(sourceNames: string[]): number {
  const tier = bestCredibilityTier(sourceNames);
  if (tier === "high") return 1;
  if (tier === "low") return 0;
  return 0.6;
}

export function computeQualityScore(
  group: CandidateGroup,
  classification: ClassificationResult,
): number {
  const score =
    popularityScore(group.sourceNames.length) * WEIGHTS.popularity +
    recencyScore(group) * WEIGHTS.recency +
    (classification.factualRichness / 100) * WEIGHTS.factualRichness +
    (classification.confidence / 100) * WEIGHTS.confidence +
    credibilityScore(group.sourceNames) * WEIGHTS.credibility;

  return Math.round(Math.min(100, Math.max(0, score)));
}
