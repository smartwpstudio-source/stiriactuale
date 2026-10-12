import { readContent } from "./content/store";
import { getGuides, type Guide } from "./content/guides";

// Sfinții pe zile (content/calendar/sfinti/MM.json, scriși în cloud din
// calendarele bisericești — vezi docs/cloud/calendar.md). Doar pe server.
export interface SaintDay {
  sfinti: string[];
  sarbatoare: string | null;
  cruce: "rosie" | "neagra" | null;
}

export async function getSaintsMonth(month: number): Promise<Record<string, SaintDay> | null> {
  const f = await readContent<{ zile: Record<string, SaintDay> }>("calendar/sfinti", String(month).padStart(2, "0"));
  return f?.zile ?? null;
}

export async function getSaintDay(month: number, day: number): Promise<SaintDay | null> {
  return (await getSaintsMonth(month))?.[String(day)] ?? null;
}

// Paginile de sărbătoare publicate (categoria „sarbatori”) — calendarul leagă
// doar spre cele care există.
export async function holidayGuides(): Promise<Guide[]> {
  return (await getGuides()).filter((g) => g.category === "sarbatori");
}
