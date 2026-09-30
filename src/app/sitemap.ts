import type { MetadataRoute } from "next";
import { getHubCounts, getSitemapArticles } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";
import { SITE_URL } from "@/lib/seo";

// Se regenerează o dată pe oră, nu la fiecare cerere.
export const revalidate = 3600;

// Doar hub-urile cu articole — cele goale au noindex (vezi hub-page.tsx).
// ponytail: un singur sitemap; Google acceptă max 50.000 URL-uri, împarte
// cu generateSitemaps() când arhiva se apropie de limită.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, counts] = await Promise.all([getSitemapArticles(), getHubCounts()]);

  const hubs = [
    { url: "/", priority: 1 },
    ...["regiuni", "national", "international", "diaspora"].map((s) => ({ url: `/${s}/`, priority: 0.8 })),
    ...Object.keys(counts.localities).map((r) => ({ url: `/regiuni/${r}/`, priority: 0.7 })),
    ...Object.keys(counts.countries).map((t) => ({ url: `/diaspora/${t}/`, priority: 0.7 })),
  ];

  return [
    ...hubs.map((h) => ({ url: `${SITE_URL}${h.url}`, changeFrequency: "hourly" as const, priority: h.priority })),
    ...articles.map((a) => ({
      url: `${SITE_URL}${articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined })}`,
      lastModified: a.publishedAt,
      priority: 0.6,
    })),
  ];
}
