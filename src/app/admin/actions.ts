"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/pipeline/db/client";
import { articles, candidates } from "@/lib/pipeline/db/schema";
import { put } from "@vercel/blob";
import { AI_IMAGE_PREFIX, stockToBlob } from "@/lib/pipeline/image";
import { sanitizeBody } from "@/lib/content/sanitize";
import { fetchArticle } from "@/lib/pipeline/fulltext";
import { COUNTRY_NAMES, RAION_NAMES } from "@/lib/content/geo";
import { logIn, logOut, requireAdmin } from "@/lib/admin/auth";
import { dispatchPipeline } from "@/lib/pipeline-dispatch";
import { setPipelineEnabled } from "@/lib/pipeline/settings";
import { deleteFromChannel } from "@/lib/telegram";
import { deleteFromPage, lastFacebookError, postToPage } from "@/lib/facebook";
import { articleUrl } from "@/lib/content/url";
import { toEmbedUrl, toPostEmbedUrl } from "@/lib/video";
import { readVideoSource } from "@/lib/video-source";
import { absoluteUrl } from "@/lib/seo";
import { announcePublished, pushNow } from "@/lib/publish-effects";
import type { Section } from "@/lib/content/types";
import { IMPACT_TYPES, resolveTools, type Impact, type ImpactType } from "@/lib/impact";

// Fiecare action verifică sesiunea — sunt endpoint-uri POST publice.

export async function loginAction(formData: FormData) {
  const ok = await logIn(String(formData.get("password") ?? ""));
  redirect(ok ? "/admin/" : "/admin/login/?e=1");
}

export async function logoutAction() {
  await logOut();
  redirect("/admin/login/");
}

// Paginile publice au ISR (60-300s); la orice schimbare se regenerează tot —
// volumul (zeci de articole/zi) face asta ieftin.
function refreshSite() {
  revalidatePath("/", "layout");
}

export async function saveArticle(id: number, formData: FormData) {
  await requireAdmin();
  const section = String(formData.get("section")) as Section;
  const locality = String(formData.get("locality") ?? "");
  const country = String(formData.get("country") ?? "");
  if (section === "regiuni" && !(locality in RAION_NAMES)) redirect(`/admin/articol/${id}/?e=raion`);
  if (section === "diaspora" && !(country in COUNTRY_NAMES)) redirect(`/admin/articol/${id}/?e=tara`);
  const videoLink = String(formData.get("video") ?? "").trim();
  const videoUrl = videoLink ? toEmbedUrl(videoLink) : null;
  if (videoLink && !videoUrl) redirect(`/admin/articol/${id}/?e=video`);
  const postLink = String(formData.get("post") ?? "").trim();
  const postUrl = postLink ? toPostEmbedUrl(postLink) : null;
  if (postLink && !postUrl) redirect(`/admin/articol/${id}/?e=post`);

  const title = String(formData.get("title")).trim();
  const leadText = String(formData.get("lead")).trim();
  const bodyHtml = sanitizeBody(String(formData.get("body")));
  const [old] = await getDb().select({ title: articles.title, leadText: articles.leadText, bodyHtml: articles.bodyHtml }).from(articles).where(eq(articles.id, id));
  // textul s-a schimbat: varianta rusă dispare și se retraduce la rularea următoare
  const ruReset = old && (old.title !== title || old.leadText !== leadText || old.bodyHtml !== bodyHtml) ? { ru: null, ruUpdatedAt: null } : {};

  await getDb()
    .update(articles)
    .set({
      title,
      leadText,
      bodyHtml,
      ...ruReset,
      metaDescription: String(formData.get("meta")).trim().slice(0, 200),
      imageAltText: String(formData.get("alt") ?? "").trim() || null,
      videoUrl,
      postUrl,
      section,
      locality: section === "regiuni" ? locality : null,
      country: section === "diaspora" ? country : null,
    })
    .where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/?ok=1`);
}

export async function setStatus(id: number, status: "draft" | "published") {
  await requireAdmin();
  const db = getDb();
  const [a] = await db.select().from(articles).where(eq(articles.id, id));
  if (!a) redirect("/admin/");

  if (status === "draft" && a.telegramMessageId) await deleteFromChannel(a.telegramMessageId);
  if (status === "draft" && a.facebookPostId) await deleteFromPage(a.facebookPostId);
  await db
    .update(articles)
    // publishedAt = momentul publicării, nu al generării — altfel un draft
    // aprobat după 5 ore apare îngropat în listă
    .set(status === "published" ? { status, publishedAt: new Date() } : { status, telegramMessageId: null, facebookPostId: null })
    .where(eq(articles.id, id));
  refreshSite();

  if (status === "published") await announcePublished(id, "manual");
  redirect(`/admin/articol/${id}/`);
}

// Fixează articolul în prim-planul primei pagini 6 ore (sau îl scoate).
export async function setFeatured(id: number, on: boolean) {
  await requireAdmin();
  await getDb()
    .update(articles)
    .set({ featuredUntil: on ? new Date(Date.now() + 6 * 3600_000) : null })
    .where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/`);
}

