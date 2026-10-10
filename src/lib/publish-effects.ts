import { eq } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { notifyEditor, postToChannel } from "@/lib/telegram";
import { postToPage } from "@/lib/facebook";
import { pushBlockedReason, sendPush } from "@/lib/push";
import { resolveTools } from "@/lib/impact";
import { countryLabel } from "@/lib/content/geo";

const TOOL_LINE = { calc: "🧮 Calculează", ghid: "📘 Ghid", model: "📝 Model de reclamație" };

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
  if (!a.telegramMessageId) {
    // continuarea unei știri deja postate: marcată, să nu pară aceeași știre de două ori
    const title = a.continuesId ? `🔄 Continuare: ${a.title}` : a.title;
    // unealta din blocul de impact, direct în postare: omul ajunge la calculator fără ocol
    const [tool] = await resolveTools(a.impact?.unelte ?? []);
    const toolLine = tool && `${TOOL_LINE[tool.kind]}: <a href="${absoluteUrl(tool.href)}">${tool.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>`;
    // diaspora: #Italia, #RegatulUnit — în Telegram se caută după hashtag
    const tag = a.section === "diaspora" && a.country ? `#${countryLabel(a.country).normalize("NFD").replace(/[^A-Za-z]/g, "")}` : "";
    const telegramMessageId = await postToChannel({ title, lead: a.leadText, url: absoluteUrl(path), tool: [toolLine, tag].filter(Boolean).join("\n") || undefined });
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
