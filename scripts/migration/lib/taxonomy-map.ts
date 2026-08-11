// Reguli de mapare categorie WP -> taxonomia nouă (secțiune canonică + subiect etichetă).
// Deciziile pe cazurile ambigue au fost confirmate explicit cu utilizatorul pe baza
// analizei categoriilor reale (vezi analyze-categories.ts):
//   - articol fără nicio categorie de secțiune determinabilă -> fallback /national/
//   - diaspora fără categorie de țară -> tratat ca /national/ (nu diaspora)
//   - conflict multi-secțiune -> prioritate regiuni > diaspora > national > international
//   - categorii de subiect din afara celor 10 canonice -> ignorate (fără etichetă)

// slug categorie WP -> slug raion canonic (unifică grafiile duble: singerei/sangerei, hincesti/hancesti)
export const RAION_SLUG_MAP: Record<string, string> = {
  "stiri-drochia": "drochia",
  "stiri-soroca": "soroca",
  "stiri-edinet": "edinet",
  "stiri-riscani": "riscani",
  "stiri-falesti": "falesti",
  "stiri-orhei": "orhei",
  "stiri-briceni": "briceni",
  "stiri-floresti": "floresti",
  "stiri-donduseni": "donduseni",
  "stiri-straseni": "straseni",
  "stiri-singerei": "singerei",
  "stiri-sangerei": "singerei",
  "stiri-telenesti": "telenesti",
  "stiri-cahul": "cahul",
  "stiri-causeni": "causeni",
  "stiri-ocnita": "ocnita",
  "stiri-anenii-noi": "anenii-noi",
  "stiri-glodeni": "glodeni",
  "stiri-stefan-voda": "stefan-voda",
  "stiri-criuleni": "criuleni",
  "stiri-soldanesti": "soldanesti",
  "stiri-chisinau": "chisinau",
  "stiri-ialoveni": "ialoveni",
  "stiri-ungheni": "ungheni",
  "stiri-balti": "balti",
  "stiri-cimislia": "cimislia",
  "stiri-hincesti": "hincesti",
  "stiri-hancesti": "hincesti",
  "stiri-leova": "leova",
  "stiri-nisporeni": "nisporeni",
  "stiri-rezina": "rezina",
  "stiri-calarasi": "calarasi",
  "stiri-cantemir": "cantemir",
  "stiri-dubasari": "dubasari",
  "stiri-ceadir-lunga": "ceadir-lunga",
  "stiri-rabnita": "rabnita",
  "stiri-taraclia": "taraclia",
  "taraclia": "taraclia",
  "transnistria": "transnistria",
  "gagauzia": "gagauzia",
};

export const NATIONAL_SLUGS = new Set(["stiri-moldova", "stiri-romania", "romania"]);
export const INTERNATIONAL_SLUGS = new Set(["stiri-externe", "razboi-in-ucraina", "stiri-ucraina"]);

export const DIASPORA_GENERIC_SLUG = "diaspora";
// slug categorie WP -> slug țară canonic
export const DIASPORA_COUNTRY_SLUG_MAP: Record<string, string> = {
  "stiri-italia": "italia",
  "stiri-franta": "franta",
};

// slug categorie WP -> slug subiect canonic (doar cele 10 din sistem-design-ui.md)
export const TOPIC_SLUG_MAP: Record<string, string> = {
  "accidente": "accidente",
  "criminal": "criminal",
  "coruptie": "coruptie",
  "alerta-112": "alerta-112",
  "economic": "economic",
  "criza-energetica": "criza-energetica",
  "sanatate": "sanatate",
  "social": "social",
  "cultura": "cultura",
  "stiri-sportive": "sport",
};

export type Section = "regiuni" | "diaspora" | "national" | "international";

export interface Classification {
  section: Section;
  locality?: string; // raion, doar pentru regiuni
  country?: string; // tara, doar pentru diaspora
  topics: string[];
  fallbackApplied: boolean; // true dacă nu s-a găsit nicio categorie de secțiune și s-a aplicat fallback /national/
}

export function classifyPost(categorySlugs: string[]): Classification {
  const raionSlugs = categorySlugs
    .map((s) => RAION_SLUG_MAP[s])
    .filter((s): s is string => Boolean(s));

  const hasNational = categorySlugs.some((s) => NATIONAL_SLUGS.has(s));
  const hasInternational = categorySlugs.some((s) => INTERNATIONAL_SLUGS.has(s));

  const countrySlugs = categorySlugs
    .map((s) => DIASPORA_COUNTRY_SLUG_MAP[s])
    .filter((s): s is string => Boolean(s));
  const hasDiasporaWithCountry = countrySlugs.length > 0;

  const topics = [
    ...new Set(
      categorySlugs.map((s) => TOPIC_SLUG_MAP[s]).filter((s): s is string => Boolean(s)),
    ),
  ];

  // prioritate: regiuni > diaspora (cu tara) > national > international > fallback national
  if (raionSlugs.length > 0) {
    return { section: "regiuni", locality: raionSlugs[0], topics, fallbackApplied: false };
  }
  if (hasDiasporaWithCountry) {
    return { section: "diaspora", country: countrySlugs[0], topics, fallbackApplied: false };
  }
  if (hasNational) {
    return { section: "national", topics, fallbackApplied: false };
  }
  if (hasInternational) {
    return { section: "international", topics, fallbackApplied: false };
  }
  return { section: "national", topics, fallbackApplied: true };
}

export function buildNewUrl(classification: Classification, slug: string): string {
  switch (classification.section) {
    case "regiuni":
      return `/regiuni/${classification.locality}/${slug}/`;
    case "diaspora":
      return `/diaspora/${classification.country}/${slug}/`;
    case "national":
      return `/national/${slug}/`;
    case "international":
      return `/international/${slug}/`;
  }
}
