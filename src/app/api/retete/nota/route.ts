import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { recipeRatings } from "@/lib/pipeline/db/schema";
import { getRecipes, recipePath } from "@/lib/content/recipes";
import { isStars } from "@/lib/recipe-rating";
import { getRecipeRating, voterId } from "@/lib/recipe-rating-db";

// Nota unui cititor pentru o rețetă (1–5 stele) — trimisă de RecipeRating.
// Un vot per vizitator per rețetă (revotul îl înlocuiește). Fără IP în clar:
// doar un hash anonim (src/lib/recipe-rating-db.ts).

const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|python|curl|wget|httpclient|okhttp|axios|node-fetch/i;
const MAX_PER_HOUR = 20;
const REVOTE_PAUSE_MS = 10_000;

const status = (s: number) => new Response(null, { status: s });

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOTS.test(ua)) return status(403);
  // doar din paginile site-ului
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return status(403);

  const body = (await request.json().catch(() => null)) as { slug?: unknown; stars?: unknown } | null;
  const slug = body?.slug;
  const stars = body?.stars;
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,255}$/.test(slug) || !isStars(stars)) return status(400);
  const [ro, ru] = await Promise.all([getRecipes("ro"), getRecipes("ru")]);
  if (!ro.some((r) => r.slug === slug) && !ru.some((r) => r.slug === slug)) return status(404);

  const voter = voterId(request);
  if (!voter) return status(503);
  const db = getDb();
  const now = Date.now();
  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(recipeRatings)
    .where(and(eq(recipeRatings.voter, voter), gte(recipeRatings.createdAt, new Date(now - 3600_000))));
  if (Number(recent?.n ?? 0) >= MAX_PER_HOUR) return status(429);
  const [prev] = await db
    .select({ stars: recipeRatings.stars, createdAt: recipeRatings.createdAt })
    .from(recipeRatings)
    .where(and(eq(recipeRatings.slug, slug), eq(recipeRatings.voter, voter)));
  if (prev && now - prev.createdAt.getTime() < REVOTE_PAUSE_MS) return status(429);

  if (prev?.stars !== stars) {
    await db
      .insert(recipeRatings)
      .values({ slug, voter, stars })
      .onConflictDoUpdate({ target: [recipeRatings.slug, recipeRatings.voter], set: { stars, createdAt: new Date(now) } });
    // nota nouă apare pe pagină (și în JSON-LD) la următoarea vizită
    revalidatePath(recipePath(slug, "ro"));
    revalidatePath(recipePath(slug, "ru"));
  }
  const rating = await getRecipeRating(slug);
  return Response.json({ stars, value: rating?.value ?? null, count: rating?.count ?? 0 });
}
