import { readFile } from "node:fs/promises";
import path from "node:path";

// „Azi în istorie”: evenimentele pe zile din content/istorie/MM.json (scrise
// în cloud, verificate pe surse — docs/cloud/istorie.md). Pagini
// /azi-in-istorie/<zi>-<luna>/ și secțiunea din „Bună dimineața”. Doar pe server.
export interface HistoryEvent {
  an: number;
  text: string;
  moldova: boolean;
  sursa: string;
}

export const MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const HISTORY_PATH = "/azi-in-istorie/";
export const daySlug = (month: number, day: number) => `${day}-${MONTHS[month - 1]}`;
export const dayLabel = (month: number, day: number) => `${day} ${MONTHS[month - 1]}`;
export const dayPath = (month: number, day: number) => `${HISTORY_PATH}${daySlug(month, day)}/`;

export function parseDaySlug(slug: string): { month: number; day: number } | null {
  const m = slug.match(/^(\d{1,2})-([a-z]+)$/);
  const month = m ? MONTHS.indexOf(m[2]) + 1 : 0;
  const day = m ? Number(m[1]) : 0;
  return month && day >= 1 && day <= DAYS[month - 1] ? { month, day } : null;
}

const cache = new Map<number, Promise<Record<string, HistoryEvent[]> | null>>();
export function getHistoryMonth(month: number) {
  if (!cache.has(month))
    cache.set(
      month,
      readFile(path.join(process.cwd(), "content", "istorie", `${String(month).padStart(2, "0")}.json`), "utf8")
        .then((s) => JSON.parse(s).zile as Record<string, HistoryEvent[]>)
        .catch(() => null),
    );
  return cache.get(month)!;
}

export async function getHistoryDay(month: number, day: number): Promise<HistoryEvent[]> {
  return (await getHistoryMonth(month))?.[String(day)] ?? [];
}

// toate zilele cu evenimente (lunile scrise deja) — pentru pagini și sitemap
export async function historyDays(): Promise<{ month: number; day: number }[]> {
  const out: { month: number; day: number }[] = [];
  for (let month = 1; month <= 12; month++) {
    const zile = await getHistoryMonth(month);
    if (!zile) continue;
    for (let day = 1; day <= DAYS[month - 1]; day++) if (zile[String(day)]?.length) out.push({ month, day });
  }
  return out;
}

export const yearLabel = (an: number) => (an < 0 ? `${-an} î.Hr.` : String(an));
