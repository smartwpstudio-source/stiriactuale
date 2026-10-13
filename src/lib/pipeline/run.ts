import { chisinauHour, lastRunHour, morningHour } from "@/lib/schedule";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles, candidates, guideChecks, pipelineRuns } from "./db/schema";
import { collectCandidates } from "./collect";
import { groupCandidates } from "./dedup";
import { classifyGroups } from "./classify";
import { generateArticle } from "./generate";
import { computeQualityScore } from "./scoring";
import { findArticleImage, sourcePhoto } from "./image";
import { loadOfficialItems, matchOfficialPhoto } from "./official-photos";
import { loadPlaces, loadSymbolPhotos, matchPlacePhoto } from "./places";
import { checkRecent } from "./recent-duplicate";
import { mediaTag } from "./media-tag";
import { guideRuleMode, pipelineEnabled } from "./settings";
import { checkGuide, guideDecision, guideExempt, type GuideRuleMode } from "./guide-rule";
import { toEmbedUrl, youtubeThumb } from "@/lib/video";
import { shortVideoArticle } from "./video-article";
import { isDuplicate, loadRecentFingerprints, loadUsedImageIds, publishArticle, updateBriefArticle } from "./publish";
import { mapWithConcurrency } from "./concurrency";
import { spentUsd } from "./llm";
import { autoPush } from "./auto-push";
import { translatePendingRu } from "./ru-news";
import { alertEditor } from "@/lib/telegram";
import type { Section } from "@/lib/content/types";
import type { ScoredCandidate } from "./types";

// Prag minim + plafon per rulare, independente pe secțiuni. Regiunile și
// diaspora au prag mai mic — prioritatea redacției.
const SECTION_CONFIG: Record<Section, { minScore: number; cap: number }> = {
  regiuni: { minScore: 45, cap: 4 },
  national: { minScore: 55, cap: 4 },
  international: { minScore: 65, cap: 2 },
  diaspora: { minScore: 45, cap: 2 },
};

// Fereastra de candidați: rulările sunt la 2h, deci un eveniment e văzut de
// 3 ori — dacă prinde surse noi, poate trece pragul la rularea următoare.
const WINDOW_HOURS = 6;
const MAX_GROUPS_TO_CLASSIFY = 40;
const PUBLISH_CONCURRENCY = 4;
const FEED_ALERT_MIN = 3; // feed-uri căzute deodată, din 14
// Fereastra de publicare automată, ora Chișinăului: de la mesajul de dimineață
// (07:00 / 08:00 în zilele libere) până la 21:59 (20:59 în zilele libere), apoi pauză (src/lib/schedule.ts).

// Apelurile Claude consumă din limitele abonamentului Max, comune cu munca
// editorului — plafonul e în articole, nu în bani. 30/zi, max 4 pe rulare (9
// rulări între 06 și 22), ca să rămână articole și pentru știrile de seară.
// Consumul îl controlează editorul cu butonul Pornit/Oprit din admin.
// Linkurile manuale nu intră în plafon: editorul a decis explicit.
const DAILY_ARTICLE_LIMIT = 50;
const MAX_ARTICLES_PER_RUN = 4;

// Regulile vechi de selecție automată (reject de la clasificator, pragul de
// scor al secțiunii). Regula „știre cu ghid” vine abia DUPĂ ele (guideStep).
export function passesSelection(c: ScoredCandidate): boolean {
  const { section, reject } = c.classification;
  return !c.group.manual && !reject && c.qualityScore >= SECTION_CONFIG[section].minScore;
}

