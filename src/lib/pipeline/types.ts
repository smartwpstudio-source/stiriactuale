import type { Section, Topic } from "@/lib/content/types";

export interface RawCandidate {
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: Date;
  feedId: string;
}

// Un eveniment = grup de RawCandidate deduplicate (aceeași știre, surse diferite)
export interface CandidateGroup {
  representativeTitle: string;
  items: RawCandidate[];
  sourceNames: string[]; // unice
}

export interface ClassificationResult {
  section: Section;
  locality?: string;
  country?: string;
  topics: Topic[];
  factualRichness: number; // 0-100, cf. plan-implementare-agregator-stiri-ai.md 3.3
  confidence: number; // 0-100
}

export interface ScoredCandidate {
  group: CandidateGroup;
  classification: ClassificationResult;
  qualityScore: number;
}

export interface GeneratedArticle {
  titlu: string;
  slug: string;
  meta_description: string;
  lead: string;
  corp_html: string;
  tag_uri: string[];
  alt_text_imagine: string;
}
