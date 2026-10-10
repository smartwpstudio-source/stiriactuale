import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";
import { stripDiacritics } from "./text-normalize";
import { pushNow } from "@/lib/publish-effects";
import { notifyEditor } from "@/lib/telegram";

// Push automat, cu reguli stricte (decizia proprietarului, 2026-10-11): doar
// știrile marcate pushWorthy de clasificator ȘI dintr-o categorie de mai jos.
// Fără plafon zilnic (să nu pierdem o știre importantă); rămân orele de
// liniște 22–07 (pushBlockedReason) și un singur push per articol (pushSentAt).

// calamități, urgențe, vreme periculoasă, alerte
const EMERGENCY = new RegExp(
  [
    String.raw`\bcod(ul)? (galben|portocaliu|rosu)\b`,
    String.raw`avertizar\w* (meteo|hidrologic)`,
    String.raw`stare\w* de urgenta`,
    "evacuar",
    "inundati",
    String.raw`incendi\w* (mare|masiv|puternic|de proportii|de vegetatie)`,
    "cutremur",
    String.raw`\bger\b`,
    "canicul",
    "viscol",
    "furtun",
    "polei",
    String.raw`alerta (aeriana|de securitate)`,
    String.raw`\b(\d{2,}|doi|doua|trei|patru|cinci|sase|sapte|opt|noua|zece|mai multi|mai multe) (morti|decedati|victime|oameni au murit)`,
    String.raw`(alert|avertiz|mesaj)\w*.{0,40}\b(112|igsu)\b`,
    String.raw`\b(112|igsu)\b.{0,40}(alert|avertiz)`,
  ].join("|"),
);

// lege / modificare de lege / hotărâre / tarif — DOAR adoptate sau intrate în vigoare
const ADOPTED =
  /\b(a|au) (adoptat|aprobat|votat|modificat|majorat|redus|introdus|anulat|interzis)\b|\b(a|au) fost (adoptat|aprobat|votat|modificat|publicat)\w*|intra\w* in vigoare|tarif\w* no[iu]\b|noul tarif/;
const SUBJECT =
  /\blege|\bcodul|hotarar|guvern|parlament|tarif|\bpret|anre|amenz|\btax|impozit|pensi|salari|regul|\bacte|buletin|pasaport|permis|acciz|scutir|indemniza|aloca/;
// doar discutat / proiect / prima lectură: nu e încă regulă
const NOT_YET = /proiect|prima lectura|dezbater|consultar|propune|ar putea/;
const FINAL = /intra\w* in vigoare|lectura (a doua|finala)|a doua lectura|in lectura finala/;

export function shouldAutoPush(a: { pushWorthy: boolean; section: string; kind: string; title: string; leadText: string }): boolean {
  if (!a.pushWorthy || a.section === "international" || a.kind === "pe-scurt" || a.kind === "analiza") return false;
  const t = stripDiacritics(`${a.title} ${a.leadText}`).toLowerCase();
  if (EMERGENCY.test(t)) return true;
  return ADOPTED.test(t) && SUBJECT.test(t) && (!NOT_YET.test(t) || FINAL.test(t));
}

// După publicare, în pipeline. Erorile se loghează, nu opresc publicarea.
export async function autoPush(id: number): Promise<string | null> {
  try {
    const [a] = await getDb().select().from(articles).where(eq(articles.id, id));
    if (!a || a.status !== "published" || a.pushSentAt || !shouldAutoPush(a)) return null;
    // pushNow verifică orele de liniște și cheile VAPID
    const result = await pushNow(id);
    if (result.startsWith("trimisă")) await notifyEditor("push-auto", { id, title: a.title, lead: `Notificare ${result}` });
    return `push automat (${a.id}): ${result}`;
  } catch (err) {
    return `push eșuat (${id}): ${err instanceof Error ? err.message : String(err)}`;
  }
}
