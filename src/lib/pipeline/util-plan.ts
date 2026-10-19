import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { appSettings } from "./db/schema";
import { morningHour } from "@/lib/schedule";

// Partea ușoară a rubricii Util (fără Claude): tipurile, orele de scriere și
// cererile editorului din /admin/util/. Planul și scrierea: util.ts (doar în pipeline).

export const UTIL_TYPES = { eveniment: "Eveniment", sezon: "Anotimp", unealta: "Calculator / ghid", reteta: "Rețetă", sfant: "Sfântul zilei" } as const;
export const PLAN_REQUEST = "util_plan_request"; // "1" = editorul a cerut planul din admin
export const WRITE_REQUEST = "util_write_request"; // id-ul temei de scris acum

// 5 pe zi (2026-10-19): rulările 2-6 ale zilei, 09-17 în zilele de lucru, 10-18 în cele libere
export const utilHours = () => [2, 4, 6, 8, 10].map((h) => morningHour() + h);

export async function getSetting(k: string) {
  const [r] = await getDb().select().from(appSettings).where(eq(appSettings.key, k));
  return r?.value ?? null;
}
export async function setSetting(k: string, v: string) {
  await getDb().insert(appSettings).values({ key: k, value: v }).onConflictDoUpdate({ target: appSettings.key, set: { value: v } });
}
export const requestPlan = () => setSetting(PLAN_REQUEST, "1");
export const requestWrite = (id: number) => setSetting(WRITE_REQUEST, String(id));
