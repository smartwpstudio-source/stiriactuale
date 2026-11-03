// Raportul săptămânal pentru editor, pe Telegram (weekly-report.yml): strângem cititori fideli
// sau nu? Abonați, clickuri din știri spre unelte, vizualizări pe public și pe raioane.
// Doar citire. Fără ultimele 24 de ore la vizualizări: articolele noi n-au apucat să fie citite.
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles, pushSubscriptions } from "../../src/lib/pipeline/db/schema";
import { channelMembers, reportToEditor } from "../../src/lib/telegram";
import { COUNTRY_NAMES, RAION_NAMES } from "../../src/lib/content/geo";

const DAY = 86400_000;
const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

(async () => {
  const db = getDb();
  const now = Date.now();
  const [subs, members] = await Promise.all([db.select().from(pushSubscriptions), channelMembers()]);
  const rows = await db
    .select({
      kind: articles.kind,
      audience: articles.audience,
      section: articles.section,
      locality: articles.locality,
      views: articles.views,
      ruViews: articles.ruViews,
      clicks: articles.impactClicks,
      hasImpact: articles.impact,
      at: articles.publishedAt,
    })
    .from(articles)
    .where(and(eq(articles.status, "published"), isNull(articles.wpId), gte(articles.publishedAt, new Date(now - 30 * DAY)), lt(articles.publishedAt, new Date(now - DAY))));
  const week = rows.filter((r) => r.at.getTime() >= now - 8 * DAY);

  const top = (o: Record<string, number>, names: Record<string, string>, n: number) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `${names[k] ?? k} ${v}`)
      .join(", ");
  const count = (l: (string | null)[]) => l.reduce<Record<string, number>>((m, k) => (k ? { ...m, [k]: (m[k] ?? 0) + 1 } : m), {});

  const lines = ["📊 Raportul săptămânii: cititori fideli", ""];
  lines.push("ABONAȚI");
  lines.push(`Canal Telegram: ${members ?? "necunoscut"}`);
  lines.push(`Notificări: ${subs.length} (noi în 7 zile: ${subs.filter((s) => s.createdAt.getTime() >= now - 7 * DAY).length})`);
  lines.push(`Pe raion: ${subs.filter((s) => s.scope === "raion").length}${subs.some((s) => s.raion) ? ` (${top(count(subs.map((s) => s.raion)), RAION_NAMES, 5)})` : ""}`);
  lines.push(`Diaspora: ${subs.filter((s) => s.scope === "tara").length}${subs.some((s) => s.country) ? ` (${top(count(subs.map((s) => s.country)), COUNTRY_NAMES, 5)})` : ""}`);

  lines.push("", "ARTICOLE, ULTIMELE 7 ZILE (articole / vizualizări / mediană / RU)");
  const group = (name: string, l: typeof rows) => l.length && lines.push(`${name}: ${l.length} / ${sum(l.map((r) => r.views))} / ${median(l.map((r) => r.views))} / ${sum(l.map((r) => r.ruViews))}`);
  group("Util", week.filter((r) => r.kind === "util"));
  group("Grupuri", week.filter((r) => r.kind !== "util" && r.audience === "grupuri"));
  group("Local", week.filter((r) => r.kind !== "util" && r.audience === "local"));
  group("Pagină", week.filter((r) => r.kind !== "util" && r.audience === "pagina"));
  group("Adăugate de tine sau mai vechi, fără public", week.filter((r) => r.kind !== "util" && !r.audience));

  const blocks = week.filter((r) => r.hasImpact);
  lines.push("", "DIN ȘTIRI SPRE UNELTE, 7 ZILE");
  lines.push(`Articole cu bloc „Ce înseamnă pentru tine”: ${blocks.length}, clickuri: ${sum(blocks.map((r) => r.clicks))}, vizualizări: ${sum(blocks.map((r) => r.views))}`);

  const places: Record<string, number[]> = {};
  for (const r of rows) if (r.section === "regiuni" && r.locality) (places[r.locality] ??= []).push(r.views);
  const ranked = Object.entries(places)
    .filter(([, v]) => v.length >= 3)
    .sort((a, b) => sum(b[1]) - sum(a[1]))
    .slice(0, 10);
  lines.push("", "RAIOANE, 30 DE ZILE (vizualizări / articole / mediană)");
  for (const [k, v] of ranked) lines.push(`${RAION_NAMES[k] ?? k}: ${sum(v)} / ${v.length} / ${median(v)}`);

  const text = lines.join(String.fromCharCode(10));
  console.log(text);
  await reportToEditor(text);
  process.exit(0);
})();
