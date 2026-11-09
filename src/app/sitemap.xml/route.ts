import { SITE_URL } from "@/lib/seo";
import { SITEMAP_PARTS } from "@/lib/sitemap-parts";

// Indexul sitemap-urilor (robots.txt și Search Console îl folosesc ca /sitemap.xml): părțile
// sunt în app/harta/sitemap.ts, la /harta/sitemap/<parte>.xml.
export const revalidate = 3600;

export function GET() {
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_PARTS.map((p) => `<sitemap><loc>${SITE_URL}/harta/sitemap/${p}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join("\n")}
</sitemapindex>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
