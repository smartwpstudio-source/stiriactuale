import { and, count, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles, candidates, pipelineRuns } from "./db/schema";
import { collectCandidates } from "./collect";
import { groupCandidates } from "./dedup";
import { classifyGroups } from "./classify";
import { generateArticle } from "./generate";
import { computeQualityScore } from "./scoring";
import { findArticleImage } from "./image";
import { isDuplicate, loadRecentFingerprints, loadUsedImageIds, publishArticle } from "./publish";
import { mapWithConcurrency } from "./concurrency";
import { spentUsd } from "./llm";
import { alertEditor } from "@/lib/telegram";
import type { Section } from "@/lib/content/types";
import type { ScoredCandidate } from "./types";

// Prag minim + plafon per rulare, independente pe secțiuni. Regiunile și
// diaspora au prag mai mic — prioritatea redacției.
const SECTION_CONFIG: Record<Section, { minScore: number; cap: number }> = {
  regiuni: { minScore: 45, cap: 3 },
  national: { minScore: 55, cap: 3 },
  international: { minScore: 65, cap: 1 },
  diaspora: { minScore: 45, cap: 2 },
};

// Fereastra de candidați: rulările sunt la 2h, deci un eveniment e văzut de
// 3 ori — dacă prinde surse noi, poate trece pragul la rularea următoare.
const WINDOW_HOURS = 6;
const MAX_GROUPS_TO_CLASSIFY = 40;
const PUBLISH_CONCURRENCY = 4;
// Fereastra de publicare automată, ora Chișinăului: 06:00-22:59 (rularea de
// 22:00 poate întârzia puțin; după 23:00 nu mai publică).
const PUBLISH_FROM_HOUR = 6;
const PUBLISH_UNTIL_HOUR = 23;

// Apelurile Claude consumă din limitele abonamentului Max, comune cu munca
// editorului — plafonul e în articole, nu în bani. 10/zi, max 3 pe rulare, ca
// să rămână articole și pentru știrile de seară. Linkurile manuale nu intră
// în plafon: editorul a decis explicit.
const DAILY_ARTICLE_LIMIT = 10;
const MAX_ARTICLES_PER_RUN = 3;

export interface PipelineRunSummary {
  collected: number;
  failedFeeds: string[];
  failedArticles: string[];
  skippedThin: string[]; // material prea puțin chiar și din textele integrale — nescrise
  groupsFormed: number;
  candidatesClassified: number;
  articlesPublished: number;
  bySection: Record<Section, number>;
  costUsd: number; // echivalent la prețuri API — doar pentru a urmări consumul din limite
  skipped?: string;
}

