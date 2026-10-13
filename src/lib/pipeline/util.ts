import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles, utilPlan } from "./db/schema";
import { getSetting, PLAN_REQUEST, setSetting, UTIL_TYPES, utilHours, WRITE_REQUEST } from "./util-plan";
import { OPUS_MODEL, structured } from "./llm";
import { SCHEMA } from "./generate";
import { loadCatalog } from "./guide-rule";
import { findArticleImage } from "./image";
import { loadUsedImageIds, publishArticle } from "./publish";
import type { GeneratedArticle, ScoredCandidate } from "./types";
import { pipelineEnabled } from "./settings";
import { getGuides } from "@/lib/content/guides";
import { getRecipes, recipePath } from "@/lib/content/recipes";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { RAION_NAMES } from "@/lib/content/geo";
import { getSaintDay } from "@/lib/calendar-data";
import { addDays, churchDay, civilDays, isDayOff, weekday, yearFasts, yearFeasts } from "@/lib/orthodox";
import { chisinauHour, lastRunHour, morningHour, todayChisinau } from "@/lib/schedule";

// Rubrica „Util” (decizia proprietarului, 2026-10-14): 2-3 articole proprii pe
// zi, pe lângă știri — ce nu au celelalte portaluri. Ordinea temelor:
// 1) evenimentele din următoarele 7 zile (hramuri, sărbători, termene, ora de iarnă…);
// 2) anotimpul (frig, gripă, anvelope, umbrela);
// 3) calculatoarele și ghidurile site-ului, în context (cum le folosești);
// 4) rețete; 5) sfântul zilei, la sfinții mari.
// Fiecare articol trimite OBLIGATORIU la un ghid, calculator sau rețetă de pe site.
// Planul pe săptămâna următoare (luni–duminică) îl propune AI-ul vinerea dimineața
// (sau la cererea editorului), editorul îl aprobă în weekend în /admin/util/, iar
// pipeline-ul scrie câte un articol aprobat la orele Util.

const PLAN_DAYS = 7;
const PLAN_WEEKDAY = 5; // vineri (decizia proprietarului, 2026-10-14: săptămâni de luni până duminică)
const PER_DAY = 3;
const key = (d: Date) => d.toISOString().slice(0, 10);


// Catalogul uneltelor + rețetele (id | titlu)
async function catalog() {
  const [{ lines, ids }, recipes] = await Promise.all([loadCatalog(), getRecipes()]);
  const rec = recipes.map((r) => `reteta:${r.slug} | Rețetă: ${r.title}`);
  return { lines: `${lines}\n${rec.join("\n")}`, ids: new Set([...ids, ...rec.map((r) => r.split(" | ")[0])]) };
}

// Calendarul zilelor: sărbători, sfinți mari, posturi, zile libere
async function calendarLines(days: Date[]): Promise<string> {
  const years = [...new Set(days.map((d) => d.getUTCFullYear()))];
  const feasts = years.flatMap((y) => [...yearFeasts(y, "vechi"), ...civilDays(y)]);
  const fasts = years.flatMap((y) => yearFasts(y, "vechi"));
  const out: string[] = [];
  for (const d of days) {
    const c = churchDay(d, "vechi");
    const saint = await getSaintDay(c.month, c.day);
    const parts = [
      ...feasts.filter((f) => f.date.getTime() === d.getTime()).map((f) => f.name),
      ...(saint?.cruce === "rosie" ? [`sfinți (cruce roșie): ${saint.sarbatoare ?? saint.sfinti.slice(0, 2).join("; ")}`] : []),
      ...fasts.filter((f) => d >= f.from && d <= f.to).map((f) => f.name),
    ];
    out.push(`${key(d)} ${weekday(d)}${isDayOff(d) ? " (zi liberă)" : ""}: ${parts.join(" · ") || "—"}`);
  }
  return out.join("\n");
}

