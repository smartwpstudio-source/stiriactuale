import { readFile } from "node:fs/promises";
import path from "node:path";
import { getGuides, type Guide } from "./content/guides";
import { bestGuide } from "./content/related-guide";

// Sfinții pe zile (content/calendar/sfinti/MM.json, scriși în cloud din
// calendarele bisericești — vezi docs/cloud/calendar.md). Doar pe server.
export interface SaintDay {
  sfinti: string[];
  sarbatoare: string | null;
  cruce: "rosie" | "neagra" | null;
}

export async function getSaintsMonth(month: number): Promise<Record<string, SaintDay> | null> {
  try {
    const f = path.join(process.cwd(), "content", "calendar", "sfinti", `${String(month).padStart(2, "0")}.json`);
    return JSON.parse(await readFile(f, "utf8")).zile;
  } catch {
    return null;
  }
}

export async function getSaintDay(month: number, day: number): Promise<SaintDay | null> {
  return (await getSaintsMonth(month))?.[String(day)] ?? null;
}

// Pagina de sărbătoare (categoria „sarbatori”) potrivită pentru un nume de
// sărbătoare din calendar — aceeași potrivire pe cuvinte ca „Ghid util”.
export async function holidayGuides(): Promise<Guide[]> {
  return (await getGuides()).filter((g) => g.category === "sarbatori");
}
export const guideForFeast = (name: string, guides: Guide[]) => bestGuide(name, guides);
