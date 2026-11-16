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
