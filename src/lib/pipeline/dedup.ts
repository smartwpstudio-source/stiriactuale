import type { RawCandidate, CandidateGroup } from "./types";

export type StoredCandidate = RawCandidate & { id: number; manual: boolean; kind?: string };
import { stripDiacritics } from "./text-normalize";

// Grupare pe similaritate de titlu (Jaccard pe tokeni, fără diacritice/majuscule).
// v1 — plan-implementare-agregator-stiri-ai.md 3.2 menționează și comparație prin
// similaritate de embeddings ca upgrade posibil; Jaccard e suficient pentru volumul
// curent și nu adaugă un apel API suplimentar doar pentru deduplicare.

const STOPWORDS = new Set([
  "si",
  "la",
  "de",
  "in",
  "un",
  "o",
  "sa",
  "se",
  "cu",
  "din",
  "pe",
  "ca",
  "ce",
  "dupa",
  "pentru",
  "care",
  "au",
  "a",
  "al",
  "ale",
  "este",
  "sunt",
  "va",
  "the",
  "an",
]);

const SIMILARITY_THRESHOLD = 0.3; // duplicatele ratate aici le prinde clasificatorul (same_as)

export function normalizeTitle(title: string): string {
  return stripDiacritics(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

export function groupCandidates(candidates: StoredCandidate[]): CandidateGroup[] {
  const groups: { tokens: Set<string>; items: StoredCandidate[] }[] = [];

  for (const candidate of candidates) {
    if (!candidate.title) continue;
    const tokens = titleTokens(candidate.title);

    let best: { group: (typeof groups)[number]; score: number } | null = null;
    for (const group of groups) {
      const score = jaccardSimilarity(tokens, group.tokens);
      if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score)) {
        best = { group, score };
      }
    }

    if (best) {
      best.group.items.push(candidate);
    } else {
      groups.push({ tokens, items: [candidate] });
    }
  }

  return groups.map((g) => ({
    representativeTitle: g.items[0].title,
    items: g.items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()),
    sourceNames: [...new Set(g.items.map((i) => i.sourceName))],
    manual: g.items.some((i) => i.manual),
    analysis: g.items.some((i) => i.manual && i.kind === "analiza"),
    candidateIds: g.items.map((i) => i.id),
  }));
}
