import type { Article } from "./content/types";
import { articleUrl } from "./content/url";

export const SITE_URL = "https://stiriactuale.info";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function newsArticleJsonLd(article: Article) {
  const url = absoluteUrl(articleUrl(article));
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.lead,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    url,
    mainEntityOfPage: url,
    ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
    author: { "@type": "Organization", name: "Stiri actuale" },
    publisher: {
      "@type": "Organization",
      name: "Stiri actuale",
      logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png") },
    },
  };
}