export async function sendPushNow(id: number) {
  await requireAdmin();
  const [a] = await getDb().select().from(articles).where(eq(articles.id, id));
  if (!a || a.status !== "published" || a.pushSentAt) redirect(`/admin/articol/${id}/`);
  redirect(`/admin/articol/${id}/?push=${encodeURIComponent(await pushNow(id))}`);
}

// Pentru articolele care n-au ajuns pe Facebook (eroare, sau publicate
// înainte de conectarea paginii). O singură postare per articol.
export async function postToFacebookNow(id: number) {
  await requireAdmin();
  const db = getDb();
  const [a] = await db.select().from(articles).where(eq(articles.id, id));
  if (!a || a.status !== "published" || a.facebookPostId) redirect(`/admin/articol/${id}/`);
  const path = articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined });
  const facebookPostId = await postToPage({ title: a.title, lead: a.leadText, url: absoluteUrl(path) });
  if (facebookPostId) await db.update(articles).set({ facebookPostId }).where(eq(articles.id, id));
  redirect(`/admin/articol/${id}/${facebookPostId ? "" : `?e=facebook&fb=${encodeURIComponent(lastFacebookError)}`}`);
}

export async function deleteArticle(id: number) {
  await requireAdmin();
  const [a] = await getDb().delete(articles).where(eq(articles.id, id)).returning({ tg: articles.telegramMessageId, fb: articles.facebookPostId });
  if (a?.tg) await deleteFromChannel(a.tg);
  if (a?.fb) await deleteFromPage(a.fb);
  refreshSite();
  redirect("/admin/");
}

export async function replaceImage(id: number, resourceId: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, id));
  if (!row) redirect("/admin/");
  const url = await stockToBlob(resourceId, row.slug);
  await db.update(articles).set({ imageUrl: url, imageResourceId: resourceId, imageCredit: null, imageAltText: null }).where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/`);
}

export async function uploadImage(id: number, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) redirect(`/admin/articol/${id}/`);
  const db = getDb();
  const [row] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, id));
  if (!row) redirect("/admin/");
  const credit = String(formData.get("credit") ?? "").trim().slice(0, 80) || null;
  const prefix = formData.get("ai") && !credit ? AI_IMAGE_PREFIX : "articole/";
  const blob = await put(`${prefix}${row.slug}.jpg`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200) || null;
  await db.update(articles).set({ imageUrl: blob.url, imageResourceId: null, imageCredit: credit, imageAltText: alt }).where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/`);
}

