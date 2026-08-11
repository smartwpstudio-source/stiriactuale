import { articles } from "./fixtures";
import type { Article, Section, Topic } from "./types";

export function getAllArticles(): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getLatestArticle(): Article {
  return getAllArticles()[0];
}

export function getArticleBySection(
  section: Section,
  slug: string,
  locality?: string,
  country?: string,
): Article | undefined {
  return articles.find(
    (a) =>
      a.section === section &&
      a.slug === slug &&
      (locality === undefined || a.locality === locality) &&
      (country === undefined || a.country === country),
  );
}

export function getArticlesBySection(
  section: Section,
  opts?: { locality?: string; country?: string },
): Article[] {
  return getAllArticles().filter(
    (a) =>
      a.section === section &&
      (!opts?.locality || a.locality === opts.locality) &&
      (!opts?.country || a.country === opts.country),
  );
}

export function getArticlesByTopic(topic: Topic): Article[] {
  return getAllArticles().filter((a) => a.topics.includes(topic));
}

export function getSimilarArticles(article: Article, limit = 3): Article[] {
  return getAllArticles()
    .filter((a) => a.slug !== article.slug && a.topics.some((t) => article.topics.includes(t)))
    .slice(0, limit);
}

export function getRaioaneWithArticles(): string[] {
  return [...new Set(articles.filter((a) => a.section === "regiuni").map((a) => a.locality!))];
}

export function getCountriesWithArticles(): string[] {
  return [...new Set(articles.filter((a) => a.section === "diaspora").map((a) => a.country!))];
}

export function getTopicsWithArticles(): Topic[] {
  return [...new Set(articles.flatMap((a) => a.topics))];
}
