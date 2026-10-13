import { getGuidesRu, ruPath } from "@/lib/content/guides-ru";
import { AUTHORS, analysisPath, authorPath, getAnalyses } from "@/lib/content/analyses";
import { HISTORY_PATH, dayPath, historyDays } from "@/lib/history";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";
import type { MetadataRoute } from "next";
import { getHubCounts, getSitemapArticles, listRuArticles } from "@/lib/content/queries";
import { RU_NEWS_PUBLIC, ruNewsPath } from "@/lib/ru-news-public";
import { getGuides } from "@/lib/content/guides";
import { getRecipes, recipePath } from "@/lib/content/recipes";
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
  const [articles, counts, guides, raioane, tari, calcParams, recipes, recipesRu] = await Promise.all([
    getSitemapArticles(),
    getHubCounts(),
    getGuides(),
    listPlaces("raioane"),
    listPlaces("tari"),
    getCalcParams(),
    getRecipes("ro"),
    getRecipes("ru"),
  ]);
  const analyses = await getAnalyses();
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
    ...(recipes.length ? [{ url: "/retete/", priority: 0.7 }] : []),
    { url: "/calculatoare/", priority: 0.7 },
    { url: "/modele-reclamatii/", priority: 0.7 },
    { url: "/impact/", priority: 0.7 },
    // Analiză pe pauză (2026-10-14): în sitemap doar când are analize publicate
    ...(analyses.length ? [{ url: "/analiza/", priority: 0.7 }] : []),
    ...analyses.map((a) => ({ url: analysisPath(a), priority: 0.8 })),
    ...Object.keys(AUTHORS).map((slug) => ({ url: authorPath(slug), priority: 0.5 })),
    { url: HISTORY_PATH, priority: 0.7 },
    ...(await historyDays()).map((d) => ({ url: dayPath(d.month, d.day), priority: 0.6 })),
    ...COMPLAINT_MODELS.map((m) => ({ url: `/modele-reclamatii/${m.slug}/`, priority: 0.7 })),
    { url: "/calendar-crestin-ortodox/", priority: 0.8 },
    ...[0, 1].map((d) => ({ url: `/calendar-crestin-ortodox/${new Date().getFullYear() + d}/`, priority: 0.6 })),
    ...availableCalculators(calcParams).map((c) => ({ url: `/calculatoare/${c.slug}/`, priority: 0.7 })),
    // versiunea rusă: cuprinsurile, calculatoarele și modelele de reclamații
    ...(RU_NEWS_PUBLIC ? [{ url: "/ru/", priority: 0.8 }] : []),
    { url: "/ru/ghiduri/", priority: 0.7 },
    ...(recipes.length ? [{ url: "/ru/retete/", priority: 0.7 }] : []),
    { url: "/ru/calculatoare/", priority: 0.7 },
    ...availableCalculators(calcParams).map((c) => ({ url: `/ru/calculatoare/${c.slug}/`, priority: 0.7 })),
    { url: "/ru/modele-reclamatii/", priority: 0.7 },
    ...COMPLAINT_MODELS.map((m) => ({ url: `/ru/modele-reclamatii/${m.slug}/`, priority: 0.7 })),
  ];

  return [
    ...guides.map((g) => ({ url: `${SITE_URL}/ghiduri/${g.slug}/`, lastModified: g.updated, priority: 0.7 })),
    ...(await getGuidesRu()).map((g) => ({ url: `${SITE_URL}${ruPath(g.slug)}`, lastModified: g.updated, priority: 0.7 })),
    ...recipes.map((r) => ({ url: `${SITE_URL}${recipePath(r.slug)}`, lastModified: r.updated, priority: 0.7 })),
    ...recipesRu.map((r) => ({ url: `${SITE_URL}${recipePath(r.slug, "ru")}`, lastModified: r.updated, priority: 0.7 })),
    ...hubs.map((h) => ({ url: `${SITE_URL}${h.url}`, changeFrequency: "hourly" as const, priority: h.priority })),
    // știrile în rusă: abia după activare (ru-news-public.ts)
    ...(RU_NEWS_PUBLIC ? await listRuArticles(5000) : []).map(({ article }) => ({
      url: `${SITE_URL}${ruNewsPath(article.slug)}`,
      lastModified: article.publishedAt,
      priority: 0.6,
    })),
    // slug-uri cu "%" (emoji codat la migrare) dau 404 — nu le punem în sitemap
    ...articles.filter((a) => !a.slug.includes("%")).map((a) => ({
      url: `${SITE_URL}${articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined })}`,
      lastModified: a.publishedAt,
      priority: 0.6,
    })),
  ];
}