export async function removeImage(id: number) {
  await requireAdmin();
  await getDb().update(articles).set({ imageUrl: null, imageResourceId: null, imageCredit: null, imageAltText: null }).where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/`);
}

// Butonul "Publică acum": rularea pornește în ~1 minut, nu la următoarea
// rulare programată. Scrie linkurile adăugate și, ziua, știrile noi din fluxuri.
// Pornit/Oprit: colectarea și știrile automate (linkurile editorului merg oricum)
export async function togglePipeline(on: boolean) {
  await requireAdmin();
  await setPipelineEnabled(on);
  redirect("/admin/");
}

export async function runPipelineNow() {
  await requireAdmin();
  const { ok } = await dispatchPipeline();
  redirect(ok ? "/admin/?run=ok" : "/admin/?run=fail");
}

// "Adaugă știre după link" (ex. găsită pe yam.md): se citește pagina sursei
// originale și intră în candidates cu manual=true — următoarea rulare a
// pipeline-ului o scrie obligatoriu, în afara plafonului zilnic. Butonul
// "Adaugă și publică acum" pornește și rularea.
export async function addLink(formData: FormData) {
  await requireAdmin();
  // „Publică acum” cu câmpul gol: doar rularea, pentru linkurile deja adăugate
  if (!String(formData.get("url") ?? "").trim() && formData.get("now")) return runPipelineNow();
  let url: URL;
  try {
    url = new URL(String(formData.get("url")).trim());
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    redirect("/admin/?link=invalid");
  }
  // poza și postarea atașate acum intră în articol de la publicare
  const postLink = String(formData.get("post") ?? "").trim();
  const postUrl = postLink ? toPostEmbedUrl(postLink) : null;
  if (postLink && !postUrl) redirect("/admin/?link=post");
  const photo = formData.get("photo");
  const imageUrl =
    photo instanceof File && photo.size > 0 && photo.type.startsWith("image/")
      ? (await put(`articole/manual-${Date.now()}.jpg`, photo, { access: "public", contentType: photo.type, addRandomSuffix: true })).url
      : null;
  const imageCredit = String(formData.get("credit") ?? "").trim().slice(0, 80) || null;
  const imageAlt = String(formData.get("photo_alt") ?? "").trim().slice(0, 200) || null;
  const attached = { postUrl, ...(imageUrl && { imageUrl, imageCredit, imageAlt }) };

  // link video (YouTube/Facebook): titlul, canalul și descrierea video-ului;
  // la Facebook titlul îl scrie editorul (câmpul opțional din formular)
  const video = await readVideoSource(url.toString());
  const manualTitle = String(formData.get("title") ?? "").trim();
  // transcriptul video-ului sau alt text al sursei, lipit de editor: materialul
  // din care AI-ul scrie articolul complet (descrierea singură e de obicei scurtă)
  // fără marcajele de timp ale transcriptului YouTube (rânduri „0:00”, „12:34”)
  const extra = String(formData.get("extra") ?? "")
    .split("\n")
    .filter((l) => !/^\s*\d{1,2}:\d{2}(:\d{2})?\s*$/.test(l))
    .join("\n")
    .trim()
    .slice(0, 12000);
  // linkuri lipite în câmpul mare (ex. pentru o analiză): se citesc și ele
  // (max 3), iar textul lor intră în materialul articolului
  const extraLinks = [...new Set(extra.match(/https?:\/\/[^\s<>"]+/g) ?? [])].slice(0, 3);
  const extraTexts = (await Promise.all(extraLinks.map((u) => fetchArticle(u))))
    .filter((p) => p?.text)
    .map((p) => `${p!.title}\n${p!.text}`);
  let title: string;
  let summary: string;
  let sourceUrl = url.toString();
  let sourceName = url.hostname.replace(/^www\./, "");
  if (video) {
    title = manualTitle || video.title;
    summary = [video.description, extra, ...extraTexts].filter(Boolean).join("\n\n").slice(0, 20000);
    sourceName = video.channel;
    if (!title) redirect("/admin/?link=videotitle");
    // postare Telegram fără video (text + poze): știre obișnuită, nu video —
    // adresa t.me/s/canal/N nu e recunoscută ca player (video.ts)
    if (!video.hasVideo)
      sourceUrl = video.embed.replace("https://t.me/", "https://t.me/s/").replace("?embed=1", video.hasPhoto ? "?foto=1" : "");
  } else {
    // textul integral se descarcă din nou la scriere (generate.ts); aici doar
    // titlul și un rezumat pentru clasificare
    const page = await fetchArticle(url.toString());
    title = manualTitle || (page?.title ?? "");
    summary = [page?.description, page?.text, extra, ...extraTexts].filter(Boolean).join("\n").slice(0, 20000);
    // Unele site-uri (Cloudflare) blochează serverul Vercel, dar nu și GitHub,
    // de unde scrie pipeline-ul: linkul se salvează oricum, cu un titlu
    // provizoriu din adresă; textul se citește din nou la scriere.
    if (!title) title = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "").replace(/[.]html?$/, "").replace(/[-_]+/g, " ").trim();
    if (!title) redirect("/admin/?link=unreadable");
  }

  await getDb()
    .insert(candidates)
    .values({
      url: sourceUrl,
      title,
      summary,
      sourceName,
      feedId: "manual",
      publishedAt: new Date(),
      manual: true,
      kind: "stire",
      ...attached,
    })
    .onConflictDoUpdate({
      target: candidates.url,
      set: { manual: true, processedAt: null, kind: "stire", ...attached },
    });
  if (formData.get("now")) {
    const { ok } = await dispatchPipeline();
    redirect(ok ? "/admin/?run=ok" : "/admin/?run=fail");
  }
  redirect("/admin/?link=ok");
}

// Blocul „Ce înseamnă pentru tine”: tip gol = fără bloc. Uneltele: id-uri
// („calc:salariu-net”, „ghid:<slug>”, „model:<slug>”), câte unul pe rând.
export async function saveImpact(id: number, formData: FormData) {
  await requireAdmin();
  const field = (k: string) => String(formData.get(k) ?? "").trim();
  const lines = (k: string) => field(k).split("\n").map((x) => x.trim()).filter(Boolean);
  const tip = field("tip") as ImpactType;
  const impact: Impact | null =
    tip in IMPACT_TYPES && field("cine") && field("ce") && lines("pasi").length
      ? {
          tip,
          cine: field("cine"),
          ce: field("ce"),
          cand: field("cand") || undefined,
          pasi: lines("pasi").slice(0, 3),
          unelte: (await resolveTools(lines("unelte"))).map((t) => t.id).slice(0, 2),
          pana: /^\d{4}-\d{2}-\d{2}$/.test(field("pana")) && (tip === "alerta" || tip === "urgent") ? field("pana") : undefined,
          verificat: new Date().toISOString(),
          editat: true,
        }
      : null;
  // blocul tradus ar rămâne vechi: varianta rusă se reface la rularea următoare
  await getDb().update(articles).set({ impact, ru: null, ruUpdatedAt: null }).where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/?ok=1`);
}
