import { getGuides } from "@/lib/content/guides";
import { dossierSlug } from "@/lib/content/related-dossier";
import { matchCalculator } from "@/lib/content/related-calculator";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";
import { isMajorNews } from "./auto-push";
import { stripDiacritics } from "./text-normalize";
import { HAIKU_MODEL, structured } from "./llm";

// Regula „știre cu ghid” (decizia proprietarului, 2026-10-13): o știre aleasă
// automat se publică doar dacă are o legătură REALĂ cu o unealtă practică de pe
// site — ghidul, calculatorul sau modelul de reclamație pe care cititorul îl
// folosește după știre. E un filtru ÎN PLUS, aplicat în run.ts DUPĂ toate
// regulile vechi (clasificare, scor, reject, plafoane, dubluri), doar pe
// știrile care oricum s-ar publica; nu relaxează nimic.
// Scutite de cerința de ghid (nu și de celelalte reguli): urgențele, vremea
// periculoasă, legile și deciziile majore propuse pentru push (aceeași logică
// ca auto-push.ts). Linkurile editorului nu trec prin filtru deloc.
// Mod „raport” (implicit): se publică tot, se înregistrează ce s-ar fi respins.
// Mod „strict”: știrea fără ghid și fără scutire nu se publică.

export type GuideRuleMode = "raport" | "strict";

export interface GuideCheck {
  tool: string | null; // „ghid:<slug>” | „calc:<slug>” | „model:<slug>”
  via: "dosar" | "calc" | "ai" | "niciunul";
  reason?: string;
  topic?: string; // tema lipsă (2–5 cuvinte), la știrile fără ghid
  error?: boolean; // AI-ul n-a răspuns: necunoscut, nu se respinge
}

// Ghidurile de raion (*-primaria-spitalul-asp-transportul) contează doar la
// știrile despre servicii publice locale, nu la accidente sau cultură.
const CITY_GUIDE = /-primaria-spitalul-asp-transportul$/;
const LOCAL_SERVICES =
  /primari|consiliu\w* (local|raional|municipal)|spital|policlinic|centr\w* de sanatate|medic\w* de familie|\basp\b|agenti\w* servicii publice|buletin|pasaport|transport\w* (public|in comun)|autobuz|troleibuz|microbuz|rut\w* de transport|\bapa\b|apeduct|canalizar|apa-canal|\bdrum|strazi|strada|asfalt|iluminat\w* public|salubr|deseur|gunoi|gradinit|scoal/;
// accidentele, crimele, cultura, sportul nu sunt „servicii publice”, chiar dacă
// au loc pe un drum sau lângă spital
const NOT_SERVICES = /accident|tamponat|ciocnit|a murit|au murit|deced|crim[aei]|omor|ucis|talhar|furt|incendi|concert|festival|expozit|spectacol|meci|campionat|turneu/;

export function cityGuideAllowed(tool: string, text: string): boolean {
  const slug = tool.startsWith("ghid:") ? tool.slice(5) : "";
  if (!CITY_GUIDE.test(slug)) return true;
  const t = stripDiacritics(text).toLowerCase();
  return LOCAL_SERVICES.test(t) && !NOT_SERVICES.test(t);
}

// Alertele care trec mereu (modul „echilibrat”, 2026-10-24): codurile meteo, alertele
// IGSU și cele de securitate — în strict rămăseseră afară „Cod galben de ploi” și drona
// cu explozibil căzută în Moldova.
const ALERT = /\bcod\w* (galben|portocaliu|rosu)\b|avertizar\w* (meteo|hidrologic)|alert\w* (meteo|aerian)|\bigsu\b.{0,80}(alert|avertiz|evacu)|dron\w*.{0,80}(explozibil|cazut|prabusit|spatiul aerian)|spatiul aerian al (republicii )?moldov|expulz\w* (un |a )?diplomat/;

// Scutirea de cerința de ghid: pushWorthy de la clasificator ȘI urgență / lege majoră,
// sau o alertă din lista de mai sus.
export function guideExempt(c: { pushWorthy: boolean; title: string; summary: string }): boolean {
  const text = `${c.title} ${c.summary}`;
  return (c.pushWorthy && isMajorNews(text)) || ALERT.test(stripDiacritics(text).toLowerCase());
}

// Potrivirea existentă, fără AI: dosarul-pilon (related-dossier.ts), apoi calculatorul.
export function ruleMatch(c: { title: string; summary: string; section: string; topics: string[] }): GuideCheck | null {
  const dossier = dossierSlug(c.title, c.summary, c.topics, c.section);
  if (dossier) return { tool: `ghid:${dossier}`, via: "dosar" };
  const calc = matchCalculator(`${c.title} ${c.summary}`);
  if (calc) return { tool: `calc:${calc}`, via: "calc" };
  return null;
}

// Decizia, aplicată doar știrilor care au trecut deja regulile vechi.
// `publish` = se publică; `wouldReject` = cade la regula ghidului (în „raport”
// doar se înregistrează). Eroarea AI-ului nu respinge nimic.
export function guideDecision(mode: GuideRuleMode, check: GuideCheck, exempt: boolean) {
  const wouldReject = !check.tool && !exempt && !check.error;
  return { publish: !(wouldReject && mode === "strict"), wouldReject };
}

