import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles, candidates, pipelineRuns } from "@/lib/pipeline/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { SECTION_LABELS } from "@/lib/content/geo";
import { addLink, logoutAction, runPipelineNow, sendPushNow } from "./actions";
import { ConfirmButton } from "./confirm-button";
import { PhotoField } from "./photo-field";

const LINK_MESSAGES: Record<string, string> = {
  ok: "Adăugat. Se scrie la următoarea rulare a pipeline-ului (max. 2 ore).",
  invalid: "Link invalid.",
  unreadable: "Pagina nu a putut fi citită — încearcă linkul sursei originale.",
  videotitle: "Video Facebook: scrie titlul știrii în câmpul „Titlu” (Facebook nu permite citirea lui automată).",
  post: "Postarea nu e recunoscută — doar o postare Facebook (posts/photos) sau Telegram (t.me/canal/123).",
};

const RUN_MESSAGES: Record<string, string> = {
  ok: "Publicarea a pornit. Articolele apar în 5–15 minute; primești notificare pe Telegram pentru fiecare.",
  fail: "Nu s-a putut porni publicarea (GitHub). Încearcă din nou peste un minut.",
};

const time = (d: Date) =>
  d.toLocaleString("ro-MD", { timeZone: "Europe/Chisinau", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { link, run } = await searchParams;
  const db = getDb();

  const cols = {
    id: articles.id,
    title: articles.title,
    section: articles.section,
    score: articles.qualityScore,
    image: articles.imageUrl,
    video: articles.videoUrl,
    push: articles.pushWorthy,
    pushSentAt: articles.pushSentAt,
    status: articles.status,
    views: articles.views,
    createdAt: articles.createdAt,
    publishedAt: articles.publishedAt,
  };
  const [drafts, published, pending, runs] = await Promise.all([
    db.select(cols).from(articles).where(eq(articles.status, "draft")).orderBy(desc(articles.createdAt)),
    db.select(cols).from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt)).limit(30),
    db
      .select({ id: candidates.id, title: candidates.title, url: candidates.url })
      .from(candidates)
      .where(and(eq(candidates.manual, true), isNull(candidates.processedAt))),
    db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(9),
  ]);

  const list = (rows: typeof drafts, dateOf: (r: (typeof drafts)[number]) => Date) => (
    <ul className="divide-y divide-line rounded border border-line bg-white">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center">
          <Link href={`/admin/articol/${r.id}/`} className="flex flex-1 items-center gap-3 px-3 py-2 hover:bg-paper">
            <span className="w-20 shrink-0 font-mono text-xs text-sub">{time(dateOf(r))}</span>
            <span className="w-24 shrink-0 font-mono text-xs text-teal">{SECTION_LABELS[r.section]}</span>
            <span className="flex-1 text-ink">{r.title}</span>
            {r.video && <span title="are video din sursă">▶</span>}
            {!r.image && !r.video && <span className="font-mono text-xs text-alert">fără foto</span>}
            <span className="w-16 text-right font-mono text-xs text-sub" title="afișări pe site">{r.views} viz.</span>
            <span className="font-mono text-xs text-sub" title="scor pipeline">{Math.round(r.score)}</span>
          </Link>
          {/* notificarea push se trimite doar manual: clopoțel la fiecare știre publicată */}
          {r.status === "published" &&
            (r.pushSentAt ? (
              <span className="w-10 text-center text-xs text-teal" title="notificare trimisă">🔔✓</span>
            ) : (
              <form
                action={sendPushNow.bind(null, r.id)}
                className="w-10 text-center"
                title={r.push ? "Trimite notificarea (AI o propune)" : "Trimite notificarea"}
              >
                <ConfirmButton message={`Trimiți notificarea tuturor abonaților? „${r.title}”`} className={r.push ? "" : "opacity-40 hover:opacity-100"}>
                  🔔
                </ConfirmButton>
              </form>
            ))}
        </li>
      ))}
      {rows.length === 0 && <li className="px-3 py-2 text-sm text-sub">Nimic.</li>}
    </ul>
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Admin</h1>
        <form action={logoutAction}>
          <button className="text-sm text-sub underline">Ieșire</button>
        </form>
      </header>

      <section>
        <h2 className="mb-2 font-medium text-ink">Adaugă știre după link</h2>
        <form action={addLink} className="flex flex-wrap gap-2">
          <input
            name="url"
            type="url"
            required
            placeholder="https://… (linkul sursei originale, nu al agregatorului)"
            className="flex-1 rounded border border-line bg-white px-3 py-2 text-ink"
          />
          <input
            name="title"
            placeholder="Titlu (opțional; necesar la video Facebook)"
            className="w-64 rounded border border-line bg-white px-3 py-2 text-ink"
          />
          <fieldset className="flex basis-full items-center gap-4 text-sm text-ink">
            <span className="text-sub">Tip:</span>
            <label className="flex items-center gap-1">
              <input type="radio" name="kind" value="stire" defaultChecked /> Știre
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="kind" value="analiza" /> Analiză (1.200–2.000 de cuvinte, cu „Ce înseamnă pentru
              Moldova” — lipește în câmpul de mai jos încă 2–3 linkuri de surse sau text)
            </label>
          </fieldset>
          <textarea
            name="extra"
            rows={3}
            placeholder="Transcriptul video-ului (YouTube: ⋯ sub video → Afișează transcrierea → copiază) sau alt text al sursei — opțional; din el AI-ul scrie articolul complet"
            className="basis-full rounded border border-line bg-white px-3 py-2 text-sm text-ink"
          />
          {/* poza și postarea intră în articol de la publicare — nu după, când e deja în cache */}
          <fieldset className="flex basis-full flex-wrap items-center gap-3 rounded border border-line bg-white px-3 py-2 text-sm">
            <span className="text-sub">Poză (opțional):</span>
            <PhotoField />
            <input
              name="credit"
              placeholder="Foto: autorul (ex. IGSU); gol = foto ilustrativă"
              className="w-72 rounded border border-line px-2 py-1 text-ink"
            />
            <input
              name="post"
              placeholder="Postare cu poze: https://www.facebook.com/…/posts/… sau https://t.me/canal/123"
              className="min-w-72 flex-1 rounded border border-line px-2 py-1 text-ink"
            />
          </fieldset>
          <button className="rounded border border-ink px-4 py-2 text-ink">Adaugă</button>
          <button name="now" value="1" className="rounded bg-alert px-4 py-2 font-medium text-white">
            Adaugă și publică acum
          </button>
        </form>
        <form action={runPipelineNow} className="mt-3 flex flex-wrap items-center gap-3">
          <button className="rounded bg-ink px-4 py-2 font-medium text-white">Publică acum</button>
          <span className="text-sm text-sub">
            scrie imediat toate linkurile în așteptare{pending.length > 0 && ` (${pending.length})`}, fără să aștepte rularea programată
          </span>
        </form>
        {typeof run === "string" && RUN_MESSAGES[run] && (
          <p className={`mt-2 text-sm ${run === "ok" ? "text-teal" : "text-alert"}`}>{RUN_MESSAGES[run]}</p>
        )}
        {typeof link === "string" && LINK_MESSAGES[link] && (
          <p className={`mt-2 text-sm ${link === "ok" ? "text-teal" : "text-alert"}`}>{LINK_MESSAGES[link]}</p>
        )}
        {pending.length > 0 && (
          <ul className="mt-2 text-sm text-sub">
            {pending.map((p) => (
              <li key={p.id}>
                În așteptare: <a href={p.url} target="_blank" rel="noopener" className="underline">{p.title}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-medium text-ink">Drafturi ({drafts.length})</h2>
        {list(drafts, (r) => r.createdAt)}
      </section>

      <section>
        <h2 className="mb-2 font-medium text-ink">Publicate recent</h2>
        {list(published, (r) => r.publishedAt)}
      </section>

      <section>
        <h2 className="mb-2 font-medium text-ink">Ultimele rulări</h2>
        <table className="w-full rounded border border-line bg-white text-sm">
          <thead className="text-left font-mono text-xs text-sub">
            <tr>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">Colectate</th>
              <th className="px-3 py-2">Clasificate</th>
              <th className="px-3 py-2">Articole</th>
              <th className="px-3 py-2">Consum*</th>
              <th className="px-3 py-2">Notă</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-xs">{time(r.startedAt)}</td>
                <td className="px-3 py-2">{r.candidatesFetched}</td>
                <td className="px-3 py-2">{r.candidatesClassified}</td>
                <td className="px-3 py-2">{r.articlesPublished}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.costUsd.toFixed(2)}</td>
                <td className="px-3 py-2 text-xs text-alert">{r.errorMessage}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-xs text-sub">
          * Echivalent la prețuri API, doar ca măsură — se consumă din limitele abonamentului Claude, nu se facturează.
        </p>
      </section>
    </div>
  );
}
