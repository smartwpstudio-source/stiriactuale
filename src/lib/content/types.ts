export type Section = "regiuni" | "national" | "international" | "diaspora";

export type Topic =
  | "accidente"
  | "criminal"
  | "coruptie"
  | "alerta-112"
  | "economic"
  | "criza-energetica"
  | "sanatate"
  | "social"
  | "cultura"
  | "sport";

export interface Article {
  slug: string;
  title: string;
  lead: string;
  bodyHtml: string;
  section: Section;
  locality?: string; // slug de raion, doar pentru section: "regiuni"
  country?: string; // slug de țară, doar pentru section: "diaspora"
  topics: Topic[];
  publishedAt: string; // ISO 8601
  sourceCount: number;
  imageUrl?: string; // stock Magnific sau generată — absentă pe fixtures/articole fără imagine
  imageAlt?: string;
  sources?: { name: string; url: string }[];
  archived?: boolean; // arhivă preluată de la altă redacție: rezumat + link, noindex, fără reclame
}
