import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content/queries";
import { RAION_NAMES, COUNTRY_NAMES } from "@/lib/content/geo";
import { articleUrl } from "@/lib/content/url";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/regiuni/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/national/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/international/`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/diaspora/`, changeFrequency: "hourly", priority: 0.8 },
  ];

  const raionUrls: MetadataRoute.Sitemap = Object.keys(RAION_NAMES).map((raion) => ({
    url: `${SITE_URL}/regiuni/${raion}/`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const diasporaUrls: MetadataRoute.Sitemap = Object.keys(COUNTRY_NAMES).map((tara) => ({
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
