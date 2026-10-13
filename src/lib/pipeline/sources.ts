import { fetchRssFeed } from "./rss";
import type { RawCandidate } from "./types";

// Doar RSS-uri directe ale redacțiilor, verificate live (2026-09). Excluse:
//  - yam.md: termenii interzic preluarea automată în scop comercial — rămâne
//    unealta editorului, pentru "Adaugă știre după link" din /admin;
//  - Google News RSS: licență "personal, non-commercial use";
//  - ipn, esp, noi.md: 403 pentru clienți non-browser;
//  - nokta.md: 403 pentru IP-urile din cloud (GitHub Actions, Vercel) — merge doar local.
// `trusted` = credibilitate ridicată în Media Radar CJI; contează în scor, nu
// exclude nimic (surse cu credibilitate scăzută nu sunt în listă deloc).
// `telegram` = canalul public al redacției — vizualizările și reacțiile de acolo
// măsoară interesul public (telegram-signal.ts). Moldova 1 și Moldpres n-au.
export const FEEDS: { id: string; name: string; url: string; trusted: boolean; telegram?: string }[] = [
  { id: "unimedia", name: "Unimedia", url: "https://www.unimedia.info/rss/news.xml", trusted: false, telegram: "unimedia_info" },
  { id: "moldova1", name: "Moldova 1", url: "https://moldova1.md/rss", trusted: true },
  { id: "ziarulnational", name: "Ziarul Național", url: "https://ziarulnational.md/feed/", trusted: false, telegram: "ziarulnational" },
  { id: "moldpres", name: "Moldpres", url: "https://www.moldpres.md/config/rss.php?lang=rom", trusted: false },
  { id: "zdg", name: "Ziarul de Gardă", url: "https://www.zdg.md/feed/", trusted: true, telegram: "zdgmd" },
  { id: "newsmaker", name: "NewsMaker", url: "https://newsmaker.md/ro/feed/", trusted: true, telegram: "newsmakerlive" },
  { id: "tv8", name: "TV8", url: "https://tv8.md/feed", trusted: false, telegram: "tv8md" },
  { id: "diez", name: "Diez", url: "https://www.diez.md/feed/", trusted: false, telegram: "diezmd" },
  { id: "pulsmedia", name: "Puls Media", url: "https://pulsmedia.md/rss/all/", trusted: false, telegram: "pulsmedia" },
  // adăugate 2026-10-13 (decizia proprietarului); verificate local: titluri, pubDate, text integral
  { id: "tvrmoldova", name: "TVR Moldova", url: "https://tvrmoldova.md/rss/all", trusted: false },
  { id: "deschide", name: "Deschide.md", url: "https://deschide.md/api/rss", trusted: false },
  // surse internaționale în română, care publică și noaptea — pentru Lumea
  // (aceleași criterii stricte din classify.ts); decizia proprietarului, 2026-10-05
  { id: "europalibera", name: "Europa Liberă", url: "https://moldova.europalibera.org/api/", trusted: true },
  { id: "digi24", name: "Digi24", url: "https://www.digi24.ro/rss/stiri/externe", trusted: false },
  { id: "hotnews", name: "HotNews", url: "https://hotnews.ro/c/actualitate/international/feed", trusted: false },
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
