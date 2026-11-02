// Raport, doar citire: pe unde pierde pipeline-ul știrile. Ce a văzut în fluxuri și n-a
// publicat, ce a salvat apoi editorul, ce a oprit regula „știre cu ghid” (db-move.yml,
// pas = raport-pierderi).
import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith(".pooler.supabase.com")) url.port = "6543";
const sql = postgres(url.toString(), { max: 1, prepare: false });
const SINCE = new Date(Date.now() - 21 * 86400_000);

const cands = await sql`
  select c.id, c.url, c.title, c.source_name, c.feed_id, c.manual, c.published_at,
    (select a.views from articles a where a.status = 'published' and jsonb_exists(a.source_urls, c.url) limit 1) as views,
    exists (select 1 from articles a where jsonb_exists(a.source_urls, c.url)) as published
  from candidates c where c.published_at >= ${SINCE}`;
const checks = await sql`select title, section, via, exempt, reason, mode, rejected, created_at from guide_checks where created_at >= ${SINCE} order by created_at desc`;
const runs = await sql`select started_at from pipeline_runs where started_at >= ${SINCE}`;
await sql.end();

const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const RAIOANE = "anenii noi|basarabeasca|briceni|cahul|cantemir|calarasi|causeni|cimislia|criuleni|donduseni|drochia|edinet|falesti|floresti|glodeni|hincesti|hancesti|ialoveni|leova|nisporeni|ocnita|orhei|rezina|riscani|rascani|singerei|sangerei|soldanesti|stefan voda|straseni|taraclia|telenesti|ungheni|soroca";
const LOCAL = new RegExp(`\\b(${RAIOANE})\\b`);
const BIG = /\b(chisinau|capitala|balti|gagauzia|comrat|ceadir|vulcanesti|transnistria|tiraspol|bender|tighina|ribnita)\b/;
const TRAGIC = /\b(mort|morti|moarta|decedat|deces|a murit|au murit|accident|lovit|tamponat|rasturnat|incendiu|flacari|ars|ranit|raniti|inecat|spanzurat|cadavru|tragedie|furt|furat|talhar|jaf|batut|omor|ucis|crima|cutit|viol|agresat|disparut)/;
const MONEY = /\b(benzina|motorina|carburant|scump|ieftin|pret|preturi|tarif|factur|pensi|salari|compensat|ajutor|indemniz|impozit|tva|gaz|curent)/;
const kind = (t) => {
  const n = norm(t);
  const place = LOCAL.test(n) && !BIG.test(n) ? "raion mic" : BIG.test(n) ? "oras mare/autonomii" : "fara loc in titlu";
  const subj = TRAGIC.test(n) ? "tragedie/infractiune" : MONEY.test(n) ? "bani/preturi" : "altceva";
  return { place, subj };
};
const isTrash = (t) => /horoscop|zodi|meteo|curs valutar|reteta/i.test(t);
const seen = cands.filter((c) => c.feed_id !== "manual" && !isTrash(c.title));

console.log(`Ultimele 21 de zile: ${cands.length} candidați, ${runs.length} rulări`);
console.log(`Din fluxuri: ${seen.length}; publicați: ${seen.filter((c) => c.published).length}`);

console.log("\n=== Din fluxuri, după loc și subiect: văzute / publicate automat / salvate de editor / rămase");
const cell = (l) => {
  const auto = l.filter((c) => c.published && !c.manual).length;
  const saved = l.filter((c) => c.manual).length;
  const left = l.filter((c) => !c.published && !c.manual).length;
  return `văzute=${String(l.length).padStart(5)} auto=${String(auto).padStart(4)} (${String(Math.round((100 * auto) / (l.length || 1))).padStart(2)}%) salvate=${String(saved).padStart(4)} rămase=${String(left).padStart(5)}`;
};
for (const p of ["raion mic", "oras mare/autonomii", "fara loc in titlu"]) {
  for (const s of ["tragedie/infractiune", "bani/preturi", "altceva"]) {
    const l = seen.filter((c) => kind(c.title).place === p && kind(c.title).subj === s);
    console.log(`${(p + " + " + s).padEnd(44)} ${cell(l)}`);
  }
}

console.log("\n=== Salvate de editor: pipeline-ul le văzuse în flux și nu le publicase");
const saved = seen.filter((c) => c.manual);
const v = saved.map((c) => c.views ?? 0).sort((a, b) => a - b);
console.log(`${saved.length} știri, mediana vizualizărilor ${v[Math.floor(v.length / 2)] ?? 0}, total ${v.reduce((s, x) => s + x, 0)}`);
for (const c of [...saved].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 15)) console.log(`${String(c.views ?? 0).padStart(5)} [${c.source_name.slice(0, 14)}] ${c.title.slice(0, 85)}`);

console.log("\n=== Regula cu ghid: verificări și respinse");
for (const s of ["regiuni", "national", "international", "diaspora"]) {
  const l = checks.filter((c) => c.section === s);
  console.log(`${s.padEnd(14)} verificate=${String(l.length).padStart(4)} respinse=${String(l.filter((c) => c.rejected).length).padStart(4)}`);
}
const rej = checks.filter((c) => c.rejected);
console.log(`Respinse pe subiect: ${JSON.stringify(rej.reduce((m, c) => ((m[kind(c.title).subj] = (m[kind(c.title).subj] ?? 0) + 1), m), {}))}`);
console.log(`Respinse din raion mic: ${rej.filter((c) => kind(c.title).place === "raion mic").length}`);
console.log("-- exemple respinse din raioane mici sau cu tragedii");
for (const c of rej.filter((x) => kind(x.title).place === "raion mic" || kind(x.title).subj === "tragedie/infractiune").slice(0, 20)) console.log(`  ${c.section.slice(0, 5)} ${c.title.slice(0, 95)}`);

console.log("\n=== Rămase nepublicate, raion mic + tragedie sau bani (ultimele 25)");
const left = seen.filter((c) => !c.published && !c.manual && kind(c.title).place === "raion mic" && kind(c.title).subj !== "altceva").sort((a, b) => b.published_at - a.published_at);
for (const c of left.slice(0, 25)) console.log(`  [${c.source_name.slice(0, 14)}] ${c.title.slice(0, 95)}`);
console.log("\n=== Rămase nepublicate, național cu bani/prețuri (ultimele 12)");
for (const c of seen.filter((x) => !x.published && !x.manual && kind(x.title).subj === "bani/preturi" && kind(x.title).place !== "raion mic").sort((a, b) => b.published_at - a.published_at).slice(0, 12)) console.log(`  [${c.source_name.slice(0, 14)}] ${c.title.slice(0, 95)}`);
