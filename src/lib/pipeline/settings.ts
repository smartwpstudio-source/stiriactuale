import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { appSettings } from "./db/schema";

// Butonul Pornit/Oprit din /admin: oprit = fără colectare și fără știri
// automate (nu se consumă nimic). Linkurile editorului se scriu oricum, la
// „Publică acum”. Fără rând în tabel = pornit (comportamentul de până acum).
const KEY = "pipeline_enabled";

export async function pipelineEnabled(): Promise<boolean> {
  const [row] = await getDb().select().from(appSettings).where(eq(appSettings.key, KEY));
  return row?.value !== "0";
}

export async function setPipelineEnabled(on: boolean): Promise<void> {
  const value = on ? "1" : "0";
  await getDb().insert(appSettings).values({ key: KEY, value }).onConflictDoUpdate({ target: appSettings.key, set: { value } });
}

// Regula „știre cu ghid” (guide-rule.ts): „raport” (implicit — se publică tot,
// se notează ce s-ar fi respins) sau „strict” (fără ghid și fără scutire = nepublicată).
const GUIDE_KEY = "guide_rule";

export async function guideRuleMode(): Promise<"raport" | "strict"> {
  const [row] = await getDb().select().from(appSettings).where(eq(appSettings.key, GUIDE_KEY));
  return row?.value === "strict" ? "strict" : "raport";
}

export async function setGuideRuleMode(mode: "raport" | "strict"): Promise<void> {
  await getDb().insert(appSettings).values({ key: GUIDE_KEY, value: mode }).onConflictDoUpdate({ target: appSettings.key, set: { value: mode } });
}
