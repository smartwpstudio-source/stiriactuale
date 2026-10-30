// Știrile în rusă (/ru/novosti/, /ru/): publice din 2026-10-30 (decizia proprietarului,
// după primele zeci de știri traduse) — indexate de la traducere, în sitemap și în
// news-sitemap, cu hreflang și comutator în articolele RO, trimise prin IndexNow.
// Cu false: paginile rusești au noindex, nu intră în sitemap, fără hreflang și comutator.
export const RU_NEWS_PUBLIC: boolean = true;

// Varianta rusă a unei știri (coloana articles.ru) — fără importuri de server.
export interface RuNews {
  title: string;
  lead: string;
  bodyHtml: string;
  metaDescription: string;
  // blocul „Ce înseamnă pentru tine” tradus; tipul și uneltele rămân ale celui românesc
  impact?: { cine: string; ce: string; cand?: string; pasi: string[] };
}

export const ruNewsPath = (slug: string) => `/ru/novosti/${slug}/`;