export async function runPipeline(): Promise<PipelineRunSummary> {
  const db = getDb();
  const [run] = await db.insert(pipelineRuns).values({}).returning({ id: pipelineRuns.id });

  const summary: PipelineRunSummary = {
    collected: 0,
    failedFeeds: [],
    failedArticles: [],
    skippedThin: [],
    groupsFormed: 0,
    candidatesClassified: 0,
    articlesPublished: 0,
    bySection: { regiuni: 0, national: 0, international: 0, diaspora: 0 },
    costUsd: 0,
  };

  try {
    // Rezervă pentru colectarea la 30 min: dacă cron-ul Vercel a căzut, nu
    // lucrăm pe date vechi.
    try {
      const c = await collectCandidates();
      summary.collected = c.inserted;
      summary.failedFeeds = c.failedFeeds;
    } catch (err) {
      summary.failedFeeds.push(`colectare: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Noaptea nu se publică nimic (decizia proprietarului: postările de noapte
    // în canal îi fac pe oameni să se dezaboneze). Verificat aici, nu doar în
    // orarul din pipeline.yml: GitHub amână rulările programate cu ore (rularea
    // de 22:00 a pornit la 00:30). Dimineața, fereastra de 6h prinde tot.
    const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Chisinau" }));
    if (hour < PUBLISH_FROM_HOUR || hour >= PUBLISH_UNTIL_HOUR) {
      summary.skipped = `în afara orelor de publicare (${hour}:00 la Chișinău) — doar colectare`;
      await finish(run.id, summary);
      return summary;
    }

    const rows = await db
      .select()
      .from(candidates)
      .where(
        or(
          gte(candidates.publishedAt, new Date(Date.now() - WINDOW_HOURS * 3600_000)),
          and(eq(candidates.manual, true), isNull(candidates.processedAt)),
        ),
      );
    const groups = groupCandidates(
      rows.map((r) => ({ ...r, sourceUrl: r.url, manual: r.manual && !r.processedAt })),
    );
    summary.groupsFormed = groups.length;

    // Duplicatele (draft/publicat în ultimele 72h) ies ÎNAINTE de clasificare —
    // nu plătim pentru ele. Linkurile manuale trec oricum: editorul a decis.
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0); // 06-22 Chișinău cade în aceeași zi UTC
    // doar articolele pipeline-ului (wpId null) — arhiva importată are createdAt = ziua importului
    const [{ today }] = await db
      .select({ today: count() })
      .from(articles)
      .where(and(gte(articles.createdAt, dayStart), isNull(articles.wpId)));
    const autoSlots = Math.max(0, Math.min(MAX_ARTICLES_PER_RUN, DAILY_ARTICLE_LIMIT - today));

    const recent = await loadRecentFingerprints();
    const fresh = groups
      .filter((g) => g.manual || (autoSlots > 0 && !isDuplicate(g, recent)))
      .sort(
        (a, b) =>
          Number(b.manual) - Number(a.manual) ||
          b.sourceNames.length - a.sourceNames.length ||
          b.items[0].publishedAt.getTime() - a.items[0].publishedAt.getTime(),
      )
      .slice(0, MAX_GROUPS_TO_CLASSIFY);

    const classifications = fresh.length ? await classifyGroups(fresh) : [];
    // Duplicatele semnalate de clasificator se contopesc în grupul anterior —
    // mai multe surse = scor mai bun și un singur articol.
    classifications.forEach((c, i) => {
      if (c?.sameAs === undefined) return;
      const target = fresh[resolve(classifications, c.sameAs)];
      target.items.push(...fresh[i].items);
      target.sourceNames = [...new Set([...target.sourceNames, ...fresh[i].sourceNames])];
      target.candidateIds.push(...fresh[i].candidateIds);
      target.manual ||= fresh[i].manual;
    });
    const scored: ScoredCandidate[] = [];
    classifications.forEach((classification, i) => {
      if (!classification || classification.sameAs !== undefined) return;
      scored.push({ group: fresh[i], classification, qualityScore: computeQualityScore(fresh[i], classification) });
    });
    summary.candidatesClassified = scored.length;

    const toPublish = scored.filter((c) => c.group.manual);
    const bySection = new Map<Section, ScoredCandidate[]>();
    for (const c of scored) {
      const { section, reject } = c.classification;
      if (c.group.manual || reject || c.qualityScore < SECTION_CONFIG[section].minScore) continue;
      bySection.set(section, [...(bySection.get(section) ?? []), c]);
    }
    const auto = [...bySection].flatMap(([section, list]) =>
      list.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, SECTION_CONFIG[section].cap),
    );
    toPublish.push(...auto.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, autoSlots));

    const usedImageIds = await loadUsedImageIds();
    const published = await mapWithConcurrency(toPublish, PUBLISH_CONCURRENCY, async (c): Promise<Section | null> => {
      try {
        const generated = await generateArticle(c.group, c.classification);
        if (!generated) {
          summary.skippedThin.push(c.group.representativeTitle.slice(0, 80));
          return null;
        }
        const image = await findArticleImage(generated.stock_query, generated.image_prompt, generated.slug, usedImageIds);
        await publishArticle(c, generated, image);
        if (c.group.manual) {
          await db.update(candidates).set({ processedAt: new Date() }).where(inArray(candidates.id, c.group.candidateIds));
        }
        return c.classification.section;
      } catch (err) {
        const msg = `${c.group.representativeTitle.slice(0, 80)}: ${err instanceof Error ? err.message : String(err)}`;
        summary.failedArticles.push(msg);
        console.error(`Articol eșuat: ${msg}`);
        return null;
      }
    });

    for (const section of published) {
      if (!section) continue;
      summary.articlesPublished++;
      summary.bySection[section]++;
    }
    await finish(run.id, summary);
    return summary;
  } catch (err) {
    await alertEditor(`Rularea a căzut: ${err instanceof Error ? err.message : String(err)}`);
    summary.costUsd = spentUsd();
    await db
      .update(pipelineRuns)
      .set({ finishedAt: new Date(), costUsd: summary.costUsd, errorMessage: String(err) })
      .where(eq(pipelineRuns.id, run.id));
    throw err;
  }
}

// Lanț same_as (3 -> 1 -> 0) până la grupul rădăcină; sameAs < i garantează terminarea.
function resolve(classifications: ({ sameAs?: number } | null)[], i: number): number {
  const next = classifications[i]?.sameAs;
  return next === undefined ? i : resolve(classifications, next);
}

async function finish(runId: number, summary: PipelineRunSummary) {
  summary.costUsd = Math.round(spentUsd() * 1000) / 1000;
  const problems = [
    ...summary.failedFeeds.map((f) => `Feed: ${f}`),
    ...summary.failedArticles.map((a) => `Articol: ${a}`),
  ];
  if (problems.length) await alertEditor(problems.join("\n"));
  await getDb()
    .update(pipelineRuns)
    .set({
      finishedAt: new Date(),
      candidatesFetched: summary.collected,
      candidatesClassified: summary.candidatesClassified,
      articlesPublished: summary.articlesPublished,
      costUsd: summary.costUsd,
      errorMessage: summary.skipped ?? null,
    })
    .where(eq(pipelineRuns.id, runId));
}
