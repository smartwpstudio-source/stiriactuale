import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";
import { structured, OPUS_MODEL } from "./llm";
import { stripDiacritics } from "./text-normalize";
import type { Impact } from "@/lib/impact-types";
import type { RuNews } from "@/lib/ru-news-public";

// Știrile în rusă, selectiv (decizia proprietarului, 2026-10-11): se traduce o
// știre publicată dacă are bloc de impact, e importantă la nivel național
// (pushWorthy), e din regiunile vorbitoare de rusă sau din diaspora din
// Rusia / Israel. Niciodată: Lumea, „pe scurt”, analizele, arhiva.

// slug-urile reale din RAION_NAMES (geo.ts): Găgăuzia are doar gagauzia și
// ceadir-lunga; malul stâng: transnistria și rabnita
const RU_LOCALITIES = new Set(["balti", "gagauzia", "ceadir-lunga", "taraclia", "basarabeasca", "transnistria", "rabnita"]);
// COUNTRY_NAMES n-are Ucraina — de adăugat aici dacă apare țara
const RU_COUNTRIES = new Set(["rusia", "israel"]);
const TRANSNISTRIA = /transnistr|tiraspol|stanga nistrului/;

export interface RuCandidate {
  section: string;
  kind: string;
  archived: boolean;
  impact: Impact | null;
  pushWorthy: boolean;
  locality: string | null;
  country: string | null;
  title: string;
  leadText: string;
}

const plain = (s: string) => stripDiacritics(s).toLowerCase();

export function shouldTranslateRu(a: RuCandidate): boolean {
  if (a.archived || a.section === "international" || a.kind === "pe-scurt" || a.kind === "analiza") return false;
  return (
    a.impact != null ||
    a.pushWorthy ||
    (a.locality != null && RU_LOCALITIES.has(a.locality)) ||
    // doar titlul și leadul: în corp, Transnistria apare des doar ca fundal
    TRANSNISTRIA.test(plain(`${a.title} ${a.leadText}`)) ||
    (a.section === "diaspora" && a.country != null && RU_COUNTRIES.has(a.country))
  );
}

// Cifrele unui text, ca multiset sortat: „1 500” = „1.500” = „1500”, „34,22” = „34.22”.
export function numbersOf(text: string): string[] {
  const t = text.replace(/<[^>]+>/g, " ").replace(/(\d)[\s.  ](?=\d{3}\b)/g, "$1");
  return (t.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(".", ",")).sort();
}

export const hrefsOf = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).sort();

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// Traducerea se salvează doar cu aceleași cifre (titlu; lead + corp + bloc) și
// aceleași linkuri ca originalul. null = în regulă, altfel motivul.
export function ruMismatch(ro: { title: string; lead: string; bodyHtml: string; impact?: Impact | null }, ru: RuNews): string | null {
  const block = (i?: { cine: string; ce: string; cand?: string; pasi: string[] } | null) => (i ? [i.cine, i.ce, i.cand ?? "", ...i.pasi].join(" ") : "");
  if (!same(numbersOf(ro.title), numbersOf(ru.title))) return `cifre diferite în titlu: ${numbersOf(ro.title)} / ${numbersOf(ru.title)}`;
  const a = numbersOf(`${ro.lead} ${ro.bodyHtml} ${block(ro.impact)}`);
  const b = numbersOf(`${ru.lead} ${ru.bodyHtml} ${block(ru.impact)}`);
  if (!same(a, b)) return `cifre diferite în text: lipsă [${a.filter((x) => !b.includes(x))}], în plus [${b.filter((x) => !a.includes(x))}]`;
  if (!same(hrefsOf(ro.bodyHtml), hrefsOf(ru.bodyHtml))) return "linkuri diferite";
  if (!!ro.impact !== !!ru.impact) return "blocul de impact lipsește";
  return null;
}

