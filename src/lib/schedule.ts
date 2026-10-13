// Orarul zilei, ora Chișinăului. Cron-urile rulează în UTC, iar Moldova trece
// iarnă/vară: de aceea cron-ul pornește din oră în oră și decide aici.
// Decizia proprietarului (2026-10-14): mesajul de dimineață la 07:00 în zilele
// de lucru, 08:00 în weekend și de sărbători; apoi știrile din 2 în 2 ore, ultima
// rulare la 21:00; la 22:00 rezumatul serii, apoi pauză până dimineață.
import { isDayOff } from "@/lib/orthodox";

export const LAST_RUN_HOUR = 21;
export const EVENING_HOUR = 22;

export function todayChisinau(): Date {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" }).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const chisinauHour = () =>
  Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Chisinau" }));

export const morningHour = () => (isDayOff(todayChisinau()) ? 8 : 7);

// rulările automate: la ora mesajului de dimineață, apoi din 2 în 2 ore, plus 21:00
export function isPipelineHour(hour = chisinauHour()): boolean {
  const start = morningHour();
  return hour >= start && hour <= LAST_RUN_HOUR && ((hour - start) % 2 === 0 || hour === LAST_RUN_HOUR);
}
