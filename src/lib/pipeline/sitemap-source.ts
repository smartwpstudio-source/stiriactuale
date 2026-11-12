import { decodeEntities } from "@/lib/html-entities";
import type { RawCandidate } from "./types";

// Site-uri fără RSS, dar cu harta Google News (news-sitemap.xml, Yoast): titlul, data și adresa
// fiecărei știri din ultimele 2 zile. Rezumatul e titlul; textul îl ia scrierea din pagină, ca la RSS.
// Studio-L (TV Căușeni, 2026-11-12, cerut de editor): știri din Căușeni și Ștefan Vodă care nu apar în altă parte.
export const SITEMAP_FEEDS = [{ id: "studio-l", name: "Studio-L (TV Căușeni)", url: "https://www.studio-l.online/news-sitemap.xml", language: "ro" }];

export function parseNewsSitemap(xml: string, feedId: string, sourceName: string, language: string): RawCandidate[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(([, u]) => {
    const loc = u.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    const date = u.match(/<news:publication_date>([^<]+)</)?.[1];
    const lang = u.match(/<news:language>([^<]+)</)?.[1]?.trim();
    const raw = u.match(/<news:title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/news:title>/)?.[1];
    if (!loc || !date || !raw || (lang && lang !== language)) return [];
    const title = decodeEntities(raw).replace(/\s+/g, " ").trim();
    const publishedAt = new Date(date);
    if (!title || Number.isNaN(publishedAt.getTime())) return [];
    return [{ title, summary: title, sourceName, sourceUrl: decodeEntities(loc), publishedAt, feedId }];
  });
}

export async function fetchNewsSitemap(url: string, feedId: string, sourceName: string, language: string): Promise<RawCandidate[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return parseNewsSitemap(await res.text(), feedId, sourceName, language);
}
