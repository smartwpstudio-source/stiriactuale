import { listArticles } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

// RSS 2.0 pe același URL ca WordPress (/feed/) — cititorii RSS, agregatoarele
// și Google News care îl urmăreau continuă să primească știrile.
export const revalidate = 600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const { items } = await listArticles({}, 1, 30);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Stiri actuale</title>
<link>${SITE_URL}/</link>
<description>Știri din Moldova — regiuni, național, internațional, diaspora.</description>
<language>ro</language>
<atom:link href="${SITE_URL}/feed/" rel="self" type="application/rss+xml"/>
${items
  .map((a) => {
    const url = absoluteUrl(articleUrl(a));
    return `<item>
<title>${esc(a.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
<description>${esc(a.lead)}</description>${a.imageUrl ? `\n<enclosure url="${esc(a.imageUrl)}" type="image/jpeg" length="0"/>` : ""}
</item>`;
  })
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
