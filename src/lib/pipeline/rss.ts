import { XMLParser } from "fast-xml-parser";
import type { RawCandidate } from "./types";

// htmlEntities: ziarulnational.md trimite diacriticele ca entități (&#xE2;)
const parser = new XMLParser({ ignoreAttributes: false, htmlEntities: true });

interface RssItem {
  title?: string | number;
  link?: string;
  description?: string;
  "content:encoded"?: string;
  pubDate?: string;
}

// Material de lucru pentru clasificare/scriere, nu text republicat — 2000 de
// caractere ajung pentru fapte, fără a umfla costul Opus.
const MAX_SUMMARY_CHARS = 2000;

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRssFeed(url: string, feedId: string, sourceName: string): Promise<RawCandidate[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (stiriactuale-pipeline)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`RSS ${feedId}: HTTP ${res.status}`);

  const raw = parser.parse(await res.text())?.rss?.channel?.item as RssItem | RssItem[] | undefined;
  const items = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];

  return items.map((item) => {
    // content:encoded (unimedia) e mai bogat decât description, când există
    const body = [item["content:encoded"], item.description]
      .map((s) => stripHtml(String(s ?? "")))
      .sort((a, b) => b.length - a.length)[0];
    return {
      title: String(item.title ?? "").trim(),
      summary: body.slice(0, MAX_SUMMARY_CHARS),
      sourceName,
      sourceUrl: String(item.link ?? "").trim(),
      publishedAt: new Date(item.pubDate ?? Date.now()),
      feedId,
    };
  });
}
