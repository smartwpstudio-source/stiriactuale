import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";

// Sitemap Google News: doar articolele din ultimele 48 de ore (regula Google),
// fără arhiva preluată. Google descoperă știrile noi mai repede decât din
// sitemap-ul general.
export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const rows = await getDb()
    .select({
      slug: articles.slug,
      section: articles.section,
      locality: articles.locality,
      country: articles.country,
      title: articles.title,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.archived, false),
        gte(articles.publishedAt, new Date(Date.now() - 48 * 3600_000)),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(1000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${rows
  .map(
    (a) => `<url>
<loc>${absoluteUrl(articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined }))}</loc>
<news:news>
<news:publication><news:name>Stiri actuale</news:name><news:language>ro</news:language></news:publication>
<news:publication_date>${a.publishedAt.toISOString()}</news:publication_date>
<news:title>${esc(a.title)}</news:title>
</news:news>
</url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
