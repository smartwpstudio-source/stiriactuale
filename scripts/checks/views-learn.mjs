// Raport, doar citire: ce trăsături ale unei știri merg împreună cu vizualizările și un
// test pe date vechi: un scor învățat din prima perioadă, verificat pe perioada următoare,
// față de scorul de acum (db-move.yml, pas = raport-invatare).
import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith(".pooler.supabase.com")) url.port = "6543";
const sql = postgres(url.toString(), { max: 1, prepare: false });

const rows = await sql`
  select a.id, a.title, a.lead_text, a.kind, a.section, a.locality, a.views, a.published_at, a.quality_score, a.topics, a.source_count,
    a.image_url, a.image_credit, a.video_url is not null as has_video, a.impact is not null as has_impact,
    exists (select 1 from candidates c where c.manual and jsonb_exists(a.source_urls, c.url)) as manual,
    (select min(c.published_at) from candidates c where jsonb_exists(a.source_urls, c.url)) as first_seen
  from articles a
  where a.status = 'published' and a.wp_id is null and a.archived = false
    and a.published_at >= '2026-10-05' and a.published_at < now() - interval '48 hours'
  order by a.published_at`;
await sql.end();

const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const CLASSES = {
  tragedie: /\b(mort|morti|moarta|decedat|deces|a murit|au murit|accident|lovit|tamponat|rasturnat|incendiu|flacari|ars|ranit|raniti|inecat|spanzurat|cadavru|tragedie)/,
  crima_furt: /\b(furt|furat|hot|talhar|jaf|batai|batut|omor|ucis|crima|cutit|viol|agresat|droguri|escroc|retinut|arestat|condamnat)/,
  carburanti_preturi: /\b(benzina|motorina|carburant|scump|ieftin|pret|preturi|tarif|factur|inflatie)/,
  bani_social: /\b(pensi|salari|compensat|ajutor|indemniz|impozit|tax|tva|amend|credit|alocat|somaj|cnas|cnam)/,
  energie: /\b(gaz|curent|energie|caldur|incalzire|termoelectrica|deconect)/,
  politica: /\b(parlament|deput|premier|tofan|sandu|presedint|ministr|guvern|pas\b|partid|alegeri|candidat|vot|cec\b|primar|ceban|dodon|bascan)/,
  cultura: /\b(cultur|festival|concert|teatru|muzeu|film|carte|artist|cantar|traditi|hram|sarbatoare|comemor)/,
  razboi: /\b(drona|razboi|ucrain|rusi|atac|bombard|armata|nato)/,
};
const classesOf = (r) => {
  const t = norm(`${r.title} ${r.lead_text}`);
  const c = Object.keys(CLASSES).filter((k) => CLASSES[k].test(t));
  return c.length ? c : ["altele"];
};
const SPECIAL = { chisinau: "Chișinău", balti: "Bălți", gagauzia: "Găgăuzia", "ceadir-lunga": "Găgăuzia", transnistria: "Transnistria", rabnita: "Transnistria" };
const place = (r) => {
  if (r.section !== "regiuni") return r.section;
  return SPECIAL[r.locality] ?? "alte raioane";
};
const origin = (r) => (r.kind === "util" ? "Util" : r.kind === "analiza" ? "Analiză" : r.manual ? "Editor" : "Automat");
const imageKind = (r) => {
  const u = r.image_url ?? "";
  if (r.has_video && !u) return "captură video";
  if (!u) return "fără poză";
  if (/-card[-.]|\/simbol\//.test(u)) return "card / simbol";
  if (/\/articole\/ai-/.test(u)) return "generată AI";
  if (r.image_credit && !/simbol/i.test(r.image_credit)) return "poză reală (cu sursă)";
  return "stoc / ilustrativă";
};
const lagOf = (r) => {
  if (!r.first_seen) return "necunoscut";
  const h = (r.published_at - r.first_seen) / 3600_000;
  return h < 1 ? "sub 1 oră" : h < 3 ? "1-3 ore" : h < 8 ? "3-8 ore" : "peste 8 ore";
};
const srcBucket = (r) => (r.source_count >= 4 ? "4+ surse" : `${r.source_count} surse`);

const pct = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor((a.length * p) / 100))] : 0);
function line(name, list) {
  const v = list.map((r) => r.views).sort((a, b) => a - b);
  if (!v.length) return;
  const sum = v.reduce((s, x) => s + x, 0);
  const over = ((100 * v.filter((x) => x > 10).length) / v.length).toFixed(0);
  const low = ((100 * v.filter((x) => x <= 3).length) / v.length).toFixed(0);
  console.log(`${name.padEnd(28)} n=${String(v.length).padStart(4)} viz=${String(sum).padStart(6)} medie=${(sum / v.length).toFixed(1).padStart(6)} mediana=${String(pct(v, 50)).padStart(4)} p90=${String(pct(v, 90)).padStart(5)} >10:${over.padStart(3)}% <=3:${low.padStart(3)}%`);
}
function table(title, keys, keyOf, data) {
  console.log(`\n=== ${title}`);
  for (const o of ["Automat", "Editor"]) {
    console.log(`-- ${o}`);
    for (const k of keys) line(k, data.filter((r) => origin(r) === o && [keyOf(r)].flat().includes(k)));
  }
}
const news = rows.filter((r) => ["Automat", "Editor"].includes(origin(r)));
console.log(`articole: ${rows.length}; ${rows[0]?.published_at.toISOString().slice(0, 10)} -> ${rows[rows.length - 1]?.published_at.toISOString().slice(0, 10)}`);
table("Locul", ["alte raioane", "Chișinău", "Bălți", "Găgăuzia", "Transnistria", "national", "international", "diaspora"], place, news);
table("Numărul de surse (știrile pe care le au toți)", ["1 surse", "2 surse", "3 surse", "4+ surse"], srcBucket, news);
table("Subiectul (după cuvinte din titlu și lead)", [...Object.keys(CLASSES), "altele"], classesOf, news);
table("Poza", ["poză reală (cu sursă)", "stoc / ilustrativă", "generată AI", "card / simbol", "captură video", "fără poză"], imageKind, news);
table("Întârzierea față de prima apariție la sursă", ["sub 1 oră", "1-3 ore", "3-8 ore", "peste 8 ore", "necunoscut"], lagOf, news);
console.log("\n=== Volumul pe loc, ultimele 14 zile (automat + editor)");
const last14 = news.filter((r) => r.published_at >= new Date(Date.now() - 14 * 86400_000));
for (const p of ["alte raioane", "Chișinău", "Bălți", "Găgăuzia", "Transnistria", "national", "international", "diaspora"]) line(p, last14.filter((r) => place(r) === p));

