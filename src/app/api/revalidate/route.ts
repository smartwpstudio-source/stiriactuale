import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { gte, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { revalidateKey } from "@/lib/revalidate";
import { ruNewsPath } from "@/lib/ru-news-public";
import type { Article } from "@/lib/content/types";

// Prima pagină, secțiunile și /ru se refac la fiecare rulare; din raioane, țări și subiecte
// doar prima pagină a celor în care a apărut sau s-a schimbat ceva. Paginile 2..N și restul,
// după ceas (listele o dată pe oră, articolele o dată pe săptămână).
// Până pe 2026-11-07 se invalidau TOATE listele cu [param], cu toate paginile lor, la fiecare
// rulare: orice vizită a unui robot pe sute de pagini de arhivă refăcea pagina din bază, iar
// traficul Supabase a urcat la ~0,35 GB pe zi (limita gratuită: 5 GB pe lună).
const ALWAYS = ["/", "/national", "/international", "/diaspora", "/regiuni", "/video", "/util", "/ru"];
export async function POST(request: Request) {
  const key = revalidateKey();
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${key}`;
  if (!key || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { since?: string; all?: boolean };
  if (body.all) {
    revalidatePath("/", "layout");
    return Response.json({ all: true });
  }
  for (const p of ALWAYS) revalidatePath(p);
  const since = body.since ? new Date(body.since) : null;
  let paths: string[] = [];
  if (since && !Number.isNaN(since.getTime())) {
    const cols = {
      id: articles.id,
      slug: articles.slug,
      section: articles.section,
      locality: articles.locality,
      country: articles.country,
      continuesId: articles.continuesId,
      topics: articles.topics,
      hasRu: sql<boolean>`${articles.ru} is not null`,
    };
    const db = getDb();
    const changed = await db
      .select(cols)
      .from(articles)
      .where(or(gte(articles.publishedAt, since), gte(articles.updatedAt, since), gte(articles.ruUpdatedAt, since)));
    // articolul continuat primește linkul spre continuare
    const prevIds = changed.map((a) => a.continuesId).filter((id): id is number => id != null);
    const prev = prevIds.length ? await db.select(cols).from(articles).where(inArray(articles.id, prevIds)) : [];
    paths = [
      ...new Set([
        ...[...changed, ...prev].map((a) => articleUrl(a as Pick<Article, "section" | "slug" | "locality" | "country">)),
        // varianta rusă: și cea ștearsă la editare se reface (devine 404)
        ...changed.map((a) => ruNewsPath(a.slug)),
        // prima pagină a raionului, a țării și a subiectelor știrii
        ...changed.flatMap((a) => [
          ...(a.section === "regiuni" && a.locality ? [`/regiuni/${a.locality}`] : []),
          ...(a.section === "diaspora" && a.country ? [`/diaspora/${a.country}`] : []),
          ...a.topics.map((topic) => `/subiect/${topic}`),
        ]),
      ]),
    ];
    for (const p of paths) revalidatePath(p);
  }
  return Response.json({ lists: ALWAYS.length, paths: paths.length });
}
