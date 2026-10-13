import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles, candidates, pipelineRuns } from "@/lib/pipeline/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { SECTION_LABELS } from "@/lib/content/geo";
import { addLink, logoutAction, sendPushNow, setGuideRule, togglePipeline } from "./actions";
import { guideRuleMode, pipelineEnabled } from "@/lib/pipeline/settings";
import { loadMissingGuidesReport } from "@/lib/admin/guide-report";
import { pushAudience } from "@/lib/push";
import { receives } from "@/lib/push-segment";
import { ConfirmButton } from "./confirm-button";
import { PhotoField } from "./photo-field";

const LINK_MESSAGES: Record<string, string> = {
  ok: "Adăugat. Se scrie la următoarea rulare a pipeline-ului (max. 2 ore) sau imediat, cu „Publică acum” — și când știrile automate sunt oprite.",
  invalid: "Link invalid.",
  unreadable: "Pagina nu a putut fi citită — încearcă linkul sursei originale.",
  videotitle: "Titlul nu a putut fi citit automat (video Facebook sau postare fără text) — scrie-l în câmpul „Titlu”.",
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
    locality: articles.locality,
    country: articles.country,
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
  const [published, pending, runs, autoOn, audience, guideMode, guideReport] = await Promise.all([
    db.select(cols).from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt)).limit(30),
    db
      .select({ id: candidates.id, title: candidates.title, url: candidates.url })
      .from(candidates)
      .where(and(eq(candidates.manual, true), isNull(candidates.processedAt))),
    db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(9),
    pipelineEnabled(),
    pushAudience(),
    guideRuleMode(),
    loadMissingGuidesReport(),
  ]);
  // câți ar primi push-ul fiecărei știri (segmentare: src/lib/push-segment.ts)
  const reach = (r: (typeof published)[number]) => audience.filter((s) => receives(s, r)).length;
  const bySegment = (scope: string) => audience.filter((s) => s.scope === scope).length;

  const list = (rows: typeof published, dateOf: (r: (typeof published)[number]) => Date) => (
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
          {/* alerta push: automat pentru urgențe/legi (auto-push.ts) sau manual cu clopoțelul de la fiecare știre */}
          {r.status === "published" &&
            (r.pushSentAt ? (
              <span className="w-10 text-center text-xs text-teal" title="notificare trimisă">🔔✓</span>
            ) : (
              <form
                action={sendPushNow.bind(null, r.id)}
                className="w-10 text-center"
                title={r.push ? "Trimite notificarea (AI o propune)" : "Trimite notificarea"}
              >
                <ConfirmButton message={`Trimiți notificarea la ${reach(r)} abonați (segmentul știrii)? „${r.title}”`} className={r.push ? "" : "opacity-40 hover:opacity-100"}>
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

      <section
        className={`flex flex-wrap items-center gap-3 rounded border px-4 py-3 ${autoOn ? "border-teal bg-white" : "border-alert bg-white"}`}
      >
        <span className="font-medium text-ink">Știri automate:</span>
        <span className={`font-mono text-sm ${autoOn ? "text-teal" : "text-alert"}`}>
          {autoOn ? "● PORNIT — colectare din oră în oră, publicare 06–23, max 30/zi" : "● OPRIT — nu se colectează și nu se scrie nimic automat"}
        </span>
        <form action={togglePipeline.bind(null, !autoOn)} className="ml-auto">
          <button className={`rounded px-4 py-2 font-medium text-white ${autoOn ? "bg-alert" : "bg-teal"}`}>
            {autoOn ? "Oprește" : "Pornește"}
          </button>
        </form>
        <p className="basis-full text-xs text-sub">
          Oprit: linkurile tale se scriu în continuare cu „Adaugă și publică acum” / „Publică acum”. La pornire se iau știrile
          din ultimele 6 ore.
        </p>
      </section>

      <section
        className={`flex flex-wrap items-center gap-3 rounded border px-4 py-3 ${guideMode === "strict" ? "border-alert bg-white" : "border-line bg-white"}`}
      >
        <span className="font-medium text-ink">Regula „știre cu ghid”:</span>
        <span className={`font-mono text-sm ${guideMode === "strict" ? "text-alert" : "text-teal"}`}>
          {guideMode === "strict"
            ? "● STRICT — știrile fără ghid (și fără urgență/lege majoră) nu se publică"
            : "● RAPORT — se publică tot, se notează ce s-ar fi respins"}
        </span>
        <form action={setGuideRule.bind(null, guideMode === "strict" ? "raport" : "strict")} className="ml-auto">
          <button className={`rounded px-4 py-2 font-medium text-white ${guideMode === "strict" ? "bg-teal" : "bg-alert"}`}>
            {guideMode === "strict" ? "Treci pe raport" : "Treci pe strict"}
          </button>
        </form>
        <p className="basis-full text-xs text-sub">
          Filtru în plus, după toate regulile de selecție. Linkurile tale nu trec prin el; urgențele, vremea periculoasă și legile
          majore se publică și fără ghid.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-medium text-ink">Adaugă știre după link</h2>
        <form action={addLink} className="flex flex-wrap gap-2">
          <input
            name="url"
            type="url"
            required
            placeholder="https://… (sursa originală; sau video YouTube / Facebook / postare Telegram t.me/canal/123)"
            className="flex-1 rounded border border-line bg-white px-3 py-2 text-ink"
          />
          <input
            name="title"
            placeholder="Titlu (opțional; necesar la video Facebook)"
            className="w-64 rounded border border-line bg-white px-3 py-2 text-ink"
          />
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
              name="photo_alt"
              placeholder="Ce se vede în poză (opțional; apare sub poză)"
              className="w-80 rounded border border-line px-2 py-1 text-ink"
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
          {/* în același formular: dacă în câmp e un link, îl adaugă și pe el
              (înainte era un formular separat și linkul din câmp se pierdea) */}
          <div className="flex basis-full flex-wrap items-center gap-3">
            <button name="now" value="1" formNoValidate className="rounded bg-ink px-4 py-2 font-medium text-white">
              Publică acum
            </button>
            <span className="text-sm text-sub">
              scrie imediat toate linkurile în așteptare{pending.length > 0 && ` (${pending.length})`} — și pe cel din câmp, dacă e
              completat — fără să aștepte rularea programată
            </span>
          </div>
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
        <h2 className="mb-2 font-medium text-ink">Publicate recent</h2>
        <p className="mb-2 font-mono text-xs text-sub">
          Abonați push: {audience.length} — toată țara {bySegment("all")} · pe raioane {bySegment("raion")} · pe țări{" "}
          {bySegment("tara")}
        </p>
        {list(published, (r) => r.publishedAt)}
      </section>

      <section>
        <h2 className="mb-2 font-medium text-ink">Ghiduri care lipsesc (ultimele 7 zile)</h2>
        <table className="mb-3 w-full rounded border border-line bg-white text-sm">
          <thead className="text-left font-mono text-xs text-sub">
            <tr>
              <th className="px-3 py-2">Ziua</th>
              <th className="px-3 py-2">Publicate (pipeline)</th>
              <th className="px-3 py-2">Verificate</th>
              <th className="px-3 py-2">Fără ghid</th>
              <th className="px-3 py-2">Respinse (strict)</th>
            </tr>
          </thead>
          <tbody>
            {guideReport.days.map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-xs">{d.day}</td>
                <td className="px-3 py-2">{d.published}</td>
                <td className="px-3 py-2">{d.checked}</td>
                <td className="px-3 py-2">{d.withoutGuide}</td>
                <td className="px-3 py-2">{d.rejected}</td>
              </tr>
            ))}
            {guideReport.days.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-2 text-sub">Nicio verificare încă.</td>
              </tr>
            )}
          </tbody>
        </table>
        <ul className="divide-y divide-line rounded border border-line bg-white text-sm">
          {guideReport.topics.map((tp) => (
            <li key={tp.topic} className="px-3 py-2">
              <span className="font-medium text-ink">{tp.topic}</span>{" "}
              <span className="font-mono text-xs text-sub">— {tp.count} {tp.count === 1 ? "știre" : "știri"}</span>
              <span className="block text-xs text-sub">{tp.examples.join(" · ")}</span>
            </li>
          ))}
          {guideReport.topics.length === 0 && <li className="px-3 py-2 text-sub">Nicio temă lipsă.</li>}
        </ul>
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
