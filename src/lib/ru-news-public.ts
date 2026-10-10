// Știrile în rusă (/ru/novosti/, /ru/): vizibile pentru Google și legate din
// articolele românești abia după primele 10–20 de știri traduse (decizia
// proprietarului, 2026-10-11). Cât e false: paginile rusești au noindex, nu
// intră în sitemap, articolele RO n-au hreflang spre ele și nici comutator.
export const RU_NEWS_PUBLIC: boolean = false;

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
