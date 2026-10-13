// Orarul zilei, ora Chișinăului. Cron-urile rulează în UTC, iar Moldova trece
// iarnă/vară: de aceea cron-ul pornește din oră în oră și decide aici.
// Decizia proprietarului (2026-10-14): mesajul de dimineață la 07:00 în zilele
// de lucru, 08:00 în weekend și de sărbători; apoi știrile din 2 în 2 ore, ultima
// rulare la 21:00 (20:00 în zilele libere); la 22:00 rezumatul serii, apoi pauză.
import { isDayOff } from "@/lib/orthodox";

export const EVENING_HOUR = 22;

export function todayChisinau(): Date {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" }).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const chisinauHour = () =>
  Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Chisinau" }));

export const morningHour = () => (isDayOff(todayChisinau()) ? 8 : 7);
export const lastRunHour = () => (isDayOff(todayChisinau()) ? 20 : 21);

// rulările automate: la ora mesajului de dimineață, apoi din 2 în 2 ore, plus ultima oră
export function isPipelineHour(hour = chisinauHour()): boolean {
  const start = morningHour();
  const last = lastRunHour();
  return hour >= start && hour <= last && ((hour - start) % 2 === 0 || hour === last);
}
