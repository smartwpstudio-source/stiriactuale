// Redirect 301 pentru URL-urile vechi de pe WordPress, ca link-urile din Google,
// Facebook și alte site-uri să ajungă la pagina nouă echivalentă:
//   /{slug}/ (articol)             -> /regiuni/{raion}/{slug}/ etc. (legacy-redirects.json)
//   /{slug}/amp/, /{slug}/feed/    -> același articol
//   /category/{...}/{slug}/        -> hub-ul echivalent (legacy-categories.json)
//   /tag/{tag}/                    -> 410 (vezi GONE)
//   /page/N/, /author/…            -> prima pagină / Despre
//   *sitemap*.xml (Yoast)          -> /sitemap.xml
// Tabelele sunt generate de scripts/migration/generate-redirects.ts — nu se editează manual.
//
// Notă: în Next.js 16 fișierul de "middleware" a fost redenumit "proxy".

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import legacyRedirects from "@/data/legacy-redirects.json";
import legacyCategories from "@/data/legacy-categories.json";
import { asciiSlug } from "@/lib/ascii-slug";

const articles = legacyRedirects as Record<string, string>;
const categories = legacyCategories as Record<string, string>;

const FIXED: Record<string, string> = {
  "privacy-policy": "/confidentialitate/",
  "politica-de-confidentialitate": "/confidentialitate/",
  popular: "/",
  "frontend-submission": "/contact/",
  "comments/feed": "/feed/",
  // articol republicat cu altă adresă (Search Console, 404, 2026-10-23)
  "diaspora/spania/spania-cod-rosu-ploi-furtuni-alerta-moldoveni": "/diaspora/spania/spania-cod-rosu-ploi-furtuni-coasta-mediteraneana/",
};

function target(segments: string[]): string | null {
  const [first, ...rest] = segments;
  const joined = segments.join("/");
  if (FIXED[joined]) return FIXED[joined];

  // cheile au codificarea cu litere mici (%f0%9f…), Google cere și %F0%9F…
  // varianta WordPress cu „-video” la final (ex. …-ce-inseamna-asta-video) = același articol
  const article = articles[first] ?? articles[first.toLowerCase()] ?? articles[first.replace(/-video$/, "")];
  if (segments.length === 1) return article ?? null;
  if (segments.length === 2 && (rest[0] === "amp" || rest[0] === "feed")) return article ?? null;

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // adresa de test (*.workers.dev) nu se indexează: ar dubla site-ul în Google
  const staging = request.nextUrl.hostname.endsWith(".workers.dev");

  if (GONE.test(pathname)) return new NextResponse(null, { status: 410 });

  if (/^\/[^/]*sitemap[^/]*\.xml$/.test(pathname) && pathname !== "/sitemap.xml" && pathname !== "/news-sitemap.xml") {
    return NextResponse.redirect(new URL("/sitemap.xml", request.url), 301);
  }

  const segments = pathname.split("/").filter(Boolean);
  const newUrl = segments.length ? target(segments) : null;
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
