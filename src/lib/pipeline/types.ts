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
  manual: boolean; // adăugat de editor din /admin — sare peste scor și plafoane
  candidateIds: number[];
}

export interface ClassificationResult {
  section: Section;
  locality?: string;
  country?: string;
  topics: Topic[];
  impact: number; // 0-100, criteriile editoriale ale redacției
  factualRichness: number; // 0-100
  confidence: number; // 0-100
  reject: boolean; // horoscop, publicitate, monden fără miză etc.
  sameAs?: number; // indexul unui grup anterior despre același eveniment
  pushWorthy: boolean; // propunere de notificare push (criteriile redacției)
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
  stock_query: string;
  image_prompt: string;
}
