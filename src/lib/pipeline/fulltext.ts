import { decodeEntities } from "@/lib/html-entities";
import { stripDiacritics } from "./text-normalize";
import { findVideo } from "@/lib/video";

// Textul integral al unei știri de pe pagina sursei. RSS-ul dă doar 2-3 fraze;
// din atât, orice model scrie 100 de cuvinte goale. Textul complet e materialul
// de lucru pentru scriere (rescris, nu copiat — vezi generate.ts).
// Folosit și de "Adaugă știre după link" din /admin.

const MAX_CHARS = 6000;

// Rânduri care nu țin de știre: promoții, "citește și", cookie, rețele sociale.
const NOISE =
  /abonea[zț]ă-?\s*te|urmăre[sș]te-ne|cite[sș]te (și|mai mult|tot|articolul)|vezi (și|mai mult)|toate drepturile|cookie|newsletter|telegram|facebook|instagram|youtube|tiktok|publicitate/i;

const text = (html: string) =>
  decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, prop: string): string {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i")) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m ? text(m[1]) : "";
}

function paragraphsOf(html: string): string[] {
  const seen = new Set<string>();
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => text(m[1]))
    .filter((p) => p.length > 60 && !NOISE.test(p) && !seen.has(p) && seen.add(p));
}

// Site-urile Next.js (ex. stiri.md) trimit corpul articolului doar în datele
// de hidratare (self.__next_f.push), ca HTML într-un string JS — fără <p> în
// pagină. Se decodează stringurile; corpul e o bucată de HTML curat (începe
// cu "<", după prefixul de rând „39:T438,”), nu JSON-ul paginii, care are
// și descrieri de rubrici, meniuri.
const decodedFlight = (html: string) =>
  [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map((m) => {
    try {
      return JSON.parse(m[1]) as string;
    } catch {
      return "";
    }
  });

// Uneori corpul vine în datele Apollo din același push, ca valoare JSON
// („description":{"long":"<p>…") — stringurile JSON care încep cu <p.
function flightJsonHtml(html: string): string[] {
  return decodedFlight(html).flatMap((c) =>
    [...c.matchAll(/"(<p[\s>](?:[^"\\]|\\.)*)"/g)].map((m) => {
      try {
        return JSON.parse(`"${m[1]}"`) as string;
      } catch {
        return "";
      }
    }),
  );
}

function nextFlightChunks(html: string): string[] {
  return decodedFlight(html)
    .map((c) => {
      // rândul de text poate veni după alte rânduri în același push („29:C … 39:T438,<p…”)
      const row = c.match(/[0-9a-f]+:T[0-9a-f]+,(?=<)/);
      return row ? c.slice(row.index! + row[0].length) : c;
    })
    .filter((c) => c.trimStart().startsWith("<"));
}

// Video-ul știrii: doar din <article> când există (altfel prindem playerul
// site-ului din bara laterală, același pe toate paginile) plus og:video din <head>,
// apoi corpul din datele Next.js.
function articleVideo(html: string): string | null {
  const article = html.match(/<article\b[\s\S]*<\/article>/i)?.[0];
  const direct = article
    ? (findVideo(article) ?? findVideo(html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? ""))
    : findVideo(html);
  // site-urile Next.js (stiri.md) țin playerul în corpul din datele de hidratare
  return direct ?? findVideo(nextFlightChunks(html).join(""));
}

