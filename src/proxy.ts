// Redirect 301 pentru articolele vechi de pe WordPress (structură plată: /{slug}/)
// către noul URL pe bază de secțiune (/regiuni/{raion}/{slug}/, /national/{slug}/ etc).
//
// Tabelul old_slug -> new_url e generat din date reale de scripts/migration/generate-redirects.ts
// (vezi src/data/legacy-redirects.json) — nu se editează manual.
//
// Notă: în Next.js 16 fișierul de "middleware" a fost redenumit "proxy" (comportament identic:
// rulează înainte de randare, poate face NextResponse.redirect).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import legacyRedirects from "@/data/legacy-redirects.json";

const redirectMap = legacyRedirects as Record<string, string>;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = pathname.replace(/^\/+|\/+$/g, "");

  // URL-urile vechi WP erau întotdeauna un singur segment (/{slug}/); orice cale
  // cu mai multe segmente e deja în formatul nou și nu trebuie verificată în tabel.
  if (slug && !slug.includes("/")) {
    const newUrl = redirectMap[slug];
    if (newUrl) {
      return NextResponse.redirect(new URL(newUrl, request.url), 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js).*)",
  ],
};
