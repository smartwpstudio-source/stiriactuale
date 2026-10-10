import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { searchStock } from "@/lib/pipeline/image";
import { COUNTRY_NAMES, RAION_NAMES, SECTION_LABELS } from "@/lib/content/geo";
import { articleUrl } from "@/lib/content/url";
import { sanitizeBody } from "@/lib/content/sanitize";
import type { Section } from "@/lib/content/types";
import {
  deleteArticle,
  removeImage,
  replaceImage,
  saveArticle,
  saveImpact,
  postToFacebookNow,
  sendPushNow,
  setFeatured,
  setStatus,
  uploadImage,
} from "../../actions";
import { ConfirmButton } from "../../confirm-button";
import { UploadImage } from "../../upload-image";
import { IMPACT_TYPES } from "@/lib/impact";
import { pushAudience } from "@/lib/push";
import { receives } from "@/lib/push-segment";

const input = "w-full rounded border border-line bg-white px-3 py-2 text-ink";
const label = "mb-1 block text-sm text-sub";
const ERRORS: Record<string, string> = {
  raion: "Alege raionul.",
  tara: "Alege țara.",
  video: "Linkul video nu e recunoscut — doar YouTube sau un video Facebook.",
  post: "Postarea nu e recunoscută — doar o postare Facebook (posts/photos) sau Telegram (t.me/canal/123).",
  facebook: "Postarea pe Facebook a eșuat — verifică FACEBOOK_PAGE_ID / FACEBOOK_PAGE_TOKEN în Vercel.",
};

