// Raport, doar citire: vizualizările articolelor după cine le-a adus pe site — linkurile
// editorului, articolele proprii (Util, analize), pipeline-ul automat (db-move.yml,
// pas = raport-vizualizari). Fără ultimele 24 de ore: articolele noi n-au apucat să fie citite.
import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith(".pooler.supabase.com")) url.port = "6543";
const sql = postgres(url.toString(), { max: 1, prepare: false });

const rows = await sql`
  select a.id, a.slug, a.title, a.kind, a.section, a.views, a.published_at, a.push_worthy, a.quality_score, a.topics,
    a.impact is not null as has_impact, a.video_url is not null as has_video, a.telegram_message_id is not null as on_telegram,
    a.facebook_post_id is not null as on_facebook, a.push_sent_at is not null as pushed, a.featured_until is not null as featured,
    exists (select 1 from candidates c where c.manual and jsonb_exists(a.source_urls, c.url)) as manual
  from articles a
  where a.status = 'published' and a.wp_id is null and a.archived = false
    and a.published_at >= '2026-10-05' and a.published_at < now() - interval '24 hours'
  order by a.published_at`;
const [{ candidates, manual_candidates, oldest }] = await sql`
  select count(*)::int as candidates, count(*) filter (where manual)::int as manual_candidates, min(published_at) as oldest from candidates`;
console.log(`candidați în bază: ${candidates}, manuali: ${manual_candidates}, cel mai vechi: ${oldest?.toISOString()}`);

const origin = (r) => (r.kind === "util" ? "Util" : r.kind === "analiza" ? "Analiză" : r.manual ? "Editor" : "Automat");
const pct = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor((a.length * p) / 100))] : 0);
function line(name, list, all) {
  const v = list.map((r) => r.views).sort((a, b) => a - b);
  const sum = v.reduce((s, x) => s + x, 0);
  const share = (f) => ((100 * list.filter(f).length) / (list.length || 1)).toFixed(0);
  console.log(
    `${name.padEnd(30)} n=${String(list.length).padStart(4)} viz=${String(sum).padStart(6)} (${((100 * sum) / (all || 1)).toFixed(0).padStart(2)}%) medie=${(sum / (list.length || 1)).toFixed(1).padStart(6)} mediana=${String(pct(v, 50)).padStart(4)} p90=${String(pct(v, 90)).padStart(5)} max=${String(v[v.length - 1] ?? 0).padStart(5)} >10:${share((r) => r.views > 10).padStart(3)}% >50:${share((r) => r.views > 50).padStart(3)}% <=3:${share((r) => r.views <= 3).padStart(3)}%`,
  );
}
function report(title, list) {
  const all = list.reduce((s, r) => s + r.views, 0);
  console.log(`\n=== ${title}: ${list.length} articole, ${all} vizualizări`);
  for (const o of ["Editor", "Util", "Analiză", "Automat"]) line(o, list.filter((r) => origin(r) === o), all);
  const auto = list.filter((r) => origin(r) === "Automat");
  console.log("-- Automat, pe bucăți");
  line("pe scurt", auto.filter((r) => r.kind === "pe-scurt"), all);
  line("știre normală", auto.filter((r) => r.kind !== "pe-scurt"), all);
  line("cu notificare push", auto.filter((r) => r.pushed), all);
  line("marcată importantă", auto.filter((r) => r.push_worthy), all);
  line("nemarcată", auto.filter((r) => !r.push_worthy), all);
  line("în canalul Telegram", auto.filter((r) => r.on_telegram), all);
  line("nu în canal", auto.filter((r) => !r.on_telegram), all);
  line("cu bloc de impact", auto.filter((r) => r.has_impact), all);
  line("fără bloc", auto.filter((r) => !r.has_impact), all);
  for (const s of ["national", "regiuni", "international", "diaspora"]) line(`rubrica ${s}`, auto.filter((r) => r.section === s), all);
  for (const t of ["accidente", "criminal", "coruptie", "alerta-112", "economic", "criza-energetica", "sanatate", "social", "cultura", "sport"]) line(`tema ${t}`, auto.filter((r) => r.topics.includes(t)), all);
  for (const [a, b] of [[0, 50], [50, 65], [65, 80], [80, 101]]) line(`scor ${a}-${b}`, auto.filter((r) => r.quality_score >= a && r.quality_score < b), all);
}
report("De la 5 octombrie", rows);
report("Ultimele 10 zile", rows.filter((r) => r.published_at >= new Date(Date.now() - 10 * 86400_000)));

const top = (list, n) => [...list].sort((a, b) => b.views - a.views).slice(0, n);
const recent = rows.filter((r) => r.published_at >= new Date(Date.now() - 10 * 86400_000));
console.log("\n=== TOP 25, ultimele 10 zile");
for (const r of top(recent, 25)) console.log(`${String(r.views).padStart(5)} ${origin(r).padEnd(8)} ${r.title.slice(0, 85)}`);
console.log("\n=== TOP 15 Automat, ultimele 10 zile");
for (const r of top(recent.filter((x) => origin(x) === "Automat"), 15)) console.log(`${String(r.views).padStart(5)} ${r.section.slice(0, 5)} ${r.title.slice(0, 85)}`);
console.log("\n=== TOP 10 Util, ultimele 10 zile");
for (const r of top(recent.filter((x) => origin(x) === "Util"), 10)) console.log(`${String(r.views).padStart(5)} ${r.title.slice(0, 85)}`);
console.log("\n=== pe zile, ultimele 10 (n / viz. Editor | Util | Automat)");
for (let d = 10; d >= 1; d--) {
  const from = new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10);
  const day = rows.filter((r) => r.published_at.toISOString().slice(0, 10) === from);
  const c = (o) => {
    const l = day.filter((r) => origin(r) === o);
    return `${l.length}/${l.reduce((s, r) => s + r.views, 0)}`;
  };
  console.log(`${from}  ${c("Editor").padEnd(10)} ${c("Util").padEnd(10)} ${c("Automat")}`);
}
await sql.end();