const PLAN_SYSTEM = [
  "Ești redactorul-șef al stiriactuale.info, site de știri din Republica Moldova cu conceptul „Știri cu soluții”.",
  "Planifici rubrica UTIL: articole proprii, practice, pe care nu le au celelalte portaluri. Fiecare răspunde la „ce fac eu concret” pentru oamenii din Moldova.",
  "Ordinea temelor (de la cea mai importantă):",
  "1) eveniment: ce se întâmplă în Moldova în zilele planului — hramuri de oraș, sărbători, termene la taxe și acte, începutul sezonului de încălzire, ora de iarnă/vară, vacanțe școlare, examene, schimbări anunțate în știri. Articolul apare cu 1-4 zile ÎNAINTE de eveniment. Verifică data pe internet, din surse oficiale; dacă nu e sigură, nu o planifica.",
  "2) sezon: anotimpul și vremea (frig, gripă și răceli, anvelope de iarnă, cum citești prognoza, cum te îmbraci, casa iarna).",
  "3) unealta: un calculator sau ghid al site-ului explicat în context („A venit factura: cum verifici dacă e corectă” + calculatorul). Promovează calculatoarele de cel puțin 3 ori pe săptămână.",
  "4) reteta: doar cu un motiv (post, sărbătoare, sezon) — maximum 2 pe săptămână.",
  "5) sfant: doar la sfinții mari (cruce roșie) sau foarte populari în Moldova — povestea, tradițiile, ce se face în ziua aceea. Maximum 2 pe săptămână.",
  `Exact ${PER_DAY} articole pe zi, pentru fiecare zi cerută. Teme diferite între ele și față de cele deja planificate.`,
  "topic = titlul de lucru, concret, cu anul unde contează („Hramul Chișinăului 2026: programul și cum petreci în siguranță”).",
  "angle = 3-6 puncte despre ce acoperă articolul, practice (pași, ce verifici, unde suni, ce eviți).",
  "tools = 1-3 id-uri EXACTE din CATALOG (ghid:…, calc:…, model:…, reteta:…) — cel puțin unul, legat real de temă. Fără unealtă potrivită, alege altă temă.",
  "locality = slug-ul raionului DOAR la evenimentele locale (ex. chisinau, balti), altfel null.",
  "Fără politică de partid, fără teme medicale individuale (doze, diagnostice), fără teme care cer date pe care nu le poți verifica.",
].join("\n");

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string", description: "AAAA-LL-ZZ, una dintre zilele cerute" },
          type: { type: "string", enum: Object.keys(UTIL_TYPES) },
          topic: { type: "string" },
          angle: { type: "string" },
          tools: { type: "array", items: { type: "string" } },
          locality: { type: ["string", "null"] },
        },
        required: ["day", "type", "topic", "angle", "tools"],
      },
    },
  },
  required: ["items"],
};

interface PlanItem {
  day: string;
  type: string;
  topic: string;
  angle: string;
  tools: string[];
  locality?: string | null;
}

// Planul săptămânii următoare (luni–duminică): zilele cu mai puțin de PER_DAY teme active.
export async function planWeek(): Promise<number> {
  const db = getDb();
  const today = todayChisinau();
  const monday = addDays(today, (8 - today.getUTCDay()) % 7 || 7);
  const days = Array.from({ length: PLAN_DAYS }, (_, i) => addDays(monday, i));
  const existing = await db
    .select({ day: utilPlan.day })
    .from(utilPlan)
    .where(and(inArray(utilPlan.day, days.map(key)), inArray(utilPlan.status, ["propus", "aprobat", "publicat"])));
  const need = days.filter((d) => existing.filter((e) => e.day === key(d)).length < PER_DAY);
  if (!need.length) return 0;

  const since = new Date(Date.now() - 7 * 86400_000);
  const [cat, cal, news, done] = await Promise.all([
    catalog(),
    calendarLines(need),
    db.select({ t: articles.title }).from(articles).where(and(eq(articles.status, "published"), gte(articles.publishedAt, since))).orderBy(desc(articles.publishedAt)).limit(150),
    db.select({ t: utilPlan.topic }).from(utilPlan).where(gte(utilPlan.createdAt, new Date(Date.now() - 60 * 86400_000))),
  ]);
  const r = await structured<{ items: PlanItem[] }>({
    model: OPUS_MODEL,
    system: PLAN_SYSTEM,
    prompt: [
      `Azi: ${key(today)}. Planifică zilele: ${need.map(key).join(", ")}.`,
      `CALENDARUL ZILELOR:\n${cal}`,
      `ȘTIRILE PUBLICATE ÎN ULTIMELE 7 ZILE (caută în ele evenimente viitoare, termene, schimbări):\n${news.map((n) => `- ${n.t}`).join("\n")}`,
      `TEME DEJA PLANIFICATE (nu le repeta):\n${done.map((d) => `- ${d.t}`).join("\n") || "—"}`,
      `RAIOANE (slug): ${Object.keys(RAION_NAMES).join(", ")}`,
      `CATALOG:\n${cat.lines}`,
    ].join("\n\n"),
    schema: PLAN_SCHEMA,
    maxBudgetUsd: 3,
    web: true,
  });
  const wanted = new Set(need.map(key));
  const rows = r.items
    .map((i) => ({ ...i, tools: [...new Set(i.tools.filter((t) => cat.ids.has(t)))].slice(0, 3) }))
    .filter((i) => wanted.has(i.day) && i.type in UTIL_TYPES && i.tools.length && i.topic.trim())
    .map((i) => ({
      day: i.day,
      type: i.type,
      topic: i.topic.trim().slice(0, 300),
      angle: i.angle.trim().slice(0, 2000),
      tools: i.tools,
      locality: i.locality && i.locality in RAION_NAMES ? i.locality : null,
    }));
  if (rows.length) await db.insert(utilPlan).values(rows);
  return rows.length;
}

