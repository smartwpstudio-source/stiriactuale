import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { recipeRatings } from "@/lib/pipeline/db/schema";
import { ratingSummary, type RatingSummary } from "@/lib/recipe-rating";

// Media notelor unei rețete, la randarea paginii (ISR). Baza indisponibilă →
// null: pagina se randează fără notă, nu eșuează.
export async function getRecipeRating(slug: string): Promise<RatingSummary | null> {
  try {
    const [row] = await getDb()
      .select({ sum: sql<number>`coalesce(sum(${recipeRatings.stars}), 0)::int`, count: sql<number>`count(*)::int` })
      .from(recipeRatings)
      .where(eq(recipeRatings.slug, slug));
    return row ? ratingSummary(Number(row.sum), Number(row.count)) : null;
  } catch (e) {
    console.error("recipe rating:", e instanceof Error ? e.message : e);
    return null;
  }
}

// Identificatorul anonim al votantului: sha256(IP + browser + sare). Sarea e
// derivată din TELEGRAM_BOT_TOKEN (ca în revalidate.ts), deci hash-ul nu poate
// fi refăcut din afară; IP-ul nu se stochează nicăieri.
export function voterId(request: Request): string | null {
  const base = process.env.TELEGRAM_BOT_TOKEN;
  if (!base) return null;
  const h = request.headers;
  const ip = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ua = h.get("user-agent") ?? "";
  const salt = crypto.createHash("sha256").update(`recipe-rating:${base}`).digest("hex");
  return crypto.createHash("sha256").update(`${ip}\n${ua}\n${salt}`).digest("hex");
}