export interface PipelineRunSummary {
  collected: number;
  failedFeeds: string[];
  failedArticles: string[];
  skippedThin: string[]; // material prea puțin chiar și din textele integrale — nescrise
  groupsFormed: number;
  candidatesClassified: number;
  articlesPublished: number;
  articlesUpdated: number; // știri pe scurt completate
  bySection: Record<Section, number>;
  costUsd: number; // echivalent la prețuri API — doar pentru a urmări consumul din limite
  ruTranslated: number; // știri traduse în rusă (ru-news.ts)
  guideMissing: string[]; // știri fără ghid (regula „știre cu ghid”): în strict nepublicate, în raport doar notate
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
    articlesUpdated: 0,
    bySection: { regiuni: 0, national: 0, international: 0, diaspora: 0 },
    costUsd: 0,
    ruTranslated: 0,
    guideMissing: [],
  };

  try {
    // Butonul Pornit/Oprit din admin: oprit = doar linkurile editorului
    // („Publică acum”), fără colectare și fără știri automate.
    const autoOn = await pipelineEnabled();
    // Rezervă pentru colectarea orară: dacă cron-ul Vercel a căzut, nu
    // lucrăm pe date vechi.
    if (autoOn) {
      try {
        const c = await collectCandidates();
        summary.collected = c.inserted;
        summary.failedFeeds = c.failedFeeds;
      } catch (err) {
        summary.failedFeeds.push(`colectare: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Noaptea nu se publică automat (decizia proprietarului: postările de
    // noapte în canal îi fac pe oameni să se dezaboneze). Dimineața, fereastra
    // de 6h prinde tot. Linkurile adăugate de editor se publică și noaptea —
    // butonul "Publică acum" e pentru știri urgente.
    const hour = chisinauHour();
    const firstHour = morningHour();
    const night = hour < firstHour || hour > lastRunHour() || !autoOn;

    const rows = await db
      .select()
      .from(candidates)
      .where(
        or(
          // prima rulare a dimineții (06:00) ia toată noaptea, de la 22:00
          gte(candidates.publishedAt, new Date(Date.now() - (hour === firstHour ? hour + 2 : WINDOW_HOURS) * 3600_000)),
          and(eq(candidates.manual, true), isNull(candidates.processedAt)),
        ),
      );
    if (night && !rows.some((r) => r.manual && !r.processedAt)) {
      summary.skipped = autoOn ? `în afara orelor de publicare (${hour}:00 la Chișinău) — doar colectare` : "pipeline oprit din admin";
      await finish(run.id, summary);
      return summary;
    }
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
      .where(
        and(
          gte(articles.createdAt, dayStart),
          isNull(articles.wpId),
          // linkurile editorului nu ocupă locuri din limita zilnică (2026-10-13)
          sql`not exists (select 1 from candidates c where c.manual and jsonb_exists(${articles.sourceUrls}, c.url))`,
        ),
      );
    // dimineața (06:00) se strâng știrile nopții: până la 6, pentru rezumatul de la 08:00
    const perRun = hour === firstHour ? 6 : MAX_ARTICLES_PER_RUN;
    const autoSlots = night ? 0 : Math.max(0, Math.min(perRun, DAILY_ARTICLE_LIMIT - today));

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

    // articolele din ultimele 7 zile: un grup nou poate completa o știre „pe
    // scurt” (același eveniment, încă în desfășurare — doar în primele 48h) sau
    // poate fi continuarea unei povești (articol nou, cu link spre cel vechi)
    const recentRows = await db
      .select({ id: articles.id, title: articles.title, lead: articles.leadText, kind: articles.kind, publishedAt: articles.publishedAt })
      .from(articles)
      .where(and(isNull(articles.wpId), eq(articles.status, "published"), gte(articles.publishedAt, new Date(Date.now() - 7 * 86400_000))))
      .orderBy(desc(articles.publishedAt))
      .limit(80);
    const recentArticles = recentRows.map((r) => ({
      id: r.id,
      title: r.title,
      // doar „pe scurt” se completează (48h); știrea completă primește continuări
      open: r.kind === "pe-scurt" && r.publishedAt.getTime() > Date.now() - 48 * 3600_000,
    }));
    const classifications = fresh.length ? await classifyGroups(fresh, recentArticles) : [];
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
    const updates: (ScoredCandidate & { articleId: number })[] = [];
    classifications.forEach((classification, i) => {
      if (!classification || classification.sameAs !== undefined) return;
      const c = { group: fresh[i], classification, qualityScore: computeQualityScore(fresh[i], classification) };
      if (classification.updateOf !== undefined && !classification.reject) updates.push({ ...c, articleId: classification.updateOf });
      else scored.push(c);
    });
    summary.candidatesClassified = scored.length;

    const toPublish = scored.filter((c) => c.group.manual);
    // linkurile editorului nu se filtrează, dar primesc și ele ghidul potrivit
    // (modul „raport” nu respinge niciodată) — 2026-10-13, știrea Moldsilva
    for (const c of toPublish) await guideStep(c, "raport", summary).catch(() => true);
    const bySection = new Map<Section, ScoredCandidate[]>();
    for (const c of scored) {
      if (!passesSelection(c)) continue;
      const { section } = c.classification;
      bySection.set(section, [...(bySection.get(section) ?? []), c]);
    }
    const auto = [...bySection].flatMap(([section, list]) =>
      // dimineața (06:00), Lumea are prioritate: noaptea Moldova doarme, știrile vin din lume
      list.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, section === "international" && hour === firstHour ? 4 : SECTION_CONFIG[section].cap),
    );
    // a doua verificare de dubluri, per știre, față de articolele din ultimele
    // 48h (recent-duplicate.ts) — locul unei dubluri îl ia următoarea știre
    const recent48 = recentRows
      .filter((r) => r.publishedAt.getTime() > Date.now() - 48 * 3600_000)
      .map((r) => ({ id: r.id, title: r.title, lead: r.lead }));
    let autoTaken = 0;
    const guideMode: GuideRuleMode = await guideRuleMode().catch(() => "raport");
    for (const c of auto.sort((a, b) => b.qualityScore - a.qualityScore)) {
      if (autoTaken >= autoSlots) break;
      const v = await checkRecent(c.group, recent48);
      if (v.duplicateOf) {
        console.log(`Dublură a articolului ${v.duplicateOf}, nescrisă: ${c.group.representativeTitle.slice(0, 80)}`);
        continue;
      }
      if (v.continuesId && c.classification.continuesId === undefined) {
        c.classification.continuesId = v.continuesId;
        c.classification.continuesTitle = recent48.find((r) => r.id === v.continuesId)?.title;
      }
      // regula „știre cu ghid” (guide-rule.ts): filtru ÎN PLUS, după toate
      // regulile de mai sus; în strict, locul știrii fără ghid îl ia următoarea
      if (!(await guideStep(c, guideMode, summary))) continue;
      toPublish.push(c);
      autoTaken++;
      // și știrile alese în aceeași rulare intră în comparație (2026-10-05:
      // două articole despre aceeași tranșă UE, scrise în aceeași rulare)
      recent48.unshift({ id: -autoTaken, title: c.group.representativeTitle, lead: c.group.items[0]?.summary.slice(0, 300) ?? "" });
    }

    const [usedImageIds, officialItems] = await Promise.all([loadUsedImageIds(), toPublish.length ? loadOfficialItems() : []]);
    const places = [...loadPlaces(), ...(await loadSymbolPhotos().catch(() => []))];
    // pozele comunicatelor deja folosite în ultimele zile (image_source)
    const usedOfficial = new Set(
      (await db.select({ src: articles.imageSource }).from(articles).where(isNotNull(articles.imageSource)).orderBy(desc(articles.publishedAt)).limit(200)).map((r) => r.src!),
    );
    // pozele ultimelor articole, pentru rotația pozelor din arhivă (places.ts)
    const recentImages = (
      await db.select({ url: articles.imageUrl }).from(articles).orderBy(desc(articles.publishedAt)).limit(80)
    ).flatMap((r) => (r.url ? [r.url] : []));
    const publishedIds: number[] = [];
    const published = await mapWithConcurrency(toPublish, PUBLISH_CONCURRENCY, async (c): Promise<Section | null> => {
      try {
        // material puțin: linkul video al editorului -> știre video scurtă, scrisă
        // în română de AI din descriere (oricare ar fi limba ei); fără AI, doar
        // varianta citată (video-article.ts). Altfel orice știre aleasă iese
        // „pe scurt” (regula proprietarului), completată la rulările următoare.
        let kind: "stire" | "pe-scurt" = "stire";
        let generated = await generateArticle(c.group, c.classification);
        // link video sau postare Telegram (și fără video): textul postării e tot
        // materialul — știre scurtă din el, nu „prea puțin text”
        const isShortPost = c.group.manual && c.group.items.some((i) => toEmbedUrl(i.sourceUrl) || i.sourceUrl.startsWith("https://t.me/"));
        if (!generated && isShortPost) generated = await generateArticle(c.group, c.classification, "video");
        if (!generated && c.group.manual) generated = shortVideoArticle(c.group);
        if (!generated) {
          generated = await generateArticle(c.group, c.classification, "brief");
          if (generated) kind = "pe-scurt";
        }
        if (!generated) {
          summary.skippedThin.push(c.group.representativeTitle.slice(0, 80));
          // linkul editorului nu rămâne la coadă la nesfârșit — editorul e anunțat
          if (c.group.manual) {
            await db.update(candidates).set({ processedAt: new Date() }).where(inArray(candidates.id, c.group.candidateIds));
            summary.failedArticles.push(`${c.group.representativeTitle.slice(0, 80)}: prea puțin text la sursă — nescris`);
          }
          return null;
        }
        // cu video YouTube, captura din video ține loc de poză (youtubeThumb);
        // altfel poza reală a unei instituții (semnată în sursă sau din
        // comunicatul ei), poza reală a locului din arhivă, apoi stock ales
        // după subiect / generată
        const subject = `${generated.titlu}. ${generated.lead}`;
        // poza încărcată de editor bate orice altceva
        const editor = c.group.photo && { url: c.group.photo.url, resourceId: null, credit: c.group.photo.credit ?? undefined, alt: c.group.photo.alt ?? undefined };
        // poza unui comunicat se folosește o singură dată (altfel două știri despre
        // același subiect stau alăturate cu aceeași poză)
        const official = editor
          ? null
          : await matchOfficialPhoto(subject, officialItems.filter((o) => !usedOfficial.has(o.photo))).then((m) => m && { url: m.photo, credit: m.credit });
        if (official) usedOfficial.add(official.url);
        const place = editor || official ? null : await matchPlacePhoto(subject, places, c.classification.locality, recentImages);
        const image = editor
          ? editor
          : youtubeThumb(generated.video_url)
          ? null
          : (place && { url: place.url, resourceId: null, credit: place.credit, alt: place.alt }) ??
            ((official && (await sourcePhoto(official, generated.slug))) ??
            (await findArticleImage(generated.stock_query, generated.image_prompt, generated.slug, usedImageIds, subject)));
        // (VIDEO) / (FOTO) la sfârșitul titlului: cititorul știe din listă ce găsește
        generated.titlu = mediaTag(generated.titlu, !!generated.video_url, c.group.items.some((i) => i.sourceUrl.includes("?foto=1")));
        const articleId = await publishArticle(c, generated, image, kind);
        publishedIds.push(articleId);
        if (c.guide?.checkId) await db.update(guideChecks).set({ articleId }).where(eq(guideChecks.id, c.guide.checkId)).catch(() => {});
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

    // știri pe scurt completate: rescrise complet doar dacă acum e material
    // destul; altfel rămân cum sunt (următoarea rulare mai încearcă)
    for (const u of updates) {
      try {
        const [old] = await db.select({ sources: articles.sources, lead: articles.leadText, title: articles.title }).from(articles).where(eq(articles.id, u.articleId));
        if (!old) continue;
        const group = {
          ...u.group,
          items: [
            ...u.group.items,
            ...old.sources.map((s) => ({ sourceUrl: s.url, sourceName: s.name, title: old.title, summary: old.lead, publishedAt: new Date(), feedId: "update" })),
          ],
        };
        const generated = await generateArticle(group, u.classification);
        if (generated) {
          await updateBriefArticle(u.articleId, u, generated);
          summary.articlesUpdated++;
        }
        if (u.group.manual) {
          await db.update(candidates).set({ processedAt: new Date() }).where(inArray(candidates.id, u.group.candidateIds));
        }
      } catch (err) {
        summary.failedArticles.push(`actualizare ${u.articleId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // push automat, doar după reguli stricte (auto-push.ts); pe rând, după publicare
    for (const id of publishedIds) {
      const r = await autoPush(id);
      if (r) console.log(r);
    }
    // traducerea în rusă (ru-news.ts): articolele noi care se califică și cele
    // schimbate între timp; o eroare nu atinge publicarea în română
    summary.ruTranslated = (await translatePendingRu().catch((err) => (console.error(`Traducere RU: ${err}`), { done: 0 }))).done;

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

// Pasul „știre cu ghid” pentru o știre care a trecut regulile vechi: caută
// unealta (reguli, apoi AI), notează verificarea și spune dacă se publică.
async function guideStep(c: ScoredCandidate, mode: GuideRuleMode, summary: PipelineRunSummary): Promise<boolean> {
  const input = {
    title: c.group.representativeTitle,
    summary: c.group.items[0]?.summary.slice(0, 700) ?? "",
    section: c.classification.section,
    topics: c.classification.topics,
  };
  const exempt = guideExempt({ pushWorthy: c.classification.pushWorthy, ...input });
  const check = await checkGuide(input);
  const { publish, wouldReject } = guideDecision(mode, check, exempt);
  const [row] = await getDb()
    .insert(guideChecks)
    .values({
      title: input.title.slice(0, 500),
      section: input.section,
      tool: check.tool,
      via: check.via,
      exempt: exempt ? "urgenta-lege" : null,
      topic: check.topic ?? null,
      reason: check.reason ?? null,
      mode,
      rejected: !publish,
    })
    .returning({ id: guideChecks.id })
    .catch((err) => (console.error(`guide_checks: ${err}`), []));
  c.guide = { tool: check.tool, checkId: row?.id };
  if (wouldReject) {
    summary.guideMissing.push(`${input.title.slice(0, 80)}${check.topic ? ` [${check.topic}]` : ""}`);
    console.log(`Fără ghid${publish ? " (raport: se publică)" : " — nepublicată"}: ${input.title.slice(0, 80)}`);
  }
  return publish;
}

// Lanț same_as (3 -> 1 -> 0) până la grupul rădăcină; sameAs < i garantează terminarea.
function resolve(classifications: ({ sameAs?: number } | null)[], i: number): number {
  const next = classifications[i]?.sameAs;
  return next === undefined ? i : resolve(classifications, next);
}

async function finish(runId: number, summary: PipelineRunSummary) {
  summary.costUsd = Math.round(spentUsd() * 1000) / 1000;
  // Un feed lent o dată (timeout) nu e o problemă — colectarea revine la 30 de
  // minute. Alertă doar când pică colectarea sau mai multe feed-uri deodată.
  const feedsDown =
    summary.failedFeeds.length >= FEED_ALERT_MIN || summary.failedFeeds.some((f) => f.startsWith("colectare:"));
  const problems = [
    ...(feedsDown ? summary.failedFeeds.map((f) => `Feed: ${f}`) : []),
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
