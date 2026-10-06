import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles } from "@/lib/pipeline/db/schema";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { describe, getTodayWeather } from "@/lib/weather";
import { getBnmRates } from "@/lib/bnm";
import { getSaintDay } from "@/lib/calendar-data";
import { churchDay, civilDays, formatDay, weekday, yearFeasts } from "@/lib/orthodox";
import { todayChisinau } from "@/components/orthodox-calendar";
import { dayPath, getHistoryDay, yearLabel } from "@/lib/history";

// Rezumatele din canalul Telegram (decizia proprietarului, 2026-10-05):
//  - 08:00 „Bună dimineața”: știrile publicate de la 22:00 încoace (noaptea
//    se colectează, prima rulare de la 06:00 le publică), vremea, cursul BNM,
//    calendarul;
//  - 22:00 „Totalurile zilei”: cele mai citite știri ale zilei.
// Fără AI: doar titlurile deja scrise.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NL = String.fromCharCode(10);
const day = (d: Date) => `${weekday(d).charAt(0).toUpperCase()}${weekday(d).slice(1)}, ${formatDay(d)}`;

type Row = { title: string; section: string; slug: string; locality: string | null; country: string | null };
const link = (a: Row) =>
  `• <a href="${absoluteUrl(articleUrl({ ...a, locality: a.locality ?? undefined, country: a.country ?? undefined } as never))}">${esc(a.title)}</a>`;

const cols = {
  title: articles.title,
  section: articles.section,
  slug: articles.slug,
  locality: articles.locality,
  country: articles.country,
};
const published = (since: Date) => and(eq(articles.status, "published"), eq(articles.archived, false), gte(articles.publishedAt, since));

export async function morningDigest(): Promise<string> {
  const today = todayChisinau();
  const since = new Date(Date.now() - 10 * 3600_000); // de la 22:00 aseară
  const [news, weather, bnm] = await Promise.all([
    getDb().select(cols).from(articles).where(published(since)).orderBy(desc(articles.qualityScore)).limit(6),
    getTodayWeather(),
    getBnmRates(),
  ]);
  const lines = [`☀️ <b>Bună dimineața! ${day(today)}</b>`];
  if (news.length) lines.push("", "🌙 <b>Ce s-a întâmplat peste noapte</b>", ...news.map(link));
  if (weather.length) {
    lines.push("", "🌤 <b>Vremea azi</b>");
    for (const w of weather) {
      const d = describe(w.symbol);
      lines.push(`${d.icon} ${w.city}: ${w.min}…${w.max}°C${d.text ? `, ${d.text}` : ""}`);
    }
  }
  const shown = ["EUR", "USD", "RON"].map((code) => bnm?.rates.find((r) => r.code === code)).filter((r) => r !== undefined);
  if (shown.length) {
    lines.push("", "💶 <b>Cursul BNM</b>");
    lines.push(shown.map((r) => `1 ${r.code} = ${(r.value / r.nominal).toFixed(4).replace(".", ",")} lei`).join(" · "));
  }
  const church = churchDay(today, "vechi");
  const saint = await getSaintDay(church.month, church.day);
  const feast = yearFeasts(today.getUTCFullYear(), "vechi").find((f) => f.date.getTime() === today.getTime());
  const civil = civilDays(today.getUTCFullYear()).find((f) => f.date.getTime() === today.getTime());
  const title = feast?.name ?? saint?.sarbatoare;
  if (title || civil || saint) {
    lines.push("", "✝️ <b>Calendar</b>");
    if (civil) lines.push(civil.guide ? `<a href="${SITE_URL}/ghiduri/${civil.guide}/">${esc(civil.name)}</a>` : esc(civil.name));
    if (title) lines.push(feast?.guide ? `<a href="${SITE_URL}/ghiduri/${feast.guide}/">${esc(title)}</a>` : esc(title));
    else if (saint) lines.push(esc(saint.sfinti.slice(0, 2).join("; ")));
  }
  const month = today.getUTCMonth() + 1;
  const history = await getHistoryDay(month, today.getUTCDate());
  if (history.length) {
    const picked = [...history.filter((e) => e.moldova), ...history.filter((e) => !e.moldova)].slice(0, 3).sort((a, b) => a.an - b.an);
    lines.push("", "📜 <b>Azi în istorie</b>", ...picked.map((e) => `<b>${yearLabel(e.an)}</b> – ${esc(e.text)}`));
    lines.push(`<a href="${SITE_URL}${dayPath(month, today.getUTCDate())}">Mai mult despre această zi</a>`);
  }
  lines.push("", `👉 <a href="${SITE_URL}/">Toate știrile, pe stiriactuale.info</a>`);
  return lines.join(NL);
}

// null = nimic publicat azi (rezumatul nu pleacă)
export async function eveningDigest(): Promise<string | null> {
  const today = todayChisinau();
  // miezul nopții la Chișinău, exprimat în UTC
  const now = new Date();
  const offset = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Chisinau" })).getTime() - new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const start = new Date(today.getTime() - offset);
  const top = await getDb()
    .select(cols)
    .from(articles)
    .where(published(start))
    .orderBy(desc(articles.views), desc(articles.qualityScore))
    .limit(7);
  if (!top.length) return null;
  return [
    `🌙 <b>Totalurile zilei — ${day(today)}</b>`,
    "",
    "Cele mai citite știri de azi:",
    ...top.map(link),
    "",
    `👉 <a href="${SITE_URL}/">Toate știrile, pe stiriactuale.info</a>`,
  ].join(NL);
}