// Test: greutăți învățate din prima perioadă (media log(1+viz) pe trăsătură, față de media
// generală), verificate pe articolele AUTOMATE din perioada a doua. Scorul de acum, pe aceleași.
const cut = new Date("2026-10-24T00:00:00Z");
const train = news.filter((r) => r.published_at < cut);
const test = rows.filter((r) => r.published_at >= cut && origin(r) === "Automat");
const y = (r) => Math.log1p(r.views);
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const base = mean(train.map(y));
const feats = (r) => [...classesOf(r).map((c) => `c:${c}`), `p:${place(r)}`, `s:${srcBucket(r)}`, `i:${imageKind(r)}`];
const weight = {};
for (const f of new Set(train.flatMap(feats))) {
  const l = train.filter((r) => feats(r).includes(f));
  // puține exemple -> greutate mică
  weight[f] = (mean(l.map(y)) - base) * (l.length / (l.length + 10));
}
const learned = (r) => feats(r).reduce((s, f) => s + (weight[f] ?? 0), 0);
function rank(a) {
  const s = a.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]);
  const out = Array(a.length);
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++;
    for (let k = i; k <= j; k++) out[s[k][1]] = (i + j) / 2;
    i = j + 1;
  }
  return out;
}
function spearman(a, b) {
  const [x, z] = [rank(a), rank(b)];
  const [mx, mz] = [mean(x), mean(z)];
  const num = x.reduce((s, v, i) => s + (v - mx) * (z[i] - mz), 0);
  return num / Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0) * z.reduce((s, v) => s + (v - mz) ** 2, 0));
}
function topShare(score, share) {
  const s = [...test].sort((a, b) => score(b) - score(a)).slice(0, Math.ceil(test.length * share));
  const v = s.map((r) => r.views).sort((a, b) => a - b);
  return `mediana=${pct(v, 50)} medie=${mean(v).toFixed(1)} >10:${((100 * v.filter((x) => x > 10).length) / v.length).toFixed(0)}%`;
}
console.log(`\n=== Test: învățat până pe 24 oct (${train.length} articole), verificat pe ${test.length} automate de după`);
console.log(`Corelație cu vizualizările: scorul de acum ${spearman(test.map((r) => r.quality_score), test.map((r) => r.views)).toFixed(2)}, scorul învățat ${spearman(test.map(learned), test.map((r) => r.views)).toFixed(2)}`);
console.log(`Toate automatele: ${topShare(() => 0, 1)}`);
console.log(`Cele mai bune 30% după scorul de acum:   ${topShare((r) => r.quality_score, 0.3)}`);
console.log(`Cele mai bune 30% după scorul învățat:   ${topShare(learned, 0.3)}`);
console.log(`Cele mai bune 50% după scorul de acum:   ${topShare((r) => r.quality_score, 0.5)}`);
console.log(`Cele mai bune 50% după scorul învățat:   ${topShare(learned, 0.5)}`);
console.log("Greutăți:");
for (const [f, w] of Object.entries(weight).sort((a, b) => b[1] - a[1])) console.log(`  ${w.toFixed(2).padStart(6)} ${f}`);
