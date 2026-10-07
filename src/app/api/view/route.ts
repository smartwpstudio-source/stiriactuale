import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { EDITOR_MARK } from "@/lib/admin/auth";

// Roboții care rulează pagina ca un browser (Google, Bing, crawlerele SEO și
// de AI) și unelte automate — după semnătura browserului. Nu se numără.
const BOTS =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|inspectiontool|python|curl|wget|httpclient|okhttp|axios|node-fetch|ahrefs|semrush|mj12|petal|yandex|baidu|bytespider|gpt|claude|perplexity|anthropic|ccbot|applebot|amazonbot|duckassist/i;

// +1 afișare pentru un articol publicat — trimis de ViewBeacon (sendBeacon,
// corp text/plain). Fără date personale: doar slug-ul articolului.
export async function POST(request: Request) {
  let slug: unknown;
  let impact = false; // click din blocul de impact spre o unealtă
  try {
    const body = JSON.parse(await request.text());
    slug = body.slug;
    impact = body.impact === true;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,255}$/.test(slug)) return new Response(null, { status: 400 });
  // roboții și editorul logat în /admin nu se numără
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOTS.test(ua) || request.headers.get("cookie")?.includes(`${EDITOR_MARK}=`)) return new Response(null, { status: 204 });

  await getDb()
    .update(articles)
    .set(impact ? { impactClicks: sql`${articles.impactClicks} + 1` } : { views: sql`${articles.views} + 1` })
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")));
  return new Response(null, { status: 204 });
}
