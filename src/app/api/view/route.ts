import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";

// +1 afișare pentru un articol publicat — trimis de ViewBeacon (sendBeacon,
// corp text/plain). Fără date personale: doar slug-ul articolului.
export async function POST(request: Request) {
  let slug: unknown;
  try {
    slug = JSON.parse(await request.text()).slug;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,255}$/.test(slug)) return new Response(null, { status: 400 });

  await getDb()
    .update(articles)
    .set({ views: sql`${articles.views} + 1` })
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")));
  return new Response(null, { status: 204 });
}
