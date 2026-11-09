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
import { SITEMAP_PARTS } from "@/lib/sitemap-parts";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

// Se regenerează o dată pe oră, nu la fiecare cerere.
export const revalidate = 3600;

// Sitemap-ul împărțit (2026-11-09): cel unic, de 4.500 de adrese, apărea în Search Console
// „Nu s-a putut prelua” din 23 octombrie, deși se descărca normal. Părțile sunt adunate în
// indexul /sitemap.xml (app/sitemap.xml/route.ts): /harta/sitemap/<parte>.xml.
// pagini = ghiduri, unelte, hub-uri; stiri = ultimele 90 de zile; arhiva = restul; ru = știrile în rusă.

const RECENT_DAYS = 90;

export async function generateSitemaps() {
  return SITEMAP_PARTS.map((id) => ({ id }));
}

// Doar hub-urile cu articole — cele goale au noindex (vezi hub-page.tsx).
export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const part = await props.id;
  if (part === "ru") {
    // știrile în rusă: abia după activare (ru-news-public.ts)
    return (RU_NEWS_PUBLIC ? await listRuArticles(5000) : []).map(({ article }) => ({
      url: `${SITE_URL}${ruNewsPath(article.slug)}`,
      lastModified: article.publishedAt,
      priority: 0.6,
    }));
  }
  if (part === "stiri" || part === "arhiva") {
    const since = Date.now() - RECENT_DAYS * 86400_000;
    // slug-uri cu "%" (emoji codat la migrare) dau 404 — nu le punem în sitemap
    return (await getSitemapArticles())
      .filter((a) => !a.slug.includes("%") && (new Date(a.publishedAt).getTime() >= since) === (part === "stiri"))
      .map((a) => ({
        url: `${SITE_URL}${articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined })}`,
        lastModified: a.publishedAt,
        priority: 0.6,
      }));
  }
  const [counts, guides, raioane, tari, calcParams, recipes, recipesRu] = await Promise.all([
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
    ...["despre", "contact", "politica-editoriala", "confidentialitate", "publicitate", "comunicate-de-presa"].map((p) => ({ url: `/${p}/`, priority: 0.3 })),
    { url: "/util/", priority: 0.8 },
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
  ];
}