export default async function EditArticlePage({ params, searchParams }: PageProps<"/admin/articol/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const { q, ok, e, push, fb } = await searchParams;
  const [a] = Number.isInteger(id) ? await getDb().select().from(articles).where(eq(articles.id, id)) : [];
  if (!a) notFound();

  const query = typeof q === "string" ? q.trim() : "";
  const results = query ? await searchStock(query, 12).catch(() => []) : [];
  const url = articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined });
  const isDraft = a.status === "draft";
  // cine ar primi push-ul: toți (știre națională) sau doar segmentul raionului / țării
  const reach = !isDraft && !a.pushSentAt ? (await pushAudience()).filter((s) => receives(s, a)).length : 0;
  const segment =
    a.section === "regiuni" && a.locality
      ? `raionul ${RAION_NAMES[a.locality] ?? a.locality}`
      : a.section === "diaspora" && a.country
        ? `diaspora ${COUNTRY_NAMES[a.country] ?? a.country}`
        : "toată țara";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/admin/" className="text-sm text-sub underline">
          ← Înapoi
        </Link>
        <span className={`rounded px-2 py-1 font-mono text-xs text-white ${isDraft ? "bg-sub" : "bg-teal"}`}>
          {isDraft ? "DRAFT" : "PUBLICAT"}
        </span>
        {!isDraft && (
          <a href={url} target="_blank" rel="noopener" className="text-sm text-teal underline">
            Vezi pe site
          </a>
        )}
        <div className="ml-auto flex gap-2">
          <form action={setStatus.bind(null, id, isDraft ? "published" : "draft")}>
            <button className={`rounded px-4 py-2 text-white ${isDraft ? "bg-teal" : "bg-sub"}`}>
              {isDraft ? "Publică" : "Retrage"}
            </button>
          </form>
          <form action={deleteArticle.bind(null, id)}>
            <ConfirmButton message="Ștergi definitiv articolul?" className="rounded bg-alert px-4 py-2 text-white">
              Șterge
            </ConfirmButton>
          </form>
        </div>
      </header>
      {ok && <p className="text-sm text-teal">Salvat.</p>}
      {typeof push === "string" && (
        <p className={`text-sm ${push.startsWith("trimisă") ? "text-teal" : "text-alert"}`}>Notificare push {push}.</p>
      )}

      {!isDraft && (
        <section className="flex flex-wrap items-center gap-3 rounded border border-line bg-white px-4 py-3 text-sm">
          <span className="font-medium text-ink">⭐ Prim-plan pe prima pagină:</span>
          {a.featuredUntil && a.featuredUntil > new Date() ? (
            <>
              <span className="text-teal">
                fixat până la{" "}
                {a.featuredUntil.toLocaleTimeString("ro-MD", { timeZone: "Europe/Chisinau", hour: "2-digit", minute: "2-digit" })}
              </span>
              <form action={setFeatured.bind(null, id, false)}>
                <button className="rounded border border-line px-2 py-1 text-xs text-ink">Scoate din prim-plan</button>
              </form>
            </>
          ) : (
            <form action={setFeatured.bind(null, id, true)}>
              <button className="rounded bg-amber-ink px-2 py-1 text-xs text-white">Fixează în prim-plan (6 ore)</button>
            </form>
          )}
        </section>
      )}

      <section className="flex flex-wrap items-center gap-3 rounded border border-line bg-white px-4 py-3 text-sm">
        <span className="font-medium text-ink">🔔 Notificare push:</span>
        {a.pushSentAt ? (
          <span className="text-teal">
            trimisă {a.pushSentAt.toLocaleString("ro-MD", { timeZone: "Europe/Chisinau", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
          </span>
        ) : (
          <>
            <span className={a.pushWorthy ? "text-teal" : "text-sub"}>
              {a.pushWorthy ? "netrimisă — AI o propune" : "netrimisă"}
            </span>
            {!isDraft && !a.facebookPostId && (
              <form action={postToFacebookNow.bind(null, id)}>
                <button className="rounded bg-[#1877f2] px-2 py-1 text-xs text-white">Postează pe Facebook</button>
              </form>
            )}
            {!isDraft && (
              <span className="font-mono text-xs text-sub">
                ar primi: {reach} abonați ({segment})
              </span>
            )}
            {!isDraft && (
              <form action={sendPushNow.bind(null, id)}>
                <button className="rounded bg-teal px-2 py-1 text-xs text-white">Trimite alerta acum</button>
              </form>
            )}
          </>
        )}
      </section>
      {typeof e === "string" && ERRORS[e] && (
        <p className="text-sm text-alert">
          {ERRORS[e]}
          {typeof fb === "string" && fb && <span className="block font-mono text-xs">Facebook: {fb}</span>}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <form action={saveArticle.bind(null, id)} className="flex flex-col gap-4">
          <div>
            <label className={label} htmlFor="title">Titlu</label>
            <input id="title" name="title" defaultValue={a.title} required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="lead">Lead</label>
            <textarea id="lead" name="lead" defaultValue={a.leadText} rows={3} required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="body">Corp (HTML)</label>
            <textarea id="body" name="body" defaultValue={a.bodyHtml} rows={16} required className={`${input} font-mono text-xs`} />
          </div>
          <div>
            <label className={label} htmlFor="meta">Meta description</label>
            <textarea id="meta" name="meta" defaultValue={a.metaDescription} rows={2} maxLength={200} className={input} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={label} htmlFor="section">Secțiune</label>
              <select id="section" name="section" defaultValue={a.section} className={input}>
                {(Object.keys(SECTION_LABELS) as Section[]).map((s) => (
                  <option key={s} value={s}>{SECTION_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="locality">Raion</label>
              <select id="locality" name="locality" defaultValue={a.locality ?? ""} className={input}>
                <option value="">—</option>
                {Object.entries(RAION_NAMES).map(([slug, name]) => (
                  <option key={slug} value={slug}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="country">Țară</label>
              <select id="country" name="country" defaultValue={a.country ?? ""} className={input}>
                <option value="">—</option>
                {Object.entries(COUNTRY_NAMES).map(([slug, name]) => (
                  <option key={slug} value={slug}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label} htmlFor="alt">Descrierea pozei (opțional; apare sub poză și ca text alternativ — gol = titlul)</label>
            <input id="alt" name="alt" defaultValue={a.imageAltText ?? ""} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="video">Link video (YouTube sau Facebook) — apare sub lead; gol = fără video</label>
            <input
              id="video"
              name="video"
              defaultValue={a.videoUrl ? decodeURIComponent(a.videoUrl.match(/href=([^&]+)/)?.[1] ?? "") || a.videoUrl.replace("youtube-nocookie.com/embed/", "youtube.com/watch?v=") : ""}
              placeholder="https://www.youtube.com/watch?v=… sau https://www.facebook.com/…/videos/…"
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="post">
              Postare cu poze de la fața locului (Facebook sau Telegram al unei instituții) — apare în articol; gol = fără
            </label>
            <input
              id="post"
              name="post"
              defaultValue={a.postUrl ? decodeURIComponent(a.postUrl.match(/href=([^&]+)/)?.[1] ?? "") || a.postUrl.replace("?embed=1", "") : ""}
              placeholder="https://www.facebook.com/…/posts/… sau https://t.me/canal/123"
              className={input}
            />
          </div>
          <button className="self-start rounded bg-ink px-4 py-2 text-white">Salvează</button>
          {a.slug !== url && <p className="font-mono text-xs text-sub">{url}</p>}
          {a.sources.length > 0 && (
            <p className="text-sm text-sub">
              Surse:{" "}
              {a.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ", "}
                  <a href={s.url} target="_blank" rel="noopener" className="underline">{s.name}</a>
                </span>
              ))}
            </p>
          )}
        </form>

        <div className="flex flex-col gap-4">
          <form action={saveImpact.bind(null, id)} className="flex flex-col gap-2 rounded border border-teal/40 bg-white p-4">
            <h2 className="font-medium text-ink">
              „Ce înseamnă pentru tine”
              {a.impact && <span className="ml-2 font-mono text-xs text-sub">{a.impactClicks} click-uri spre unelte</span>}
            </h2>
            <p className="text-xs text-sub">
              Doar la știrile cu consecință reală (bani, reguli, alerte). Tip gol = fără bloc. Cifrele — exact ca în sursă.
            </p>
            <select name="tip" defaultValue={a.impact?.tip ?? ""} className={input}>
              <option value="">— fără bloc —</option>
              {Object.entries(IMPACT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input name="cine" defaultValue={a.impact?.cine ?? ""} placeholder="Cine e afectat" className={input} />
            <textarea name="ce" defaultValue={a.impact?.ce ?? ""} rows={2} placeholder="Ce se schimbă" className={input} />
            <input name="cand" defaultValue={a.impact?.cand ?? ""} placeholder="De când (opțional)" className={input} />
            <label className="text-xs text-sub">
              Alertă / urgent valabilă până la (gol = 3 zile de la publicare):
              <input type="date" name="pana" defaultValue={a.impact?.pana ?? ""} className={`${input} mt-1`} />
            </label>
            <textarea name="pasi" defaultValue={a.impact?.pasi.join("\n") ?? ""} rows={3} placeholder="Ce faci acum — un pas pe rând (max 3)" className={input} />
            <textarea
              name="unelte"
              defaultValue={a.impact?.unelte.join("\n") ?? ""}
              rows={2}
              placeholder="Unelte, una pe rând: calc:salariu-net, ghid:<slug>, model:<slug>"
              className={`${input} font-mono text-xs`}
            />
            <button className="self-start rounded bg-teal px-4 py-2 text-sm text-white">Salvează blocul</button>
          </form>
          <section>
            <h2 className="mb-2 font-medium text-ink">Imagine</h2>
            {a.imageUrl ? (
              <div className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- previzualizare admin */}
                <img src={a.imageUrl} alt={a.imageAltText ?? ""} className="w-full rounded" />
                {a.imageCredit && <p className="font-mono text-xs text-sub">Foto: {a.imageCredit}</p>}
                <form action={removeImage.bind(null, id)}>
                  <button className="text-sm text-alert underline">Scoate imaginea</button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-alert">Fără imagine.</p>
            )}
            <form className="mt-3 flex gap-2">
              <input name="q" defaultValue={query} placeholder="Caută pe Magnific (în engleză)" className={input} />
              <button className="rounded border border-line px-3 py-2 text-ink">Caută</button>
            </form>
            {results.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {results.map((r) => (
                  <form key={r.id} action={replaceImage.bind(null, id, r.id)}>
                    <button className="block w-full" title="Folosește această imagine">
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniatură Magnific */}
                      <img src={r.preview} alt="" className="aspect-video w-full rounded object-cover hover:opacity-80" />
                    </button>
                  </form>
                ))}
              </div>
            )}
            {query && results.length === 0 && <p className="mt-2 text-sm text-sub">Niciun rezultat.</p>}
            <div className="mt-4">
              <UploadImage action={uploadImage.bind(null, id)} />
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-ink">Previzualizare</h2>
            <article className="rounded border border-line bg-white p-4">
              <h1 className="font-serif text-2xl text-ink">{a.title}</h1>
              <p className="mt-3 text-lg text-ink">{a.leadText}</p>
              <div className="prose-article mt-3 text-ink" dangerouslySetInnerHTML={{ __html: sanitizeBody(a.bodyHtml) }} />
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
