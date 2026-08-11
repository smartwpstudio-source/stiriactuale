import { XMLParser } from "fast-xml-parser";
import type { RawCandidate } from "./types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

interface AtomLink {
  "@_href"?: string;
  "@_rel"?: string;
}

interface AtomEntry {
  title?: string;
  link?: AtomLink | AtomLink[];
  updated?: string;
  published?: string;
  author?: { name?: string };
  summary?: string | { "#text"?: string };
}

interface AtomFeedDoc {
  feed?: { entry?: AtomEntry | AtomEntry[] };
}

interface RssSourceTag {
  "#text"?: string;
  "@_url"?: string;
}

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  source?: RssSourceTag | string;
}

interface RssFeedDoc {
  rss?: { channel?: { item?: RssItem | RssItem[] } };
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

async function fetchXmlText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (stiriactuale-pipeline)" },
  });
  if (!res.ok) throw new Error(`RSS fetch ${url}: HTTP ${res.status}`);
  return res.text();
}

// yam.md publică Atom, nu RSS 2.0 — <entry>/<author><name> conține sursa
// originală a știrii (canalul de descoperire, nu sursa faptică — vezi
// plan-implementare-agregator-stiri-ai.md secțiunea 3.1).
export async function fetchAtomFeed(url: string, feedId: string): Promise<RawCandidate[]> {
  const xml = parser.parse(await fetchXmlText(url)) as AtomFeedDoc;
  const entries = toArray(xml.feed?.entry);

  return entries.map((entry) => {
    const links = toArray(entry.link);
    const link = links.find((l) => l["@_rel"] === "alternate") ?? links[0];
    const summary =
      typeof entry.summary === "string" ? entry.summary : (entry.summary?.["#text"] ?? "");

    return {
      title: (entry.title ?? "").trim(),
      summary: stripHtml(summary),
      sourceName: entry.author?.name?.trim() || feedId,
      sourceUrl: link?.["@_href"] ?? "",
      publishedAt: new Date(entry.updated ?? entry.published ?? Date.now()),
      feedId,
    };
  });
}

// RSS 2.0 standard — Moldpres, Ziarul de Gardă (sursă fixă = numele feed-ului)
// și Google News (sursă variabilă per item, din <source> sau sufixul titlului).
export async function fetchRssFeed(
  url: string,
  feedId: string,
  fixedSourceName?: string,
): Promise<RawCandidate[]> {
  const xml = parser.parse(await fetchXmlText(url)) as RssFeedDoc;
  const items = toArray(xml.rss?.channel?.item);

  return items.map((item) => {
    let title = (item.title ?? "").trim();
    let sourceName = fixedSourceName;

    if (!sourceName) {
      const sourceText =
        typeof item.source === "string" ? item.source : item.source?.["#text"];
      if (sourceText) {
        sourceName = sourceText.trim();
        const suffix = ` - ${sourceName}`;
        if (title.endsWith(suffix)) title = title.slice(0, -suffix.length);
      } else {
        sourceName = feedId;
      }
    }

    return {
      title,
      summary: stripHtml(item.description ?? ""),
      sourceName,
      sourceUrl: item.link ?? "",
      publishedAt: new Date(item.pubDate ?? Date.now()),
      feedId,
    };
  });
}

export function googleNewsUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=ro&gl=RO&ceid=RO:ro`;
}