// Decizia completă pentru o știre automată: întâi regulile vechi (run.ts
// passesSelection, dubluri, plafoane), apoi regula ghidului. Scutirea nu
// salvează o știre respinsă de regulile vechi.
export function finalPublish(passedOldRules: boolean, mode: GuideRuleMode, check: GuideCheck, exempt: boolean): boolean {
  return passedOldRules && guideDecision(mode, check, exempt).publish;
}

// Răspunsul modelului: id-ul trebuie să existe în catalog; ghidul de raion doar
// la servicii publice locale. Altfel null.
export function validatePick(id: string | null | undefined, ids: Set<string>, text: string): string | null {
  if (!id || !ids.has(id)) return null;
  return cityGuideAllowed(id, text) ? id : null;
}

// Catalogul compact pentru model (id | titlu [categorie]), o dată pe proces.
// Ghidurile vin prin getGuides (fișiere / store, după platformă).
let catalogCache: Promise<{ lines: string; ids: Set<string> }> | undefined;

export function loadCatalog() {
  return (catalogCache ??= (async () => {
    const [guides, params] = await Promise.all([getGuides(), getCalcParams()]);
    const rows = [
      ...availableCalculators(params).map((c) => `calc:${c.slug} | Calculator: ${c.title}`),
      ...COMPLAINT_MODELS.map((m) => `model:${m.slug} | Model de reclamație: ${m.title}`),
      ...guides.map((g) => `ghid:${g.slug} | ${g.title} [${g.category}]`),
    ];
    return { lines: rows.join("\n"), ids: new Set(rows.map((r) => r.split(" | ")[0])) };
  })().catch((e) => ((catalogCache = undefined), Promise.reject(e))));
}

const SYSTEM = [
  "Ești redactorul unui site de știri din Republica Moldova care are și ghiduri practice, calculatoare și modele de reclamații.",
  "Primești o știre și catalogul uneltelor site-ului. Alegi UNEALTA pe care cititorul acestei știri chiar o folosește după ce o citește: ghidul care îi explică ce să facă, ce drepturi are, cât costă, unde se adresează; sau dosarul care îi explică subiectul de fond.",
  "Legătura trebuie să fie REALĂ și directă, nu doar un cuvânt comun. Exemple: scumpirea gazului -> ghidul despre prețul gazului; amenzi pentru șoferi -> ghidul amenzilor; un meci de fotbal, un concert, un accident cu victime, o declarație politică fără consecință practică -> null.",
  "Ghidurile de raion (id ...-primaria-spitalul-asp-transportul) DOAR dacă știrea e despre servicii publice locale din acel raion (primărie, spital, ASP, transport, apă, drumuri); NU la accidente, crime, cultură, sport.",
  "Fără unealtă potrivită: guide = null și topic = tema ghidului care AR lipsi, 2–5 cuvinte în română (ex. „sezonul de încălzire”, „bursele studenților”); dacă știrea nu cere deloc un ghid practic (sport, cultură, monden, politică externă), topic = „fără nevoie practică”.",
  "guide = id-ul exact din catalog (ghid:<slug>, calc:<slug>, model:<slug>) sau null. Nu inventa id-uri.",
].join("\n");

export async function aiPick(c: { title: string; summary: string }): Promise<GuideCheck> {
  const { lines, ids } = await loadCatalog();
  const r = await structured<{ guide: string | null; reason?: string; topic?: string }>({
    model: HAIKU_MODEL,
    system: SYSTEM,
    prompt: `ȘTIREA:\n${c.title}\n${c.summary.slice(0, 700)}\n\nCATALOG:\n${lines}`,
    schema: {
      type: "object",
      properties: {
        guide: { type: ["string", "null"], description: "id-ul uneltei din catalog sau null" },
        reason: { type: "string", description: "o frază: de ce" },
        topic: { type: "string", description: "doar când guide = null: tema ghidului care lipsește, 2–5 cuvinte" },
      },
      required: ["guide", "reason"],
    },
    maxBudgetUsd: 0.4, // catalogul are ~20k tokeni: 0,1 $ nu ajungea (2026-10-13)
  });
  const tool = validatePick(r.guide, ids, `${c.title} ${c.summary}`);
  return {
    tool,
    via: tool ? "ai" : "niciunul",
    reason: (r.reason ?? "").slice(0, 300) || undefined,
    topic: tool ? undefined : (r.topic ?? "").trim().slice(0, 120) || undefined,
  };
}

// Pasul complet: întâi potrivirea existentă (fără cost), apoi AI-ul.
export async function checkGuide(c: { title: string; summary: string; section: string; topics: string[] }): Promise<GuideCheck> {
  const rule = ruleMatch(c);
  if (rule) return rule;
  try {
    return await aiPick(c);
  } catch (err) {
    return { tool: null, via: "niciunul", reason: `eroare AI: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300), error: true };
  }
}
