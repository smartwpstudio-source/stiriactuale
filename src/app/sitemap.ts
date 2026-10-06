import { HISTORY_PATH, dayPath, historyDays } from "@/lib/history";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";
import type { MetadataRoute } from "next";
import { getHubCounts, getSitemapArticles } from "@/lib/content/queries";
import { getGuides } from "@/lib/content/guides";
import { listPlaces } from "@/lib/content/places";
import { articleUrl } from "@/lib/content/url";
import { SITE_URL } from "@/lib/seo";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

// Se regenerează o dată pe oră, nu la fiecare cerere.
export const revalidate = 3600;

// Doar hub-urile cu articole — cele goale au noindex (vezi hub-page.tsx).
// ponytail: un singur sitemap; Google acceptă max 50.000 URL-uri, împarte
// cu generateSitemaps() când arhiva se apropie de limită.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, counts, guides, raioane, tari, calcParams] = await Promise.all([
    getSitemapArticles(),
    getHubCounts(),
    getGuides(),
    listPlaces("raioane"),
    listPlaces("tari"),
    getCalcParams(),
  ]);
  // hub-uri cu articole SAU cu informații utile (fără ele au noindex)
  const raionSlugs = [...new Set([...Object.keys(counts.localities), ...raioane])];
  const taraSlugs = [...new Set([...Object.keys(counts.countries), ...tari])];

  const hubs = [
    { url: "/", priority: 1 },
    ...["regiuni", "national", "international", "diaspora"].map((s) => ({ url: `/${s}/`, priority: 0.8 })),
    ...raionSlugs.map((r) => ({ url: `/regiuni/${r}/`, priority: 0.7 })),
    ...taraSlugs.map((t) => ({ url: `/diaspora/${t}/`, priority: 0.7 })),
    ...["despre", "contact", "politica-editoriala", "confidentialitate", "publicitate"].map((p) => ({ url: `/${p}/`, priority: 0.3 })),
    { url: "/video/", priority: 0.7 },
    { url: "/ghiduri/", priority: 0.7 },
    { url: "/calculatoare/", priority: 0.7 },
    { url: "/modele-reclamatii/", priority: 0.7 },
    { url: HISTORY_PATH, priority: 0.7 },
    ...(await historyDays()).map((d) => ({ url: dayPath(d.month, d.day), priority: 0.6 })),
    ...COMPLAINT_MODELS.map((m) => ({ url: `/modele-reclamatii/${m.slug}/`, priority: 0.7 })),
    { url: "/calendar-crestin-ortodox/", priority: 0.8 },
    ...[0, 1].map((d) => ({ url: `/calendar-crestin-ortodox/${new Date().getFullYear() + d}/`, priority: 0.6 })),
    ...availableCalculators(calcParams).map((c) => ({ url: `/calculatoare/${c.slug}/`, priority: 0.7 })),
  ];

  return [
    ...guides.map((g) => ({ url: `${SITE_URL}/ghiduri/${g.slug}/`, lastModified: g.updated, priority: 0.7 })),
    ...hubs.map((h) => ({ url: `${SITE_URL}${h.url}`, changeFrequency: "hourly" as const, priority: h.priority })),
    // slug-uri cu "%" (emoji codat la migrare) dau 404 — nu le punem în sitemap
    ...articles.filter((a) => !a.slug.includes("%")).map((a) => ({
      url: `${SITE_URL}${articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined })}`,
      lastModified: a.publishedAt,
      priority: 0.6,
    })),
  ];
}
