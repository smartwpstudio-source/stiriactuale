import { eq } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { notifyEditor, postToChannel } from "@/lib/telegram";
import { postToPage } from "@/lib/facebook";
import { pushBlockedReason, sendPush } from "@/lib/push";

// Tot ce se întâmplă când un articol devine public — același lucru indiferent
// dacă l-a publicat editorul din /admin sau pipeline-ul automat:
//  - mesaj privat către editor ("Publicat" / "Publicat automat");
//  - postare în canalul Telegram și pe pagina de Facebook (o singură dată per articol);
//  - notificare push, dacă e marcat și nu e blocat de plafon / ore de liniște.
// Întoarce rezultatul push-ului ca text (afișat în /admin), sau "" dacă n-a fost cazul.
export async function announcePublished(id: number, how: "manual" | "auto"): Promise<string> {
  const db = getDb();
  const [a] = await db.select().from(articles).where(eq(articles.id, id));
  if (!a || a.status !== "published") return "";
  const path = articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined });

  await notifyEditor(how === "auto" ? "publicat-auto" : "publicat", { id, title: a.title, lead: a.leadText });
  if (!a.telegramMessageId) {
    const telegramMessageId = await postToChannel({ title: a.title, lead: a.leadText, url: absoluteUrl(path) });
    if (telegramMessageId) await db.update(articles).set({ telegramMessageId }).where(eq(articles.id, id));
  }
  if (!a.facebookPostId) {
    const facebookPostId = await postToPage({ title: a.title, lead: a.leadText, url: absoluteUrl(path) });
    if (facebookPostId) await db.update(articles).set({ facebookPostId }).where(eq(articles.id, id));
  }
  return a.pushWorthy && !a.pushSentAt ? pushNow(id) : "";
}

export async function pushNow(id: number): Promise<string> {
  const blocked = await pushBlockedReason();
  if (blocked) return `netrimisă: ${blocked}`;
  const [a] = await getDb().select().from(articles).where(eq(articles.id, id));
  const url = articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined });
  const r = await sendPush(id, { title: a.title, body: a.leadText.slice(0, 180), url, image: a.imageUrl ?? undefined });
  return `trimisă la ${r.delivered} din ${r.total} abonați`;
}
