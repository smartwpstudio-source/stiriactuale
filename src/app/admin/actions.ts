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
import { deleteFromChannel } from "@/lib/telegram";
import { announcePublished, pushNow } from "@/lib/publish-effects";
import type { Section } from "@/lib/content/types";

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

  await getDb()
    .update(articles)
    .set({
      title: String(formData.get("title")).trim(),
      leadText: String(formData.get("lead")).trim(),
      bodyHtml: sanitizeBody(String(formData.get("body"))),
      metaDescription: String(formData.get("meta")).trim().slice(0, 200),
      imageAltText: String(formData.get("alt") ?? "").trim() || null,
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
  await db
    .update(articles)
    // publishedAt = momentul publicării, nu al generării — altfel un draft
    // aprobat după 5 ore apare îngropat în listă
    .set(status === "published" ? { status, publishedAt: new Date() } : { status, telegramMessageId: null })
    .where(eq(articles.id, id));
  refreshSite();

  const push = status === "published" ? await announcePublished(id, "manual") : "";
  redirect(`/admin/articol/${id}/${push ? `?push=${encodeURIComponent(push)}` : ""}`);
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

export async function togglePush(id: number, value: boolean) {
  await requireAdmin();
  await getDb().update(articles).set({ pushWorthy: value }).where(eq(articles.id, id));
  redirect(`/admin/articol/${id}/`);
}

export async function sendPushNow(id: number) {
  await requireAdmin();
  const [a] = await getDb().select().from(articles).where(eq(articles.id, id));
  if (!a || a.status !== "published" || a.pushSentAt) redirect(`/admin/articol/${id}/`);
  redirect(`/admin/articol/${id}/?push=${encodeURIComponent(await pushNow(id))}`);
}

export async function deleteArticle(id: number) {
  await requireAdmin();
  const [a] = await getDb().delete(articles).where(eq(articles.id, id)).returning({ tg: articles.telegramMessageId });
  if (a?.tg) await deleteFromChannel(a.tg);
  refreshSite();
  redirect("/admin/");
}

export async function replaceImage(id: number, resourceId: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, id));
  if (!row) redirect("/admin/");
  const url = await stockToBlob(resourceId, row.slug);
  await db.update(articles).set({ imageUrl: url, imageResourceId: resourceId }).where(eq(articles.id, id));
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
  const prefix = formData.get("ai") ? AI_IMAGE_PREFIX : "articole/";
  const blob = await put(`${prefix}${row.slug}.jpg`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });
  await db.update(articles).set({ imageUrl: blob.url, imageResourceId: null }).where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/`);
}

export async function removeImage(id: number) {
  await requireAdmin();
  await getDb().update(articles).set({ imageUrl: null, imageResourceId: null }).where(eq(articles.id, id));
  refreshSite();
  redirect(`/admin/articol/${id}/`);
}

// Butonul "Publică acum": rularea pornește în ~1 minut, nu la următoarea
// rulare programată. Scrie linkurile adăugate și, ziua, știrile noi din fluxuri.
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
  let url: URL;
  try {
    url = new URL(String(formData.get("url")).trim());
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    redirect("/admin/?link=invalid");
  }

  // textul integral se descarcă din nou la scriere (generate.ts); aici doar
  // titlul și un rezumat pentru clasificare
  const page = await fetchArticle(url.toString());
  const title = page?.title ?? "";
  const summary = [page?.description, page?.text].filter(Boolean).join("\n").slice(0, 2000);
  if (!title) redirect("/admin/?link=unreadable");

  await getDb()
    .insert(candidates)
    .values({
      url: url.toString(),
      title,
      summary,
      sourceName: url.hostname.replace(/^www\./, ""),
      feedId: "manual",
      publishedAt: new Date(),
      manual: true,
    })
    .onConflictDoUpdate({ target: candidates.url, set: { manual: true, processedAt: null } });
  if (formData.get("now")) {
    const { ok } = await dispatchPipeline();
    redirect(ok ? "/admin/?run=ok" : "/admin/?run=fail");
  }
  redirect("/admin/?link=ok");
}
