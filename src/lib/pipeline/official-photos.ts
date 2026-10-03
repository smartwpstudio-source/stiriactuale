import { XMLParser } from "fast-xml-parser";
import { decodeEntities } from "@/lib/html-entities";
import { HAIKU_MODEL, structured } from "./llm";

// Pozele reale de la fața locului, din comunicatele instituțiilor (Poliția,
// IGSU, Ministerul Apărării…): date publicului ca informare, se preiau cu
// semnătura „Foto: <instituția>”. Pozele redacțiilor private NU se preiau
// (drept de autor; risc AdSense) — decizia proprietarului, 2026-10-03.
const FEEDS = [
  { name: "Poliția", url: "https://politia.md/rss.xml" },
  { name: "IGSU", url: "https://www.igsu.gov.md/rss.xml" },
  { name: "Ministerul Apărării", url: "https://www.army.md/rss.xml" },
  { name: "MAI", url: "https://mai.gov.md/rss.xml" },
  { name: "Guvernul", url: "https://gov.md/ro/rss.xml" },
  { name: "Poliția de Frontieră", url: "https://www.border.gov.md/rss.xml" },
  { name: "MAE", url: "https://mfa.gov.md/rss.xml" },
  { name: "CNA", url: "https://www.cna.md/rss.xml" },
];
const MAX_AGE_HOURS = 48;

export interface OfficialItem {
  title: string;
  summary: string; // începutul comunicatului: titlurile sunt uneori doar „Informează!”
  photo: string;
  credit: string;
}

// Drupal-ul instituțiilor dă data în română: „Vin, 10/02/2026 - 17:26” (LL/ZZ/AAAA,
// ora Chișinăului); altele, RFC 822 standard.
export function feedDate(s: string): number {
  const m = s.match(/([0-9]{2})[/]([0-9]{2})[/]([0-9]{4}) - ([0-9]{2}):([0-9]{2})/);
  return m ? Date.parse(`${m[3]}-${m[1]}-${m[2]}T${m[4]}:${m[5]}:00+03:00`) : Date.parse(s);
}

// Șabloanele grafice („Informează”, sigla) se refolosesc luni la rând: Drupal
// pune luna încărcării în cale (/2026-07/), deci o poză mai veche de o lună
// decât comunicatul nu e de la fața locului.
export function isFreshPhoto(url: string, date: number): boolean {
  if (/logo|sigla|banner|placeholder|informeaz|precizeaz|comunicat/i.test(url)) return false;
  const m = url.match(/[/](20[0-9]{2})-([0-9]{2})[/]/);
  if (!m) return true;
  const d = new Date(date);
  return d.getUTCFullYear() * 12 + d.getUTCMonth() - (Number(m[1]) * 12 + Number(m[2]) - 1) <= 1;
}

const parser = new XMLParser({ ignoreAttributes: false, htmlEntities: true });

async function readFeed(feed: (typeof FEEDS)[number]): Promise<OfficialItem[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (stiriactuale-pipeline)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return [];
  const raw = parser.parse(await res.text())?.rss?.channel?.item;
  const items: { title?: unknown; description?: unknown; pubDate?: string }[] = raw ? [raw].flat() : [];
  const since = Date.now() - MAX_AGE_HOURS * 3600_000;
  return items.flatMap((it) => {
    const date = it.pubDate ? feedDate(it.pubDate) : NaN;
    const html = decodeEntities(String(it.description ?? ""));
    const img = html.match(/<img[^>]+src="(https:[^"]+)"/i)?.[1];
    if (!img || !(date > since) || !isFreshPhoto(img, date)) return [];
    const summary = html.replace(/<[^>]+>/g, " ").replace(/ +/g, " ").trim().slice(0, 300);
    return [{ title: String(it.title ?? "").trim(), summary, photo: img, credit: feed.name }];
  });
}

// O dată pe rulare; un flux căzut nu oprește nimic.
export async function loadOfficialItems(): Promise<OfficialItem[]> {
  const all = await Promise.allSettled(FEEDS.map(readFeed));
  return all.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// Haiku alege comunicatul despre ACELAȘI eveniment ca știrea (sau niciunul).
export async function matchOfficialPhoto(subject: string, items: OfficialItem[]): Promise<OfficialItem | null> {
  if (!items.length) return null;
  try {
    const { match } = await structured<{ match: number }>({
      model: HAIKU_MODEL,
      system:
        "Primești o știre și o listă de comunicate ale instituțiilor. Răspunzi cu numărul comunicatului despre ACELAȘI eveniment concret (același incident, aceeași acțiune), sau -1 dacă niciunul nu e despre el. O temă asemănătoare nu ajunge.",
      prompt: `Știrea: ${subject}\n\nComunicate:\n${items.map((it, i) => `${i}. [${it.credit}] ${it.title} — ${it.summary}`).join("\n")}`,
      schema: { type: "object", properties: { match: { type: "integer" } }, required: ["match"] },
      maxBudgetUsd: 0.05,
    });
    return items[match] ?? null;
  } catch {
    return null;
  }
}
