import type { MetadataRoute } from "next";
import { getAllArticles, getRaioaneWithArticles, getCountriesWithArticles } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/regiuni/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/national/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/international/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/diaspora/`, changeFrequency: "hourly", priority: 0.8 },
  ];

  const raionUrls: MetadataRoute.Sitemap = getRaioaneWithArticles().map((raion) => ({
    url: `${SITE_URL}/regiuni/${raion}/`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const diasporaUrls: MetadataRoute.Sitemap = getCountriesWithArticles().map((tara) => ({
    url: `${SITE_URL}/diaspora/${tara}/`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}${articleUrl(a)}`,
    lastModified: a.publishedAt,
    changeFrequency: "never",
    priority: 0.6,
  }));

  return [...staticUrls, ...raionUrls, ...diasporaUrls, ...articleUrls];
}
