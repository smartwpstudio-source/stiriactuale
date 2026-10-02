import { decodeEntities } from "@/lib/html-entities";
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
// cu "<"), nu JSON-ul paginii, care are și descrieri de rubrici, meniuri.
function nextFlightChunks(html: string): string[] {
  return [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]) as string;
      } catch {
        return "";
      }
    })
    .filter((c) => c.trimStart().startsWith("<"));
}

// Video-ul știrii: doar din <article> când există (altfel prindem playerul
// site-ului din bara laterală, același pe toate paginile) plus og:video din <head>.
function articleVideo(html: string): string | null {
  const article = html.match(/<article\b[\s\S]*<\/article>/i)?.[0];
  if (!article) return findVideo(html);
  return findVideo(article) ?? findVideo(html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? "");
}

export function extractArticle(html: string) {
  const clean = html.replace(/<(script|style|noscript|nav|footer|aside|form|header)\b[\s\S]*?<\/\1>/gi, " ");
  // <article> când există, altfel toată pagina — paragrafele scurte (meniuri, legende) cad la filtru
  const body = clean.match(/<article\b[\s\S]*<\/article>/i)?.[0] ?? clean;
  let paragraphs = paragraphsOf(body);
  if (paragraphs.join("").length < 500) {
    const flight = nextFlightChunks(html)
      .map(paragraphsOf)
      .reduce((a, b) => (b.join("").length > a.join("").length ? b : a), []);
    if (flight.join("").length > paragraphs.join("").length) paragraphs = flight;
  }
  return {
    title: meta(html, "og:title") || text(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ""),
    description: meta(html, "og:description"),
    text: paragraphs.join("\n").slice(0, MAX_CHARS),
    video: articleVideo(html),
  };
}

export async function fetchArticle(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        "Accept-Language": "ro,ru;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return extractArticle(await res.text());
  } catch {
    return null;
  }
}
