import type { Article } from "./types";

// Aceeași convenție de URL ca în scripts/migration/lib/taxonomy-map.ts
// (secțiunea = canonic, subiectul = etichetă). Duplicată intenționat, nu
// importată din scripts/ — aplicația nu trebuie să depindă de tooling-ul
// de migrare la runtime.
export function articleUrl(article: Article): string {
  switch (article.section) {
    case "regiuni":
      return `/regiuni/${article.locality}/${article.slug}/`;
    case "diaspora":
      return `/diaspora/${article.country}/${article.slug}/`;
    case "national":
      return `/national/${article.slug}/`;
    case "international":
      return `/international/${article.slug}/`;
  }
}
