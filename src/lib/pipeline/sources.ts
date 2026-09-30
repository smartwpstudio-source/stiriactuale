import { fetchRssFeed } from "./rss";
import type { RawCandidate } from "./types";

// Doar RSS-uri directe ale redacțiilor, verificate live (2026-09). Excluse:
//  - yam.md: termenii interzic preluarea automată în scop comercial — rămâne
//    unealta editorului, pentru "Adaugă știre după link" din /admin;
//  - Google News RSS: licență "personal, non-commercial use";
//  - ipn, esp, noi.md: 403 pentru clienți non-browser.
// `trusted` = credibilitate ridicată în Media Radar CJI; contează în scor, nu
// exclude nimic (surse cu credibilitate scăzută nu sunt în listă deloc).
export const FEEDS = [
  { id: "unimedia", name: "Unimedia", url: "https://www.unimedia.info/rss/news.xml", trusted: false },
  { id: "moldova1", name: "Moldova 1", url: "https://moldova1.md/rss", trusted: true },
  { id: "ziarulnational", name: "Ziarul Național", url: "https://ziarulnational.md/feed/", trusted: false },
  { id: "moldpres", name: "Moldpres", url: "https://www.moldpres.md/config/rss.php?lang=rom", trusted: false },
  { id: "zdg", name: "Ziarul de Gardă", url: "https://www.zdg.md/feed/", trusted: true },
  { id: "newsmaker", name: "NewsMaker", url: "https://newsmaker.md/ro/feed/", trusted: true },
  { id: "tv8", name: "TV8", url: "https://tv8.md/feed", trusted: false },
  { id: "nokta", name: "Nokta", url: "https://nokta.md/feed/", trusted: true }, // în rusă, Găgăuzia
  { id: "diez", name: "Diez", url: "https://www.diez.md/feed/", trusted: false },
  { id: "pulsmedia", name: "Puls Media", url: "https://pulsmedia.md/rss/all/", trusted: false },
];

export const TRUSTED_SOURCES = new Set(FEEDS.filter((f) => f.trusted).map((f) => f.name));

// Fiecare feed e citit independent — unul căzut nu oprește colectarea.
export async function fetchAllSources() {
  const results = await Promise.allSettled(FEEDS.map((f) => fetchRssFeed(f.url, f.id, f.name)));
  const candidates: RawCandidate[] = [];
  const failedFeeds: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") candidates.push(...r.value);
    else failedFeeds.push(`${FEEDS[i].id}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
  });
  return { candidates, failedFeeds };
}
