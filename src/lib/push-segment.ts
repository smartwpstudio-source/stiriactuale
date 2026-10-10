import { COUNTRY_NAMES, RAION_NAMES } from "@/lib/content/geo";

// Cine primește un push (pur, folosit și în browser, și pe server).
// Regula proprietarului (2026-10-11):
//  - știrile naționale (sau orice fără raion/țară) → toți abonații;
//  - știrea dintr-un raion → doar cei care au ales acel raion;
//  - știrea din diaspora → doar cei care au ales acea țară.
// Cine a ales „Toată țara” nu primește știri locale sau din diaspora.
export const PUSH_SCOPES = ["all", "raion", "tara"] as const;
export type PushScope = (typeof PUSH_SCOPES)[number];
export interface PushPrefs {
  scope: PushScope;
  raion: string | null;
  country: string | null;
}
interface Target {
  section: string;
  locality: string | null;
  country: string | null;
}

export function receives(sub: PushPrefs, a: Target): boolean {
  if (a.section === "regiuni" && a.locality) return sub.scope === "raion" && sub.raion === a.locality;
  if (a.section === "diaspora" && a.country) return sub.scope === "tara" && sub.country === a.country;
  return true;
}

// Validare strictă a preferințelor venite din browser (null = invalid).
export function parsePrefs(v: { scope?: unknown; raion?: unknown; country?: unknown }): PushPrefs | null {
  const has = (o: object, k: unknown) => typeof k === "string" && Object.hasOwn(o, k);
  if (v.scope === "all") return { scope: "all", raion: null, country: null };
  if (v.scope === "raion" && has(RAION_NAMES, v.raion)) return { scope: "raion", raion: v.raion as string, country: null };
  if (v.scope === "tara" && has(COUNTRY_NAMES, v.country)) return { scope: "tara", raion: null, country: v.country as string };
  return null;
}