// Materialul uneltelor: textul ghidului, descrierea calculatorului, rețeta
async function toolMaterial(tools: string[]): Promise<{ text: string; links: Set<string> }> {
  const [guides, params, recipes] = await Promise.all([getGuides(), getCalcParams(), getRecipes()]);
  const calcs = availableCalculators(params);
  const links = new Set<string>();
  const parts: string[] = [];
  for (const t of tools) {
    const [kind, slug] = t.split(":");
    if (kind === "ghid") {
      const g = guides.find((x) => x.slug === slug);
      if (!g) continue;
      links.add(`/ghiduri/${slug}/`);
      parts.push(`### GHID „${g.title}” — /ghiduri/${slug}/ (verificat ${g.updated})\n${g.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 6000)}`);
    } else if (kind === "calc") {
      const c = calcs.find((x) => x.slug === slug);
      if (!c) continue;
      links.add(`/calculatoare/${slug}/`);
      parts.push(`### CALCULATOR „${c.title}” — /calculatoare/${slug}/\n${c.description}`);
    } else if (kind === "model") {
      links.add(`/modele-reclamatii/${slug}/`);
      parts.push(`### MODEL DE RECLAMAȚIE — /modele-reclamatii/${slug}/`);
    } else if (kind === "reteta") {
      const r = recipes.find((x) => x.slug === slug);
      if (!r) continue;
      links.add(recipePath(slug));
      parts.push(`### REȚETĂ „${r.title}” — ${recipePath(slug)}\n${r.description}\nIngrediente: ${r.ingredients.flatMap((g) => g.items.map((i) => i.name)).join(", ")}`);
    }
  }
  return { text: parts.join("\n\n"), links };
}

const WRITE_SYSTEM = [
  "Ești jurnalist la stiriactuale.info („Știri cu soluții”, Republica Moldova). Scrii un articol din rubrica UTIL: practic, clar, pentru oameni obișnuiți, cu pași concreți.",
  "Structură: lead-ul spune de ce contează acum; corpul are 3-6 subtitluri <h2> concrete și liste <ul>/<ol> cu pași, termene, ce verifici, unde suni, ce eviți. 500-900 de cuvinte, fără umplutură și fără moralizare.",
  "FAPTE (regula cea mai importantă): orice fapt concret — date, ore, programe, străzi închise, prețuri, tarife, sume, telefoane, adrese, decizii ale instituțiilor — vine DOAR din: (a) MATERIALUL primit de la site, (b) pagini pe care le-ai deschis acum cu WebFetch sau rezultate WebSearch, de preferință oficiale (gov.md, primării, politia.md, anre.md, bnm.md, meteo.md, msmps.gov.md, mec.gov.md, cnas.gov.md). Ce n-ai găsit într-o sursă NU scrii — formulezi general („urmărește anunțurile primăriei”), fără să comentezi lipsa.",
  "Sfaturile generale de bun-simț (cum te îmbraci iarna, cum rămâi în siguranță într-o mulțime) le poți da fără sursă, dar fără cifre și fără afirmații medicale; la sănătate: „urmează indicațiile medicului de familie”.",
  "LEGĂTURA CU SITE-UL (obligatorie): în text explici concret cum folosește cititorul unealta site-ului (calculatorul: ce introduce, ce află; ghidul: ce găsește acolo; rețeta: de ce acum). Pui 1-3 linkuri <a href=\"…\"> DOAR spre adresele din MATERIAL (ex. /calculatoare/…/), pe cuvintele potrivite din text. Niciun alt link.",
  "surse = paginile din care ai luat faptele (nume + adresa completă), cel puțin una; fără paginile stiriactuale.info.",
  "Fără ton de reclamă, fără „noi, redacția”, fără promisiuni de actualizare. Scrii exclusiv în română.",
].join("\n");

const { impact: _impact, ...baseProps } = SCHEMA.properties;
void _impact;
const WRITE_SCHEMA = {
  ...SCHEMA,
  properties: {
    ...baseProps,
    corp_html: { type: "string", description: "HTML: <p>, <h2>, <ul>, <ol>, <li>, <strong>, <a href> doar spre adresele din MATERIAL. 500-900 de cuvinte, 3-6 <h2>." },
    surse: {
      type: "array",
      items: { type: "object", properties: { nume: { type: "string" }, url: { type: "string" } }, required: ["nume", "url"] },
    },
  },
  required: [...SCHEMA.required, "surse"],
};

// Linkurile din corp: doar spre uneltele din material, restul devin text simplu
export function keepToolLinks(html: string, allowed: Set<string>): string {
  return html.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) =>
    allowed.has(href) ? `<a href="${href}">${text}</a>` : text,
  );
}

