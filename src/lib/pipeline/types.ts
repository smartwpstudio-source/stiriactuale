import type { Section, Topic } from "@/lib/content/types";

export interface RawCandidate {
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: Date;
  feedId: string;
  tgViews?: number | null; // interesul de pe canalul Telegram al sursei (telegram-signal.ts)
  tgInterest?: number | null; // vizualizări / media canalului; 1 = obișnuit
}

// Un eveniment = grup de RawCandidate deduplicate (aceeași știre, surse diferite)
export interface CandidateGroup {
  representativeTitle: string;
  items: RawCandidate[];
  sourceNames: string[]; // unice
  manual: boolean; // adăugat de editor din /admin — sare peste scor și plafoane
  analysis?: boolean; // editorul a cerut o analiză (admin → tip „Analiză”)
  photo?: { url: string; credit: string | null }; // poza încărcată de editor la adăugarea linkului
  postUrl?: string; // postarea cu poze lipită de editor la adăugarea linkului
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
  updateOf?: number; // id-ul unei știri „pe scurt” publicate despre același eveniment
  continuesId?: number; // id-ul articolului anterior din aceeași poveste (continuare)
  continuesTitle?: string; // titlul lui — continuarea trebuie să se distingă de el
  pushWorthy: boolean; // propunere de notificare push (criteriile redacției)
  sensitive: boolean; // impact emoțional puternic / risc juridic -> draft, așteaptă aprobarea
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
  video_url?: string; // nu vine de la model: primul video găsit în surse
  impact?: unknown; // brut de la model; validat în generate.ts -> Impact | undefined
}
