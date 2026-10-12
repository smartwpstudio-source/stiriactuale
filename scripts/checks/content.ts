// Validează conținutul scris în cloud înainte de publicare:
//   npm run check:content
// Rulează automat pe fiecare Pull Request (.github/workflows/content-check.yml).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { GUIDE_CATEGORIES } from "../../src/lib/content/guides";
import { COUNTRY_NAMES, RAION_NAMES } from "../../src/lib/content/geo";
import { sanitizeBody } from "../../src/lib/content/sanitize";
import { COMPLAINT_MODELS, loadComplaintModel } from "../../src/lib/complaint-models";
import { AUTHORS } from "../../src/lib/content/analyses";
import { COURSES, DIFFICULTIES } from "../../src/lib/content/recipes";

const ROOT = path.join(import.meta.dirname, "..", "..", "content");
// surse oficiale: instituții de stat MD (*.gov.md) + câteva cu alt domeniu
const OFFICIAL =
  /(\.gov\.md|^gov\.md|cnas\.md|cnam\.md|legis\.md|anre\.md|bnm\.md|cec\.md|politia\.md|presedinte\.md|parlament\.md|anofm\.md|sfs\.md|odimm\.md|ombudsman\.md|ansp\.md|ambulanta\.md|fgdsb\.md|cnpf\.md|unej\.md|datepersonale\.md|uam\.md|cnm\.md|anrceti\.md|arcom\.md|cna\.md)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const errors: string[] = [];
const fail = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

type Source = { name?: string; url?: string };

function checkSources(file: string, sources: unknown, min: number, needOfficial: boolean) {
  if (!Array.isArray(sources) || sources.length < min) return fail(file, `minim ${min} surse`);
  const hosts: string[] = [];
  for (const s of sources as Source[]) {
    if (!s.name || !s.url?.startsWith("https://")) {
      fail(file, `sursă invalidă: ${JSON.stringify(s)}`);
      continue;
    }
    hosts.push(new URL(s.url).hostname.replace(/^www\./, ""));
  }
  if (needOfficial && !hosts.some((h) => OFFICIAL.test(h))) {
    fail(file, "nicio sursă oficială (*.gov.md, cnas.md, cnam.md...)");
  }
}

function checkDate(file: string, d: unknown) {
  if (typeof d !== "string" || !DATE.test(d) || Date.parse(d) > Date.now() + 86400_000) {
    fail(file, `"updated" invalid: ${d}`);
  }
}

async function readJson(dir: string) {
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json"));
  return Promise.all(
    files.map(async (f) => {
      try {
        return { f, data: JSON.parse(await readFile(path.join(dir, f), "utf8")) };
      } catch (e) {
        fail(f, `JSON invalid: ${(e as Error).message}`);
        return { f, data: null };
      }
    }),
  );
}

