import type { CandidateGroup, ClassificationResult } from "./types";
import { TRUSTED_SOURCES } from "./sources";

// Scor 0-100. Impactul editorial (criteriile redacției, evaluate de Haiku)
// cântărește cel mai mult; numărul de surse contează, dar nu mai decide
// singur — o știre din raion are adesea o singură sursă, și asta e normal.
// interest = interesul public de pe Telegram (vizualizări față de media canalului)
const WEIGHTS = { impact: 30, interest: 20, popularity: 15, factualRichness: 15, confidence: 10, recency: 5, trusted: 5 };

// ×1 (obișnuit) -> 0,33; ×3 sau mai mult -> 1. Fără semnal (sursa n-are canal,
// postarea e prea nouă) -> neutru, ca o știre obișnuită — nu se penalizează.
export function interestScore(group: CandidateGroup): number {
  const best = Math.max(0, ...group.items.map((i) => i.tgInterest ?? 0));
  return best ? Math.min(1, best / 3) : 1 / 3;
}

const RECENCY_FULL_MINUTES = 60;
const RECENCY_ZERO_MINUTES = 360; // fereastra de candidați e 6h

function recencyScore(group: CandidateGroup): number {
  const newest = group.items[0]?.publishedAt;
  if (!newest) return 0;
  const age = (Date.now() - newest.getTime()) / 60_000;
  return Math.min(1, Math.max(0, 1 - (age - RECENCY_FULL_MINUTES) / (RECENCY_ZERO_MINUTES - RECENCY_FULL_MINUTES)));
}

export function computeQualityScore(group: CandidateGroup, c: ClassificationResult): number {
  const score =
    (c.impact / 100) * WEIGHTS.impact +
    interestScore(group) * WEIGHTS.interest +
    (Math.min(group.sourceNames.length, 4) / 4) * WEIGHTS.popularity +
    (c.factualRichness / 100) * WEIGHTS.factualRichness +
    (c.confidence / 100) * WEIGHTS.confidence +
    recencyScore(group) * WEIGHTS.recency +
    (group.sourceNames.some((s) => TRUSTED_SOURCES.has(s)) ? 1 : 0) * WEIGHTS.trusted;
  return Math.round(Math.min(100, Math.max(0, score)));
}
