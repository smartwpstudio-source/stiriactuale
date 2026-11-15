import { articleUrl } from "./url";
import { ruNewsPath } from "../ru-news-public";
import type { Article } from "./types";

// Ce se reface după o schimbare: listele principale mereu, plus paginile unui articol
// (RO, RU, prima pagină a raionului / țării / subiectelor lui). Restul, după ceas.
// Folosit de /api/revalidate (pipeline) și de /admin (2026-11-15: adminul refăcea TOT
// site-ul la fiecare salvare — mii de articole refăcute din bază la vizita următoare).
export const ALWAYS = ["/", "/national", "/international", "/diaspora", "/regiuni", "/video", "/util", "/ru", "/comunicate"];

type Changed = Pick<Article, "section" | "slug"> & { locality: string | null; country: string | null; topics: string[] | null };

export function articlePaths(a: Changed): string[] {
  return [
    articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined }),
    ruNewsPath(a.slug),
    ...(a.section === "regiuni" && a.locality ? [`/regiuni/${a.locality}`] : []),
    ...(a.section === "diaspora" && a.country ? [`/diaspora/${a.country}`] : []),
    ...(a.topics ?? []).map((topic) => `/subiect/${topic}`),
  ];
}