async function main() {
  for (const { f, data: g } of await readJson(path.join(ROOT, "ghiduri"))) {
    if (!g) continue;
    const file = `ghiduri/${f}`;
    if (g.slug !== f.slice(0, -5) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) {
      fail(file, "slug invalid sau diferit de numele fișierului");
    }
    if (typeof g.title !== "string" || g.title.length < 20 || g.title.length > 95) fail(file, "titlu 20-95 caractere");
    if (typeof g.description !== "string" || g.description.length < 110 || g.description.length > 175) {
      fail(file, "description 110-175 caractere");
    }
    if (!(g.category in GUIDE_CATEGORIES)) fail(file, `categorie necunoscută: ${g.category}`);
    checkDate(file, g.updated);
    checkSources(file, g.sources, 2, true);
    const body = String(g.bodyHtml ?? "");
    const words = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    if (words < 600) fail(file, `prea scurt: ${words} cuvinte (minim 600)`);
    if ((body.match(/<h2>/g) ?? []).length < 3) fail(file, "minim 3 subtitluri <h2>");
    if (/<h1|<script|<style|<iframe|style=|onclick|<img/i.test(body)) {
      fail(file, "HTML nepermis (h1, script, style, iframe, img, atribute inline)");
    }
    if (sanitizeBody(body).length < body.length * 0.97) {
      fail(file, "HTML-ul pierde conținut la sanitizare — doar p, h2, h3, ul, ol, li, strong, em, a, table");
    }
    const faq = g.faq as { q?: string; a?: string }[] | undefined;
    if (faq !== undefined && (!Array.isArray(faq) || faq.some((x) => !x.q || !x.a))) fail(file, "faq invalid");
  }

  // ghidurile în rusă (docs/cloud/traducere-ru.md): aceeași structură, același slug
  const roSlugs = new Set((await readdir(path.join(ROOT, "ghiduri"))).map((f) => f.replace(/\.json$/, "")));
  for (const { f, data: g } of await readJson(path.join(ROOT, "ghiduri-ru"))) {
    if (!g) continue;
    const file = `ghiduri-ru/${f}`;
    if (g.slug !== f.slice(0, -5)) fail(file, "slug diferit de numele fișierului");
    if (!g.ruOnly && !roSlugs.has(g.slug)) fail(file, "nu există ghidul românesc cu același slug (sau marchează ruOnly)");
    if (typeof g.title !== "string" || g.title.length < 20 || g.title.length > 110) fail(file, "titlu 20-110 caractere");
    if (typeof g.description !== "string" || g.description.length < 110 || g.description.length > 175) fail(file, "description 110-175 caractere");
    if (!(g.category in GUIDE_CATEGORIES)) fail(file, `categorie necunoscută: ${g.category}`);
    if (!/[а-яё]/i.test(String(g.bodyHtml))) fail(file, "textul nu e în rusă");
    checkDate(file, g.updated);
    checkSources(file, g.sources, 2, true);
    const body = String(g.bodyHtml ?? "");
    if ((body.match(/<h2>/g) ?? []).length < 3) fail(file, "minim 3 subtitluri <h2>");
    if (/<h1|<script|<style|<iframe|style=|onclick|<img/i.test(body)) fail(file, "HTML nepermis");
    if (sanitizeBody(body).length < body.length * 0.97) fail(file, "HTML-ul pierde conținut la sanitizare");
  }
  // fiecare ghid românesc are și varianta rusă — un ghid nou nu intră fără traducere
  const ruSlugs = new Set((await readdir(path.join(ROOT, "ghiduri-ru"))).map((f) => f.replace(/\.json$/, "")));
  for (const slug of roSlugs) if (!ruSlugs.has(slug)) fail(`ghiduri/${slug}.json`, "lipsește varianta rusă în content/ghiduri-ru/ (docs/cloud/traducere-ru.md)");

  for (const kind of ["raioane", "tari"] as const) {
    const known: Record<string, string> = kind === "raioane" ? RAION_NAMES : COUNTRY_NAMES;
    for (const { f, data: p } of await readJson(path.join(ROOT, "locuri", kind))) {
      if (!p) continue;
      const file = `locuri/${kind}/${f}`;
      if (!(f.slice(0, -5) in known)) fail(file, "slug necunoscut (trebuie să existe în geo.ts)");
      checkDate(file, p.updated);
      checkSources(file, p.sources, 1, false);
      if (!Array.isArray(p.blocks) || p.blocks.length === 0) fail(file, "fără blocuri");
      for (const b of p.blocks ?? []) {
        if (!b.title || !Array.isArray(b.items) || b.items.length === 0) fail(file, `bloc invalid: ${b.title}`);
        for (const it of b.items ?? []) {
          if (!it.name) fail(file, "element fără nume");
          if (it.phone && !/^[+\d][\d\s()-]{4,}$/.test(it.phone)) fail(file, `telefon invalid: ${it.phone}`);
          if (it.url && !String(it.url).startsWith("https://")) fail(file, `url invalid: ${it.url}`);
        }
      }
      // varianta rusă (content/locuri-ru/): aceleași telefoane, URL-uri și surse, în aceeași ordine
      const ruFile = `locuri-ru/${kind}/${f}`;
      const ru = await readFile(path.join(ROOT, "locuri-ru", kind, f), "utf8").then(JSON.parse, () => null);
      if (!ru) { fail(file, `lipsește varianta rusă ${ruFile}`); continue; }
      type Block = { title?: string; items?: { name?: string; phone?: string; url?: string }[] };
      const facts = (x: { sources?: unknown; blocks?: Block[] }) =>
        JSON.stringify([x.sources, (x.blocks ?? []).map((b) => (b.items ?? []).map((it) => [it.phone ?? "", it.url ?? ""]))]);
      if (facts(ru) !== facts(p)) fail(ruFile, "telefoanele / URL-urile / sursele diferă de varianta română");
      checkDate(ruFile, ru.updated);
      for (const b of (ru.blocks ?? []) as Block[])
        if (![b.title, ...(b.items ?? []).map((it) => it.name)].every((t) => /[а-яё]/i.test(String(t)))) fail(ruFile, `text netradus în blocul ${b.title}`);
    }
  }

  // calendarul ortodox: sfinții pe zile, un fișier pe lună (docs/cloud/calendar.md)
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (const { f, data: c } of await readJson(path.join(ROOT, "calendar", "sfinti"))) {
    if (!c) continue;
    const file = `calendar/sfinti/${f}`;
    const m = Number(f.slice(0, 2));
    if (!/^(0[1-9]|1[0-2])\.json$/.test(f) || c.luna !== m) { fail(file, "nume de fișier / luna greșite"); continue; }
    checkDate(file, c.updated);
    checkSources(file, c.surse, 1, false);
    for (let d = 1; d <= DAYS[m - 1]; d++) {
      const z = c.zile?.[String(d)];
      if (!z) { fail(file, `lipsește ziua ${d}`); continue; }
      if (!Array.isArray(z.sfinti) || z.sfinti.length === 0 || z.sfinti.some((s: unknown) => typeof s !== "string" || !s)) fail(file, `ziua ${d}: sfinti`);
      if (z.sarbatoare !== null && typeof z.sarbatoare !== "string") fail(file, `ziua ${d}: sarbatoare`);
      if (![null, "rosie", "neagra"].includes(z.cruce)) fail(file, `ziua ${d}: cruce`);
    }
  }

  // „Azi în istorie”: evenimentele pe zile, un fișier pe lună (docs/cloud/istorie.md)
  for (const { f, data: c } of await readJson(path.join(ROOT, "istorie"))) {
    if (!c) continue;
    const file = `istorie/${f}`;
    const m = Number(f.slice(0, 2));
    if (!/^(0[1-9]|1[0-2])\.json$/.test(f) || c.luna !== m) { fail(file, "nume de fișier / luna greșite"); continue; }
    checkDate(file, c.updated);
    for (let d = 1; d <= DAYS[m - 1]; d++) {
      const ev = c.zile?.[String(d)];
      if (!Array.isArray(ev) || ev.length < 3 || ev.length > 5) { fail(file, `ziua ${d}: 3–5 evenimente`); continue; }
      ev.forEach((e: { an?: unknown; text?: unknown; moldova?: unknown; sursa?: unknown }, i: number) => {
        if (!Number.isInteger(e.an) || (e.an as number) > new Date().getFullYear()) fail(file, `ziua ${d} #${i + 1}: an`);
        if (typeof e.text !== "string" || e.text.length < 40 || e.text.length > 260) fail(file, `ziua ${d} #${i + 1}: text 40–260 caractere`);
        else if (/[şţŞŢ]/.test(e.text)) fail(file, `ziua ${d} #${i + 1}: ş/ţ cu sedilă`);
        if (typeof e.moldova !== "boolean") fail(file, `ziua ${d} #${i + 1}: moldova`);
        if (typeof e.sursa !== "string" || !e.sursa.startsWith("https://")) fail(file, `ziua ${d} #${i + 1}: sursa`);
        if (i > 0 && (e.an as number) < (ev[i - 1].an as number)) fail(file, `ziua ${d}: ani necrescători`);
      });
    }
  }

  // analizele semnate (docs/analiza.md)
  for (const { f, data: a } of await readJson(path.join(ROOT, "analize"))) {
    if (!a) continue;
    const file = `analize/${f}`;
    if (a.slug !== f.replace(/\.json$/, "")) fail(file, "slug diferit de numele fișierului");
    if (!(a.author in AUTHORS)) fail(file, `autor necunoscut: ${a.author}`);
    checkDate(file, a.published);
    if (!a.title || !a.thesis || !a.bodyHtml || !a.counterHtml) fail(file, "titlu, teză, corp și contraargument obligatorii");
    if (!Array.isArray(a.facts) || a.facts.length < 3 || a.facts.some((x: { text?: string; source?: { url?: string } }) => !x.text || !x.source?.url?.startsWith("https://")))
      fail(file, "„Ce știm”: minim 3 fapte, fiecare cu sursă https");
    if (!Array.isArray(a.questions) || a.questions.length < 1 || a.questions.some((q: { q?: string; to?: string }) => !q.q || !q.to)) fail(file, "întrebări cu adresant");
    if (!Array.isArray(a.trigger) || a.trigger.length < 1) fail(file, "știrea de la care pornește");
    checkSources(file, a.sources, 2, false);
    if (/[şţŞŢ]/.test(JSON.stringify(a))) fail(file, "ş/ţ cu sedilă");
  }

  // rețetele (docs/cloud/gospodarie-bucatarie-turism.md): RO + RU obligatoriu, același slug și aceleași cantități
  const recipes = { ro: await readJson(path.join(ROOT, "retete")), ru: await readJson(path.join(ROOT, "retete-ru")) };
  const linkable = new Set([...roSlugs, ...recipes.ro.map((x) => x.f.slice(0, -5))]);
  const qtys = (r: { ingredients?: { items?: { qty?: string }[] }[] }) =>
    JSON.stringify((r.ingredients ?? []).flatMap((g) => (g.items ?? []).map((i) => i.qty ?? "")));
  const roQty = new Map<string, string>();
  for (const lang of ["ro", "ru"] as const) {
    for (const { f, data: r } of recipes[lang]) {
      if (!r) continue;
      const file = `${lang === "ro" ? "retete" : "retete-ru"}/${f}`;
      if (r.slug !== f.slice(0, -5) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) fail(file, "slug invalid sau diferit de numele fișierului");
      if (typeof r.title !== "string" || r.title.length < 20 || r.title.length > 110) fail(file, "titlu 20-110 caractere");
      if (typeof r.description !== "string" || r.description.length < 110 || r.description.length > 175) fail(file, "description 110-175 caractere");
      checkDate(file, r.updated);
      const img = r.image ?? {};
      if (!/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(String(img.url)) || !img.credit || !img.alt) {
        fail(file, "image: url din Vercel Blob, credit și alt obligatorii");
      }
      for (const k of ["servings", "prepMinutes", "cookMinutes"]) {
        if (!Number.isInteger(r[k]) || r[k] < (k === "servings" ? 1 : 0)) fail(file, `${k}: număr întreg`);
      }
      if (!(r.difficulty in DIFFICULTIES)) fail(file, `difficulty necunoscut: ${r.difficulty}`);
      if (!(r.course in COURSES)) fail(file, `course necunoscut: ${r.course}`);
      if (typeof r.fasting !== "boolean") fail(file, "fasting: true/false");
      if (r.region !== undefined && typeof r.region !== "string") fail(file, "region: text");
      const groups = r.ingredients as { group?: unknown; items?: { qty?: unknown; unit?: unknown; name?: unknown; note?: unknown }[] }[];
      if (!Array.isArray(groups) || groups.some((g) => !Array.isArray(g.items) || (g.group !== undefined && typeof g.group !== "string"))) {
        fail(file, "ingredients: [{ group?, items: [...] }]");
      } else {
        const items = groups.flatMap((g) => g.items ?? []);
        if (items.length < 3) fail(file, "minim 3 ingrediente");
        if (items.some((i) => typeof i.name !== "string" || !i.name || [i.qty, i.unit, i.note].some((x) => x !== undefined && typeof x !== "string"))) {
          fail(file, "ingredient invalid (name obligatoriu; qty, unit, note text)");
        }
      }
      const steps = r.steps as { text?: unknown; minutes?: unknown; name?: unknown }[];
      if (!Array.isArray(steps) || steps.length < 3) fail(file, "minim 3 pași");
      else if (steps.some((s) => typeof s.text !== "string" || !s.text || (s.minutes !== undefined && !Number.isInteger(s.minutes)) || (s.name !== undefined && (typeof s.name !== "string" || !s.name.trim() || s.name.length > 80)))) fail(file, "pas invalid");
      for (const k of ["tips", "mistakes"]) {
        if (r[k] !== undefined && (!Array.isArray(r[k]) || r[k].some((x: unknown) => typeof x !== "string" || !x))) fail(file, `${k}: listă de texte`);
      }
      if (r.variants !== undefined && (!Array.isArray(r.variants) || r.variants.some((v: { region?: unknown; text?: unknown }) => !v.region || !v.text))) {
        fail(file, "variants: [{ region, text }]");
      }
      for (const k of ["occasions", "related"]) {
        if (r[k] === undefined) continue;
        if (!Array.isArray(r[k])) fail(file, `${k}: listă de slug-uri`);
        else for (const s of r[k]) if (!linkable.has(s)) fail(file, `${k}: nu există ghid sau rețetă „${s}”`);
      }
      if (r.storyHtml !== undefined) {
        const story = String(r.storyHtml);
        if (/<h1|<script|<style|<iframe|style=|onclick|<img/i.test(story)) fail(file, "storyHtml: HTML nepermis");
        if (sanitizeBody(story).length < story.length * 0.97) fail(file, "storyHtml pierde conținut la sanitizare");
      }
      checkSources(file, r.sources, 1, false);
      if (/[şţŞŢ]/.test(JSON.stringify(r))) fail(file, "ş/ţ cu sedilă");
      if (lang === "ro") roQty.set(r.slug, qtys(r));
      else if (!roQty.has(r.slug)) fail(file, "nu există rețeta românească cu același slug");
      else if (roQty.get(r.slug) !== qtys(r)) fail(file, "cantitățile (qty) diferă de rețeta românească");
      if (lang === "ru" && !/[а-яё]/i.test(r.title)) fail(file, "textul nu e în rusă");
    }
  }
  const ruRecipes = new Set(recipes.ru.map((x) => x.f.slice(0, -5)));
  for (const slug of roQty.keys()) if (!ruRecipes.has(slug)) fail(`retete/${slug}.json`, "lipsește varianta rusă în content/retete-ru/");

  // modelele de reclamații (/modele-reclamatii/) vin din secțiunea „Model” a ghidului
  for (const m of COMPLAINT_MODELS) {
    const r = await loadComplaintModel(m.slug);
    if (!r || r.template.fields.length < 3) fail(`ghiduri/${m.guide}.json`, `modelul „${m.slug}” nu se citește (Către … Semnătura, cu [câmpuri])`);
    // /ru/modele-reclamatii/: etichetele câmpurilor vin din „Образец” al ghidului rusesc, câmp cu câmp
    const ru = await loadComplaintModel(m.slug, "ru");
    if (r && !ru?.ruFields) fail(`ghiduri-ru/${m.guide}.json`, `modelul rusesc „${m.slug}” nu are aceleași [câmpuri] ca cel românesc (Кому … Подпись)`);
  }

  if (errors.length) {
    console.error(`${errors.length} probleme:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log("conținut: OK");
}

main();
