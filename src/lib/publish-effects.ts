import { and, eq, gte, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { notifyEditor, postToChannel } from "@/lib/telegram";
import { postToPage } from "@/lib/facebook";
import { pushBlockedReason, sendPush } from "@/lib/push";
import { resolveTools } from "@/lib/impact";
import { countryLabel } from "@/lib/content/geo";
import { submitIndexNow } from "@/lib/indexnow";

const TOOL_LINE = { calc: "🧮 Calculează", ghid: "📘 Ghid", model: "📝 Model de reclamație" };

// Canalul Telegram (2026-10-20): 30-40 de postări pe zi făceau abonații să-l pună pe
// „fără sunet”. Acum: publicate de editor, alertele (pushWorthy), articolele proprii
// (Util, analize) și cel mult 2 știri automate la 2 ore (o rulare a pipeline-ului;
// acolo se publică în ordinea scorului, deci intră cele mai importante); fără
// știrile „pe scurt” și cele internaționale. Restul ajung în rezumatele zilei.
const CHANNEL_PER_RUN = 2;
async function goesToChannel(a: typeof articles.$inferSelect, how: "manual" | "auto"): Promise<boolean> {
  if (how === "manual" || a.pushWorthy || a.kind === "util" || a.kind === "analiza") return true;
  if (a.kind === "pe-scurt" || a.section === "international") return false;
  const recent = await getDb()
    .select({ id: articles.id })
    .from(articles)
    .where(and(isNotNull(articles.telegramMessageId), gte(articles.publishedAt, new Date(Date.now() - 110 * 60_000))));
  return recent.length < CHANNEL_PER_RUN;
}

// Tot ce se întâmplă când un articol devine public — același lucru indiferent
// dacă l-a publicat editorul din /admin sau pipeline-ul automat:
//  - mesaj privat către editor ("Publicat" / "Publicat automat");
//  - postare în canalul Telegram și pe pagina de Facebook (o singură dată per articol);
// Notificarea push NU pleacă de aici: manual din /admin sau automat din
// pipeline, după regulile din src/lib/pipeline/auto-push.ts.
export async function announcePublished(id: number, how: "manual" | "auto"): Promise<void> {
  const db = getDb();
  const [a] = await db.select().from(articles).where(eq(articles.id, id));
  if (!a || a.status !== "published") return;
  const path = articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined });

  await notifyEditor(how === "auto" ? "publicat-auto" : "publicat", { id, title: a.title, lead: a.leadText });
  await submitIndexNow([path]);
  if (!a.telegramMessageId && (await goesToChannel(a, how))) {
    // continuarea unei știri deja postate: marcată, să nu pară aceeași știre de două ori
    const title = a.continuesId ? `🔄 Continuare: ${a.title}` : a.title;
    // unealta din blocul de impact, direct în postare: omul ajunge la calculator fără ocol
    const [tool] = await resolveTools(a.impact?.unelte ?? []);
    const toolLine = tool && `${TOOL_LINE[tool.kind]}: <a href="${absoluteUrl(tool.href)}">${tool.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>`;
    // diaspora: #Italia, #RegatulUnit — în Telegram se caută după hashtag
    const tag = a.section === "diaspora" && a.country ? `#${countryLabel(a.country).normalize("NFD").replace(/[^A-Za-z]/g, "")}` : "";
    const telegramMessageId = await postToChannel({
      title,
      lead: a.leadText,
      url: absoluteUrl(path),
      tool: [toolLine, tag].filter(Boolean).join("\n") || undefined,
      image: a.imageUrl ?? undefined,
      silent: !a.pushWorthy,
    });
    if (telegramMessageId) await db.update(articles).set({ telegramMessageId }).where(eq(articles.id, id));
  }
  if (!a.facebookPostId) {
    const facebookPostId = await postToPage({ title: a.title, lead: a.leadText, url: absoluteUrl(path) });
    if (facebookPostId) await db.update(articles).set({ facebookPostId }).where(eq(articles.id, id));
  }
}

export async function pushNow(id: number): Promise<string> {
  const blocked = await pushBlockedReason();
  if (blocked) return `netrimisă: ${blocked}`;
  const [a] = await getDb().select().from(articles).where(eq(articles.id, id));
  const url = articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined });
  const r = await sendPush(id, a, { title: a.title, body: a.leadText.slice(0, 180), url, image: a.imageUrl ?? undefined });
  if (!r.total) return "netrimisă: niciun abonat în segmentul știrii";
  return `trimisă la ${r.delivered} din ${r.total} abonați`;
}