type Row = typeof utilPlan.$inferSelect;

async function writeItem(item: Row): Promise<number> {
  const { text, links } = await toolMaterial(item.tools);
  if (!links.size) throw new Error("uneltele din plan nu mai există");
  const gen = await structured<GeneratedArticle & { surse: { nume: string; url: string }[] }>({
    model: OPUS_MODEL,
    system: WRITE_SYSTEM,
    prompt: [
      `Azi e ${key(todayChisinau())}. Tipul: ${UTIL_TYPES[item.type as keyof typeof UTIL_TYPES] ?? item.type}.${item.locality ? ` Local: ${RAION_NAMES[item.locality]}.` : ""}`,
      `TEMA: ${item.topic}`,
      `CE ACOPERĂ:\n${item.angle}`,
      "Titlul începe cu cuvintele pe care oamenii le-ar căuta pe Google (cu anul, unde contează), concret, fără clickbait.",
      `MATERIAL DE LA SITE:\n${text}`,
    ].join("\n\n"),
    schema: WRITE_SCHEMA,
    maxBudgetUsd: 2,
    web: true,
  });
  const surse = (gen.surse ?? []).filter((s) => /^https?:\/\//.test(s.url) && !s.url.includes("stiriactuale.info")).slice(0, 6);
  if (!surse.length) throw new Error("fără surse");
  gen.corp_html = keepToolLinks(gen.corp_html, links);
  if (!/<a href=/.test(gen.corp_html)) throw new Error("fără link spre unealta site-ului");

  const image = await findArticleImage(gen.stock_query, gen.image_prompt, gen.slug, await loadUsedImageIds(), `${gen.titlu}. ${gen.lead}`);
  const now = new Date();
  const candidate: ScoredCandidate = {
    group: {
      representativeTitle: item.topic,
      items: surse.map((s) => ({ title: gen.titlu, summary: "", sourceName: s.nume.slice(0, 100), sourceUrl: s.url, publishedAt: now, feedId: "util" })),
      sourceNames: surse.map((s) => s.nume),
      manual: false,
      candidateIds: [],
    },
    classification: {
      section: item.locality ? "regiuni" : "national",
      locality: item.locality ?? undefined,
      topics: [],
      impact: 60,
      factualRichness: 60,
      confidence: 80,
      reject: false,
      pushWorthy: false,
      sensitive: false,
    },
    qualityScore: 60,
    // caseta de sub articol: primul ghid / calculator / model (rețetele sunt linkate în text)
    guide: { tool: item.tools.find((t) => !t.startsWith("reteta:")) ?? null },
  };
  return publishArticle(candidate, gen, image, "util");
}

// Pasul Util al rulării: planul (lunea / la cerere) și articolul orei.
export async function runUtil(): Promise<string[]> {
  const db = getDb();
  const log: string[] = [];
  const hour = chisinauHour();
  const today = key(todayChisinau());

  const planAsked = (await getSetting(PLAN_REQUEST)) === "1";
  const planDay = todayChisinau().getUTCDay() === PLAN_WEEKDAY && hour === morningHour();
  if (planAsked || planDay) {
    await setSetting(PLAN_REQUEST, "0");
    try {
      log.push(`plan Util: ${await planWeek()} teme noi`);
    } catch (e) {
      log.push(`plan Util eșuat: ${e instanceof Error ? e.message : e}`);
    }
  }

  // tema cerută de editor („Scrie acum”) sau cea a orei
  const asked = Number(await getSetting(WRITE_REQUEST)) || 0;
  let item: Row | undefined;
  if (asked) {
    await setSetting(WRITE_REQUEST, "0");
    [item] = await db.select().from(utilPlan).where(and(eq(utilPlan.id, asked), inArray(utilPlan.status, ["propus", "aprobat", "esuat"])));
  } else if ((await pipelineEnabled()) && hour >= morningHour() && hour <= lastRunHour()) {
    const due = utilHours().filter((h) => h <= hour).length;
    const todays = await db.select().from(utilPlan).where(eq(utilPlan.day, today)).orderBy(utilPlan.id);
    // în primele săptămâni se scriu doar temele aprobate de editor
    if (todays.filter((t) => t.status === "publicat").length < due) item = todays.find((t) => t.status === "aprobat");
  }
  if (!item) return log;
  try {
    const articleId = await writeItem(item);
    await db.update(utilPlan).set({ status: "publicat", articleId, note: null }).where(eq(utilPlan.id, item.id));
    log.push(`Util publicat: ${item.topic}`);
  } catch (e) {
    const note = e instanceof Error ? e.message : String(e);
    await db.update(utilPlan).set({ status: "esuat", note: note.slice(0, 500) }).where(eq(utilPlan.id, item.id));
    log.push(`Util eșuat (${item.topic}): ${note}`);
  }
  return log;
}