const SYSTEM = [
  "Traduci în rusă o știre a site-ului moldovenesc Știri Actuale, pentru cititorii vorbitori de rusă din Moldova și din diaspora.",
  "Reguli obligatorii:",
  "1. Aceleași fapte, nimic adăugat sau scos: cifre, date, ore, sume, procente, articole de lege, nume și linkuri — identice. Fără comentarii, fără explicații în plus.",
  "2. Numerele se scriu cu cifre exact ca în original (nu le transforma în cuvinte și nici cuvintele în cifre); doar formatul rusesc: zecimale cu virgulă (34,22), miile cu spațiu (1 500). Datele: „8 октября 2026 года”.",
  "3. Rusă naturală, cum se vorbește în Moldova. Instituțiile: denumirea rusă folosită oficial în Moldova + acronimul românesc între paranteze la prima mențiune, ex. „Агентство государственных услуг (ASP)”, „Национальная касса социального страхования (CNAS)”, „Государственная налоговая служба (SFS)”, „Генеральный инспекторат по чрезвычайным ситуациям (IGSU)”, „Национальное агентство по регулированию в энергетике (ANRE)”. Localitățile cu forma rusă uzuală (Кишинёв, Бельцы, Комрат, Тирасполь).",
  "4. HTML-ul corpului rămâne cu aceeași structură (<p>, <h2>, <ul>, <li>, <a>); fiecare href rămâne EXACT același. Fără <h1>, fără stiluri.",
  "5. „(VIDEO)” / „(FOTO)” de la sfârșitul titlului devin „(ВИДЕО)” / „(ФОТО)”.",
  "6. metaDescription: 140-160 de caractere, în rusă.",
].join("\n");

function schema(withImpact: boolean) {
  const impact = {
    type: "object",
    properties: {
      cine: { type: "string" },
      ce: { type: "string" },
      cand: { type: "string", description: "Doar dacă originalul are câmpul „cand”." },
      pasi: { type: "array", items: { type: "string" } },
    },
    required: ["cine", "ce", "pasi"],
  };
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      lead: { type: "string" },
      bodyHtml: { type: "string" },
      metaDescription: { type: "string" },
      ...(withImpact ? { impact } : {}),
    },
    required: ["title", "lead", "bodyHtml", "metaDescription", ...(withImpact ? ["impact"] : [])],
  };
}

type Row = typeof articles.$inferSelect;

// Traducerea unui articol, verificată; null dacă nu trece verificarea.
export async function translateRu(a: Pick<Row, "title" | "leadText" | "bodyHtml" | "impact">): Promise<{ ru: RuNews | null; why?: string }> {
  const impact = a.impact && { cine: a.impact.cine, ce: a.impact.ce, cand: a.impact.cand, pasi: a.impact.pasi };
  const ru = await structured<RuNews>({
    model: OPUS_MODEL,
    system: SYSTEM,
    prompt: JSON.stringify({ title: a.title, lead: a.leadText, bodyHtml: a.bodyHtml, ...(impact ? { impact } : {}) }),
    schema: schema(!!impact),
    maxBudgetUsd: 0.5,
  });
  if (!impact) delete ru.impact;
  else if (ru.impact && !impact.cand) delete ru.impact.cand;
  ru.metaDescription = ru.metaDescription.slice(0, 200);
  const why = ruMismatch({ title: a.title, lead: a.leadText, bodyHtml: a.bodyHtml, impact: a.impact }, ru);
  return why ? { ru: null, why } : { ru };
}

// Articolele publicate în ultimele 7 zile care se califică și n-au încercat
// traducerea (ruUpdatedAt null — editarea din admin și completarea unei
// știri pe scurt îl golesc). O încercare eșuată nu se repetă: ruUpdatedAt
// rămâne setat, ru rămâne null.
// ponytail: un eșec nu se mai reîncearcă automat; reîncercare = golește ruUpdatedAt.
export async function translatePendingRu(limit = 10): Promise<{ done: number; failed: string[] }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        isNull(articles.wpId),
        isNull(articles.ruUpdatedAt),
        gte(articles.publishedAt, new Date(Date.now() - 7 * 86400_000)),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(80);
  const todo = rows.filter(shouldTranslateRu).slice(0, limit);
  let done = 0;
  const failed: string[] = [];
  for (const a of todo) {
    try {
      const { ru, why } = await translateRu(a);
      await db.update(articles).set({ ru, ruUpdatedAt: new Date() }).where(eq(articles.id, a.id));
      if (ru) done++;
      else {
        failed.push(`${a.id}: ${why}`);
        console.log(`Traducere RU respinsă (${a.id}): ${why}`);
      }
    } catch (err) {
      // eroare tehnică (limită, rețea): rămâne de încercat la rularea următoare
      failed.push(`${a.id}: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`Traducere RU eșuată (${a.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { done, failed };
}
