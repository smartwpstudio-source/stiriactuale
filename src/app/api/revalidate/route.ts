import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { gte, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { revalidateKey } from "@/lib/revalidate";
import { ruNewsPath } from "@/lib/ru-news-public";
import type { Article } from "@/lib/content/types";

// Listele (prima pagină, secțiunile, raioanele, țările, subiectele) și
// articolele noi sau actualizate se refac imediat; restul paginilor, după ceas
// (articolele o dată pe zi, listele o dată pe oră).
// rutele cu [param] se invalidează după fișierul paginii, cu grupul (site)
// inclus — fără el revalidatePath nu atingea nimic (vezi docs revalidatePath).
const LISTS = [
  "/",
  "/national",
  "/international",
  "/diaspora",
  "/regiuni",
  "/video",
  "/util",
  "/(site)/national/pagina/[n]",
  "/(site)/international/pagina/[n]",
  "/(site)/diaspora/pagina/[n]",
  "/(site)/regiuni/pagina/[n]",
  "/(site)/video/pagina/[n]",
  "/(site)/util/pagina/[n]",
  "/(site)/regiuni/[raion]",
  "/(site)/regiuni/[raion]/pagina/[n]",
  "/(site)/diaspora/[tara]",
  "/(site)/diaspora/[tara]/pagina/[n]",
  "/(site)/subiect/[topic]",
  "/(site)/subiect/[topic]/pagina/[n]",
  "/ru",
];

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
  for (const p of LISTS) revalidatePath(p, p.includes("[") ? "page" : undefined);
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
      ]),
    ];
    for (const p of paths) revalidatePath(p);
  }
  return Response.json({ lists: LISTS.length, articles: paths.length });
}
