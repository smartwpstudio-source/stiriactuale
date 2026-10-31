// Redirect 301 pentru URL-urile vechi de pe WordPress, ca link-urile din Google,
// Facebook și alte site-uri să ajungă la pagina nouă echivalentă:
//   /{slug}/ (articol)             -> /regiuni/{raion}/{slug}/ etc. (legacy-redirects.json)
//   /{slug}/amp/, /{slug}/feed/    -> același articol
//   /category/{...}/{slug}/        -> hub-ul echivalent (legacy-categories.json)
//   /tag/{tag}/                    -> 410 (vezi GONE)
//   /page/N/, /author/…            -> prima pagină / Despre
//   *sitemap*.xml (Yoast)          -> /sitemap.xml
// Tabelele sunt generate de scripts/migration/generate-redirects.ts — nu se editează manual.
// Cel al articolelor (722 KB) stă în public/redirects/<literă>.json (shard-redirects.mjs):
// importat aici, se citea la fiecare pornire a Worker-ului; acum se citește doar bucata
// necesară, doar pentru adresele cu un segment care nu sunt pagini ale site-ului.
//
// Notă: în Next.js 16 fișierul de "middleware" a fost redenumit "proxy".

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import legacyCategories from "@/data/legacy-categories.json";
import { asciiSlug } from "@/lib/ascii-slug";

const categories = legacyCategories as Record<string, string>;

// primul segment al paginilor site-ului: acestea nu pot fi adrese vechi de articol
const ROUTES = new Set([
  "analiza", "autor", "azi-in-istorie", "calculatoare", "calendar-crestin-ortodox", "cautare", "confidentialitate",
  "contact", "despre", "diaspora", "ghiduri", "impact", "international", "modele-reclamatii", "national", "offline",
  "politica-editoriala", "publicitate", "regiuni", "retete", "ru", "subiect", "util", "video",
  "admin", "api", "embed", "feed", "grafic", "og", "llms.txt", "news-sitemap.xml",
]);

type Assets = { fetch(url: URL): Promise<Response> };
const shards = new Map<string, Promise<Record<string, string>>>();

// bucata tabelului pentru prima literă (cheile au codificarea cu litere mici, %f0%9f…),
// din fișierele statice ale Worker-ului (ASSETS); în `next dev`, de la serverul local
function shard(key: string, origin: string): Promise<Record<string, string>> {
  const c = /^[a-z0-9]/.test(key[0]) ? key[0] : "_";
  if (!shards.has(c)) {
    const url = new URL(`/redirects/${c}.json`, origin);
    const assets = (globalThis as Record<symbol, { env?: { ASSETS?: Assets } } | undefined>)[Symbol.for("__cloudflare-context__")]?.env?.ASSETS;
    shards.set(c, (assets ? assets.fetch(url) : fetch(url)).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
  }
  return shards.get(c)!;
}

async function legacyArticle(slug: string, origin: string): Promise<string | undefined> {
  const key = slug.toLowerCase();
  const map = await shard(key, origin);
  // Google cere și %F0%9F…; varianta WordPress cu „-video” la final = același articol
  return map[slug] ?? map[key] ?? map[key.replace(/-video$/, "")];
}

const FIXED: Record<string, string> = {
  "privacy-policy": "/confidentialitate/",
  "politica-de-confidentialitate": "/confidentialitate/",
  popular: "/",
  "frontend-submission": "/contact/",
  "comments/feed": "/feed/",
  // articol republicat cu altă adresă (Search Console, 404, 2026-10-23)
  "diaspora/spania/spania-cod-rosu-ploi-furtuni-alerta-moldoveni": "/diaspora/spania/spania-cod-rosu-ploi-furtuni-coasta-mediteraneana/",
};

async function target(segments: string[], origin: string): Promise<string | null> {
  const [first, ...rest] = segments;
  const joined = segments.join("/");
  if (FIXED[joined]) return FIXED[joined];

  if (!ROUTES.has(first) && (segments.length === 1 || (segments.length === 2 && (rest[0] === "amp" || rest[0] === "feed")))) {
    return (await legacyArticle(first, origin)) ?? null;
  }

  if (first === "category") {
    // /category/stiri-balti/feed/ -> hub-ul categoriei, nu prima pagină
    const key = segments[segments.length - 1] === "feed" ? segments[segments.length - 2] : segments[segments.length - 1];
    return categories[key] ?? "/";
  }
  if (first === "page" || first === "author") return first === "author" ? "/despre/" : "/";
  return null;
}

// Resturi WordPress fără echivalent (fișiere, module, firewall-ul vechiului hosting):
// 410 îi spune lui Google că au dispărut definitiv, ca să nu le mai reverifice.
// /tag/ (2026-10-23): ~800 de etichete vechi „accesate, neindexate” în Search Console;
// trimiteau la căutare (pagină generată la fiecare cerere, noindex) — erau mai ales roboți.
const GONE = /^\/(wp-content|wp-includes|wp-json|link-redirect-page|imunify-bot-check|snax_item|reaction|tag)(\/|$)|^\/(xmlrpc|wp-login|wp-cron)\.php$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // adresa de test (*.workers.dev) nu se indexează: ar dubla site-ul în Google
  const staging = request.nextUrl.hostname.endsWith(".workers.dev");

  if (GONE.test(pathname)) return new NextResponse(null, { status: 410 });

  if (/^\/[^/]*sitemap[^/]*\.xml$/.test(pathname) && pathname !== "/sitemap.xml" && pathname !== "/news-sitemap.xml") {
    return NextResponse.redirect(new URL("/sitemap.xml", request.url), 301);
  }

  const segments = pathname.split("/").filter(Boolean);
  const newUrl = segments.length ? await target(segments, request.url) : null;
  if (newUrl && newUrl !== pathname) {
    return NextResponse.redirect(new URL(newUrl, request.url), 301);
  }
  // după redirecturile WordPress (au și ele chei codate): slug cu litere ne-ASCII
  // (ex. „і” chirilic scris de AI) -> adresa ASCII a articolului
  if (/%[89a-fA-F][0-9a-fA-F]|[^\x00-\x7f]/.test(pathname)) {
    let decoded = pathname;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {}
    const parts = decoded.split("/").filter(Boolean);
    const fixed = parts.map((p) => (/[^\x00-\x7f]/.test(p) ? asciiSlug(p) : p));
    if (parts.length && fixed.some((p, i) => p !== parts[i]) && fixed.every(Boolean)) {
      return NextResponse.redirect(new URL(`/${fixed.join("/")}/`, request.url), 301);
    }
  }
  const res = NextResponse.next();
  if (staging) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // excluderi precise ("api/", nu "api") — un articol vechi "apicultori-…" trebuie redirecționat
  matcher: [
    "/((?!api/|admin/|admin$|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
