// Validează conținutul scris în cloud înainte de publicare:
//   npm run check:content
// Rulează automat pe fiecare Pull Request (.github/workflows/content-check.yml).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { GUIDE_CATEGORIES } from "../../src/lib/content/guides";
import { COUNTRY_NAMES, RAION_NAMES } from "../../src/lib/content/geo";
import { sanitizeBody } from "../../src/lib/content/sanitize";

const ROOT = path.join(import.meta.dirname, "..", "..", "content");
// surse oficiale: instituții de stat MD (*.gov.md) + câteva cu alt domeniu
const OFFICIAL =
  /(\.gov\.md|^gov\.md|cnas\.md|cnam\.md|legis\.md|anre\.md|bnm\.md|cec\.md|politia\.md|presedinte\.md|parlament\.md|anofm\.md|sfs\.md|odimm\.md|ombudsman\.md|ansp\.md|ambulanta\.md|fgdsb\.md|cnpf\.md)$/;
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

  if (errors.length) {
    console.error(`${errors.length} probleme:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log("conținut: OK");
}

main();
