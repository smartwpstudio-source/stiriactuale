import type { Metadata } from "next";
import type { Article } from "./content/types";
import { SECTION_LABELS } from "./content/geo";
import { articleUrl } from "./content/url";

export const SITE_URL = "https://stiriactuale.info";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// Descrierea din rezultatele Google se taie în jur de 160 de caractere; leadul
// articolelor ajunge la 580. Tăiem la limita unui cuvânt și punem "…".
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
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
      logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png?v=2") },
    },
  };
}

// Metadatele comune paginilor de articol: canonical, noindex pentru arhiva
// preluată și imaginea de distribuire — poza articolului sau, fără poză, una
// generată cu titlul (/og/). Fără og:image, Facebook afișează linkul gol.
export function articleMetadata(article: Article): Metadata {
  const url = articleUrl(article);
  const image =
    article.imageUrl ??
    `/og/?${new URLSearchParams({ t: article.title, s: SECTION_LABELS[article.section] })}`;
  const description = metaDescription(article.lead);
  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    // arhivă preluată de la altă redacție — nu se indexează (conținut duplicat)
    ...(article.archived && { robots: { index: false, follow: true } }),
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url,
      siteName: "Stiri actuale",
      locale: "ro_MD",
      publishedTime: article.publishedAt,
      images: [{ url: image, width: 1200, height: 630, alt: article.imageAlt ?? article.title }],
    },
    twitter: { card: "summary_large_image", title: article.title, description, images: [image] },
  };
}
