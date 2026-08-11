import { fetchAtomFeed, fetchRssFeed, googleNewsUrl } from "./rss";
import type { RawCandidate } from "./types";
import { RAION_NAMES } from "@/lib/content/geo";

const DIASPORA_COUNTRIES = ["Italia", "Franța", "Germania", "Regatul Unit", "SUA"];

interface FeedDefinition {
  id: string;
  fetch: () => Promise<RawCandidate[]>;
}

// Surse fixe confirmate live (vezi plan-implementare-agregator-stiri-ai.md 3.1,
// actualizat cu verificarea din 2026-08-11):
//  - yam.md: meta-agregator, combină zeci de surse moldovenești
//  - Moldpres: comunicate oficiale, sursă complementară
//  - Ziarul de Gardă: prioritizat explicit pentru subiectul corupție
const FIXED_FEEDS: FeedDefinition[] = [
  { id: "yam.md", fetch: () => fetchAtomFeed("https://news.yam.md/ro/rss", "yam.md") },
  {
    id: "moldpres",
    fetch: () =>
      fetchRssFeed("https://www.moldpres.md/config/rss.php?lang=rom", "moldpres", "Moldpres"),
  },
  {
    id: "zdg",
    fetch: () => fetchRssFeed("https://www.zdg.md/feed/", "zdg", "Ziarul de Gardă"),
  },
];

function googleNewsFeed(id: string, query: string): FeedDefinition {
  return { id, fetch: () => fetchRssFeed(googleNewsUrl(query), id) };
}

const NATIONAL_FEEDS: FeedDefinition[] = [
  googleNewsFeed("gnews-national", "Republica Moldova"),
];

const INTERNATIONAL_FEEDS: FeedDefinition[] = [
  googleNewsFeed("gnews-intl-ucraina", "Ucraina Republica Moldova"),
  googleNewsFeed("gnews-intl-ue", "Uniunea Europeana Republica Moldova"),
  googleNewsFeed("gnews-intl-rusia", "Rusia Republica Moldova"),
];

const RAION_FEEDS: FeedDefinition[] = Object.entries(RAION_NAMES).map(([slug, label]) =>
  googleNewsFeed(`gnews-raion-${slug}`, label),
);

const DIASPORA_FEEDS: FeedDefinition[] = DIASPORA_COUNTRIES.map((tara) =>
  googleNewsFeed(`gnews-diaspora-${tara}`, `moldoveni ${tara}`),
);

export const ALL_FEEDS: FeedDefinition[] = [
  ...FIXED_FEEDS,
  ...NATIONAL_FEEDS,
  ...INTERNATIONAL_FEEDS,
  ...RAION_FEEDS,
  ...DIASPORA_FEEDS,
];

export interface FetchAllResult {
  candidates: RawCandidate[];
  failedFeeds: { id: string; error: string }[];
}

// Fiecare feed e citit independent — dacă unul pică (rate-limit, timeout),
// restul pipeline-ului continuă. Un feed căzut nu trebuie să oprească toată
// rularea de 2 ore.
export async function fetchAllSources(): Promise<FetchAllResult> {
  const results = await Promise.allSettled(ALL_FEEDS.map((feed) => feed.fetch()));

  const candidates: RawCandidate[] = [];
  const failedFeeds: { id: string; error: string }[] = [];

  results.forEach((result, i) => {
    const feed = ALL_FEEDS[i];
    if (result.status === "fulfilled") {
      candidates.push(...result.value);
    } else {
      failedFeeds.push({ id: feed.id, error: String(result.reason) });
    }
  });

  return { candidates, failedFeeds };
}
