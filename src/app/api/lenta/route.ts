import { listArticles } from "@/lib/content/queries";

// Paginile lentei "Ultima oră" (încărcate la derulare de NewsFeed). Fără
// corpul articolelor; cache scurt pe CDN — lista se schimbă la câteva minute.
export async function GET(request: Request) {
  const page = Math.max(1, Math.min(200, Number(new URL(request.url).searchParams.get("page")) || 1));
  const { items, pages } = await listArticles({}, page, 20);
  return Response.json(
    { items, hasMore: page < pages },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