// Pozele din corpul știrii (2026-10-29, cererea proprietarului: intră la sfârșitul
// articolului, cu sursa): doar între primul și ultimul paragraf al știrii (plus puțin
// după, unde stau galeriile) — în rest pagina are logo-uri, reclame, alte știri; fără
// poza principală (og:image, a titlului), fără cele din linkuri spre alte pagini
// („citește și”) și fără iconițe.
const MAX_PHOTOS = 6;
export const MIN_WIDTH = 500;
const TAIL = 1500;
const JUNK = /\.(svg|gif)([?#]|$)|logo|icon|avatar|author|banner|pixel|emoji|placeholder|sprite/i;
const stem = (u: string) => u.split(/[?#]/)[0].replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/\.\w+$/, "");

// Descrierea lungă a pozei care nu are aproape nimic comun cu titlul știrii = titlul
// altei știri (blocurile promo). Descrierile scurte („Petru Pelivan”) trec.
const words = (s: string) => new Set(stripDiacritics(decodeEntities(s)).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3).map((w) => w.slice(0, 5)));
function otherHeadline(alt: string, title: string): boolean {
  const a = words(alt);
  if (a.size < 6) return false;
  const t = words(title);
  return [...a].filter((w) => t.has(w)).length / a.size < 0.3;
}

function articlePhotos(body: string, html: string, base: string, paragraphs: string[]): string[] {
  const story = new Set(paragraphs);
  const spots = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].filter((m) => story.has(text(m[1])));
  if (!spots.length) return [];
  const last = spots[spots.length - 1];
  const article = body.slice(spots[0].index, last.index! + last[0].length + TAIL);
  const main = meta(html, "og:image");
  const title = meta(html, "og:title") || text(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  const out = new Map<string, string>();
  for (const m of article.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (n: string) => tag.match(new RegExp(`\\s${n}=["']([^"']+)["']`, "i"))?.[1];
    const src = attr("data-src") ?? attr("data-lazy-src") ?? attr("src");
    if (!src || src.startsWith("data:") || JUNK.test(src) || JUNK.test(attr("class") ?? "")) continue;
    // miniaturile „alte știri” dintre paragrafe (Radio Chișinău 235x132, TV8 ?width=204):
    // mărimea din atribute sau din adresă; poza reală se verifică și după descărcare (run.ts)
    if (Number(attr("width") ?? 999) < MIN_WIDTH || Number(attr("height") ?? 999) < 250) continue;
    const sized = src.match(/\/(\d{2,4})x\d{2,4}\//)?.[1] ?? src.match(/[?&](?:w|width)=(\d+)/i)?.[1];
    if (sized && Number(sized) < MIN_WIDTH) continue;
    // descrierea pozei e titlul altei știri („Breaking news” la TV8, poza de 828 px)
    if (otherHeadline(attr("alt") ?? "", title)) continue;
    // în interiorul unui <a> spre altă pagină (nu spre poza mare): o știre recomandată
    const before = article.slice(0, m.index);
    const open = before.lastIndexOf("<a ");
    if (open > before.lastIndexOf("</a>")) {
      const href = before.slice(open).match(/href=["']([^"']+)["']/i)?.[1] ?? "";
      if (!/\.(jpe?g|png|webp)([?#]|$)/i.test(href)) continue;
    }
    let url: string;
    try {
      url = new URL(decodeEntities(src), base).href;
    } catch {
      continue;
    }
    // fără adresă proprie, poza ajunge la adresa paginii
    if (!/^https?:/.test(url) || stem(url) === stem(base) || (main && stem(url) === stem(new URL(main, base).href))) continue;
    if (!out.has(stem(url))) out.set(stem(url), url);
  }
  return [...out.values()].slice(0, MAX_PHOTOS);
}

// Pozele unei postări Telegram (t.me/canal/123, cu sau fără /s/ și parametri)
export async function telegramPhotos(link: string): Promise<string[]> {
  const embed = `${link.replace("/s/", "/").split("?")[0]}?embed=1`;
  try {
    const html = await fetch(embed, { signal: AbortSignal.timeout(15_000) }).then((r) => r.text());
    return [...html.matchAll(/tgme_widget_message_photo_wrap[^>]+background-image:url\('([^']+)'\)/g)].map((m) => m[1]).slice(0, MAX_PHOTOS + 1);
  } catch {
    return [];
  }
}

export function extractArticle(html: string, url?: string) {
  const clean = html.replace(/<(script|style|noscript|nav|footer|aside|form|header)\b[\s\S]*?<\/\1>/gi, " ");
  // <article> când există, altfel toată pagina — paragrafele scurte (meniuri, legende) cad la filtru
  const body = clean.match(/<article\b[\s\S]*<\/article>/i)?.[0] ?? clean;
  let paragraphs = paragraphsOf(body);
  if (paragraphs.join("").length < 500) {
    const flight = [...nextFlightChunks(html), ...flightJsonHtml(html)]
      .map(paragraphsOf)
      .reduce((a, b) => (b.join("").length > a.join("").length ? b : a), []);
    if (flight.join("").length > paragraphs.join("").length) paragraphs = flight;
  }
  return {
    title: meta(html, "og:title") || text(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ""),
    description: meta(html, "og:description"),
    text: paragraphs.join("\n").slice(0, MAX_CHARS),
    video: articleVideo(html),
    photos: url ? articlePhotos(body, html, url, paragraphs) : [],
  };
}

// Simpals (stiri.md, point.md) trimit pagina foarte încet serverelor din
// străinătate (test 2026-10-08: ~16 KB în 15 s). Pipeline-ul (GitHub) așteaptă
// mai mult; admin-ul (Vercel) rămâne la 15 s — acolo timpul se plătește.
export async function fetchArticle(url: string, timeoutMs = 15_000) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        "Accept-Language": "ro,ru;q=0.8",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return extractArticle(await res.text(), res.url || url);
  } catch {
    return null;
  }
}
