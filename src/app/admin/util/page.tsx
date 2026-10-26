import Link from "next/link";
import { asc, gte } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { utilPlan } from "@/lib/pipeline/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { UTIL_TYPES, utilHours } from "@/lib/pipeline/util-plan";
import { resolveTools } from "@/lib/impact";
import { todayChisinau } from "@/lib/schedule";
import { addDays, weekday } from "@/lib/orthodox";
import { addUtilTopic, approveDay, planNow, setUtilStatus, writeNow } from "./actions";

const MESSAGES: Record<string, string> = {
  plan: "Planul se face acum (3–6 minute). Reîncarcă pagina după aceea.",
  write: "Articolul se scrie acum (5–10 minute); primești notificare pe Telegram.",
  fail: "Nu s-a putut porni rularea (GitHub). Încearcă din nou peste un minut.",
};
const STATUS: Record<string, string> = {
  propus: "text-sub",
  aprobat: "text-teal",
  publicat: "text-teal font-bold",
  respins: "text-sub line-through",
  esuat: "text-alert",
};

export default async function UtilAdminPage({ searchParams }: PageProps<"/admin/util">) {
  await requireAdmin();
  const { run, err } = await searchParams;
  const today = todayChisinau();
  const from = today.toISOString().slice(0, 10);
  const rows = await getDb().select().from(utilPlan).where(gte(utilPlan.day, from)).orderBy(asc(utilPlan.day), asc(utilPlan.id));
  const tools = await resolveTools([...new Set(rows.flatMap((r) => r.tools))]);
  const toolTitle = (id: string) => tools.find((t) => t.id === id)?.title ?? id;
  const days = [...new Set([...Array.from({ length: 7 }, (_, i) => addDays(today, i).toISOString().slice(0, 10)), ...rows.map((r) => r.day)])].sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin/" className="text-sm text-teal">← Admin</Link>
      <h1 className="mt-2 font-serif text-3xl text-ink">Planul Util</h1>
      <p className="mt-2 text-sub">
        Articolele proprii ale zilei, scrise la orele {utilHours().map((h) => `${h}:00`).join(", ")} (azi). Se scriu doar temele
        <strong> aprobate</strong>. Planul săptămânii următoare (luni–duminică) vine vineri dimineața; îl aprobi până duminică seara. Sau cu butonul de mai jos.
      </p>
      {run && <p className="mt-3 rounded bg-teal/10 p-3 text-ink">{MESSAGES[String(run)]}</p>}
      {err && (
        <p className="mt-3 rounded bg-alert/10 p-3 text-alert">
          {err === "2" ? "N-am găsit niciun ghid sau calculator potrivit temei — scrie uneltele (ex. calc:cost-incalzire)." : "Completează ziua și tema."}
        </p>
      )}
      <form action={planNow} className="mt-4">
        <button className="rounded bg-ink px-4 py-2 text-white">Fă acum planul săptămânii următoare</button>
      </form>

      {days.map((day) => {
        const items = rows.filter((r) => r.day === day);
        const d = new Date(`${day}T00:00:00Z`);
        return (
          <section key={day} className="mt-8">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl text-ink">
                {weekday(d)}, {day}
              </h2>
              {items.some((i) => i.status === "propus") && (
                <form action={approveDay.bind(null, day)}>
                  <button className="rounded border border-teal px-2 py-0.5 text-sm text-teal">Aprobă toată ziua</button>
                </form>
              )}
            </div>
            {items.length === 0 && <p className="mt-2 text-sub">Nicio temă.</p>}
            <ul className="mt-2 divide-y divide-line rounded border border-line bg-white">
              {items.map((i) => (
                <li key={i.id} className="space-y-1 px-3 py-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-xs text-sub">{UTIL_TYPES[i.type as keyof typeof UTIL_TYPES] ?? i.type}</span>
                    <span className={`font-mono text-xs ${STATUS[i.status] ?? ""}`}>{i.status}</span>
                    <span className="flex-1 font-semibold text-ink">{i.topic}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-sub">{i.angle}</p>
                  <p className="text-xs text-teal">{i.tools.map(toolTitle).join(" · ")}{i.locality ? ` · ${i.locality}` : ""}</p>
                  {i.note && <p className="text-xs text-alert">{i.note}</p>}
                  {i.articleId && (
                    <Link href={`/admin/articol/${i.articleId}/`} className="text-sm text-teal underline">Articolul publicat</Link>
                  )}
                  {i.status !== "publicat" && (
                    <div className="flex gap-2 pt-1">
                      {i.status !== "aprobat" && (
                        <form action={setUtilStatus.bind(null, i.id, "aprobat")}><button className="rounded bg-teal px-2 py-0.5 text-sm text-white">Aprobă</button></form>
                      )}
                      {i.status !== "respins" && (
                        <form action={setUtilStatus.bind(null, i.id, "respins")}><button className="rounded border border-line px-2 py-0.5 text-sm text-sub">Respinge</button></form>
                      )}
                      <form action={writeNow.bind(null, i.id)}><button className="rounded border border-ink px-2 py-0.5 text-sm text-ink">Scrie acum</button></form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-10 rounded border border-line bg-white p-4">
        <h2 className="font-serif text-xl text-ink">Adaugă o temă</h2>
        <form action={addUtilTopic} className="mt-3 grid gap-2">
          <div className="flex flex-wrap gap-2">
            <input name="day" type="date" defaultValue={from} className="rounded border border-line px-2 py-1" />
            <select name="type" className="rounded border border-line px-2 py-1">
              {Object.entries(UTIL_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input name="locality" placeholder="raion (opțional, ex. chisinau)" className="rounded border border-line px-2 py-1" />
          </div>
          <input name="topic" placeholder="Tema / titlul de lucru" className="rounded border border-line px-2 py-1" />
          <textarea name="angle" rows={3} placeholder="Ce acoperă articolul (opțional)" className="rounded border border-line px-2 py-1" />
          <input name="tools" placeholder="Unelte (opțional — fără ele le alege site-ul după temă): ghid:slug, calc:slug" className="rounded border border-line px-2 py-1 font-mono text-sm" />
          <button className="w-fit rounded bg-ink px-4 py-2 text-white">Adaugă (aprobată; cea de azi se scrie imediat)</button>
        </form>
      </section>
    </div>
  );
}
