import { asciiSlug } from "@/lib/ascii-slug";
import crypto from "node:crypto";
import { eq, gte, isNotNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";
import { normalizeTitle } from "./dedup";
import type { ArticleImage } from "./image";
import { mediaTag } from "./media-tag";
import type { Impact } from "@/lib/impact";
import { announcePublished } from "@/lib/publish-effects";
import type { CandidateGroup, GeneratedArticle, ScoredCandidate } from "./types";

const RECENT_WINDOW_HOURS = 72;

function titleHash(title: string): string {
  return crypto.createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

// Contra republicării aceluiași eveniment în rulările următoare: hash de
// titlu SAU un URL sursă comun cu un articol din ultimele 72h (două rulări pot
// alege titluri reprezentative diferite pentru aceeași știre).
export async function loadRecentFingerprints() {
  const since = new Date(Date.now() - RECENT_WINDOW_HOURS * 3600_000);
  const rows = await getDb()
    .select({ hash: articles.normalizedTitleHash, urls: articles.sourceUrls })
    .from(articles)
    .where(gte(articles.createdAt, since));
  return {
    hashes: new Set(rows.map((r) => r.hash)),
    urls: new Set(rows.flatMap((r) => r.urls)),
  };
}

export function isDuplicate(group: CandidateGroup, recent: Awaited<ReturnType<typeof loadRecentFingerprints>>): boolean {
  return (
    recent.hashes.has(titleHash(group.representativeTitle)) ||
    group.items.some((i) => i.sourceUrl && recent.urls.has(i.sourceUrl))
  );
}

export async function loadUsedImageIds(): Promise<Set<number>> {
  const rows = await getDb()
    .select({ id: articles.imageResourceId })
    .from(articles)
    .where(isNotNull(articles.imageResourceId));
  return new Set(rows.map((r) => r.id!));
}

// Totul se publică imediat; editorul verifică în admin și retrage sau șterge
// ce nu corespunde (decizia proprietarului, 2026-10-04 — fără drafturi).
export async function publishArticle(
  candidate: ScoredCandidate,
  generated: GeneratedArticle,
  image: ArticleImage | null,
  kind: "stire" | "pe-scurt" | "analiza" | "util" = "stire",
): Promise<number> {
  const db = getDb();
  const sourceUrls = candidate.group.items.map((i) => i.sourceUrl).filter(Boolean);
  // o redacție o singură dată în "Surse:", chiar dacă a dat 2 știri (update)
  const sources = [...new Map(candidate.group.items.map((i) => [i.sourceName, i.sourceUrl])).entries()]
    .filter(([, url]) => url)
    .map(([name, url]) => ({ name, url }));

  // Slug-ul poate coincide cu un articol mai vechi (subiect recurent) ->
  // sufix -2, -3... Unicitatea o garantează constrângerea din DB.
  // slug doar ASCII: AI-ul a scris o dată „і” chirilic (URL 404)
  const base = asciiSlug(generated.slug).slice(0, 90).replace(/-+$/, "") || asciiSlug(generated.titlu).slice(0, 90).replace(/-+$/, "");
  for (let n = 1; n <= 10; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const inserted = await db
      .insert(articles)
      .values({
        slug,
        title: generated.titlu,
        leadText: generated.lead,
        bodyHtml: generated.corp_html,
        metaDescription: generated.meta_description.slice(0, 200),
        section: candidate.classification.section,
        locality: candidate.classification.locality,
        country: candidate.classification.country,
        topics: candidate.classification.topics,
        normalizedTitleHash: titleHash(candidate.group.representativeTitle),
        sourceCount: candidate.group.sourceNames.length,
        qualityScore: candidate.qualityScore,
        imageUrl: image?.url,
        imageResourceId: image?.resourceId,
        imageCredit: image?.credit,
        imageSource: image?.source,
        // doar descrierea editorului; AI-ul nu vede poza (2026-10-09)
        imageAltText: image?.alt ?? null,
        videoUrl: generated.video_url,
        sourceUrls,
        sources,
        pushWorthy: candidate.classification.pushWorthy,
        kind,
        continuesId: candidate.classification.continuesId,
        impact: (generated.impact as Impact | undefined) ?? null,
        guideTool: candidate.guide?.tool ?? null,
        postUrl: candidate.group.postUrl,
        status: "published",
      })
      .onConflictDoNothing({ target: articles.slug })
      .returning({ id: articles.id });
    if (inserted.length) {
      const id = inserted[0].id;
      await announcePublished(id, "auto");
      return id;
    }
  }
  throw new Error(`slug ocupat: ${generated.slug}`);
}

// Știre „pe scurt” completată cu detalii noi: același articol (aceeași adresă,
// fără o nouă postare pe Telegram/Facebook), textul extins, sursele adunate,
// marcată „Actualizat la”.
export async function updateBriefArticle(
  articleId: number,
  candidate: ScoredCandidate,
  generated: GeneratedArticle,
): Promise<void> {
  const db = getDb();
  const [old] = await db.select().from(articles).where(eq(articles.id, articleId));
  if (!old) return;
  const sources = [
    ...new Map(
      [...old.sources, ...candidate.group.items.map((i) => ({ name: i.sourceName, url: i.sourceUrl }))]
        .filter((x) => x.url)
        .map((x) => [x.name, x]),
    ).values(),
  ];
  await db
    .update(articles)
    .set({
      // rescrierea nu pierde „(VIDEO)” / „(FOTO)” din titlul vechi
      title: mediaTag(generated.titlu, !!(old.videoUrl ?? generated.video_url), /[(]FOTO[)]/.test(old.title)),
      leadText: generated.lead,
      bodyHtml: generated.corp_html,
      metaDescription: generated.meta_description.slice(0, 200),
      sources,
      sourceUrls: [...new Set([...old.sourceUrls, ...candidate.group.items.map((i) => i.sourceUrl).filter(Boolean)])],
      sourceCount: sources.length,
      videoUrl: old.videoUrl ?? generated.video_url,
      // blocul editat manual nu se suprascrie; altfel cel nou (sau cel vechi, dacă nu e altul)
      impact: old.impact?.editat ? old.impact : ((generated.impact as Impact | undefined) ?? old.impact),
      kind: "stire",
      updatedAt: new Date(),
      // textul s-a schimbat: se retraduce la sfârșitul rulării, dacă se califică
      ru: null,
      ruUpdatedAt: null,
    })
    .where(eq(articles.id, articleId));
}
