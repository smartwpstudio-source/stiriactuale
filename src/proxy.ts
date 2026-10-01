// Redirect 301 pentru URL-urile vechi de pe WordPress, ca link-urile din Google,
// Facebook și alte site-uri să ajungă la pagina nouă echivalentă:
//   /{slug}/ (articol)             -> /regiuni/{raion}/{slug}/ etc. (legacy-redirects.json)
//   /{slug}/amp/, /{slug}/feed/    -> același articol
//   /category/{...}/{slug}/        -> hub-ul echivalent (legacy-categories.json)
//   /tag/{tag}/                    -> căutare
//   /page/N/, /author/…            -> prima pagină / Despre
//   *sitemap*.xml (Yoast)          -> /sitemap.xml
// Tabelele sunt generate de scripts/migration/generate-redirects.ts — nu se editează manual.
//
// Notă: în Next.js 16 fișierul de "middleware" a fost redenumit "proxy".

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import legacyRedirects from "@/data/legacy-redirects.json";
import legacyCategories from "@/data/legacy-categories.json";

const articles = legacyRedirects as Record<string, string>;
const categories = legacyCategories as Record<string, string>;

const FIXED: Record<string, string> = {
  "privacy-policy": "/confidentialitate/",
  "politica-de-confidentialitate": "/confidentialitate/",
  popular: "/",
  "frontend-submission": "/contact/",
  "comments/feed": "/feed/",
};

function target(segments: string[]): string | null {
  const [first, ...rest] = segments;
  const joined = segments.join("/");
  if (FIXED[joined]) return FIXED[joined];

  if (segments.length === 1) return articles[first] ?? null;
  if (segments.length === 2 && (rest[0] === "amp" || rest[0] === "feed")) return articles[first] ?? null;

  if (first === "category") return categories[segments[segments.length - 1]] ?? "/";
  if (first === "tag" && rest[0]) {
    let tag = rest[0];
    try {
      tag = decodeURIComponent(tag); // URL malformat (%E2%8) -> se folosește brut
    } catch {}
    return `/cautare/?q=${encodeURIComponent(tag.replace(/-/g, " "))}`;
  }
  if (first === "page" || first === "author") return first === "author" ? "/despre/" : "/";
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (/^\/[^/]*sitemap[^/]*\.xml$/.test(pathname) && pathname !== "/sitemap.xml") {
    return NextResponse.redirect(new URL("/sitemap.xml", request.url), 301);
  }

  const segments = pathname.split("/").filter(Boolean);
  const newUrl = segments.length ? target(segments) : null;
  if (newUrl && newUrl !== pathname) {
    return NextResponse.redirect(new URL(newUrl, request.url), 301);
  }
  return NextResponse.next();
}

export const config = {
  // excluderi precise ("api/", nu "api") — un articol vechi "apicultori-…" trebuie redirecționat
  matcher: [
    "/((?!api/|admin/|admin$|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
