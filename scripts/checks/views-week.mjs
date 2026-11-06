// Raport, doar citire: ultima săptămână — ce articole au adunat vizualizări (de la 10 în sus)
// și cum stau temele (db-move.yml, pas = raport-saptamana).
import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith(".pooler.supabase.com")) url.port = "6543";
const sql = postgres(url.toString(), { max: 1, prepare: false });

const rows = await sql`
  select a.title, a.kind, a.section, a.locality, a.audience, a.views, a.ru_views, a.published_at, a.impact is not null as has_impact,
    exists (select 1 from candidates c where c.manual and jsonb_exists(a.source_urls, c.url)) as manual
  from articles a
  where a.status = 'published' and a.wp_id is null and a.published_at >= now() - interval '8 days'
  order by a.views desc`;
await sql.end();

const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const CLASSES = {
  util_impact: (r) => r.kind === "util" || r.has_impact,
  bani_preturi_reguli: (r) => /\b(pensi|salari|compensat|ajutor|indemniz|impozit|tax|tva|amend|credit|tarif|factur|pret|scump|ieftin|benzina|motorina|lege|regul|obligator|interzis|de la 1)/.test(norm(r.title)),
  politica_declaratii: (r) => /\b(sandu|tofan|ceban|dodon|costiuc|parlament|deput|premier|partid|guvern|ministr|presedint|a declarat|spune|acuza|cere demisia)/.test(norm(r.title)),
  internationale: (r) => r.section === "international",
  locale: (r) => r.section === "regiuni",
};
const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
const line = (label, xs) => {
  const v = xs.map((r) => r.views);
  const ge10 = v.filter((x) => x >= 10).length;
  const le3 = v.filter((x) => x <= 3).length;
  console.log(`${label.padEnd(22)} ${String(xs.length).padStart(4)} articole | mediana ${String(median(v)).padStart(3)} | ≥10: ${Math.round((ge10 / (xs.length || 1)) * 100)}% | ≤3: ${Math.round((le3 / (xs.length || 1)) * 100)}% | total ${v.reduce((a, b) => a + b, 0)}`);
};

console.log(`ULTIMELE 8 ZILE: ${rows.length} articole publicate\n`);
line("toate", rows);
for (const s of ["regiuni", "national", "international", "diaspora"]) line(`rubrica ${s}`, rows.filter((r) => r.section === s));
for (const k of ["stire", "pe-scurt", "util", "analiza"]) line(`tip ${k}`, rows.filter((r) => r.kind === k));
line("ale editorului", rows.filter((r) => r.manual));
line("automate", rows.filter((r) => !r.manual));
for (const a of ["grupuri", "local", "pagina"]) line(`public ${a}`, rows.filter((r) => r.audience === a));
console.log("");
for (const [name, f] of Object.entries(CLASSES)) line(`tema ${name}`, rows.filter(f));
const politicsAuto = rows.filter((r) => !r.manual && CLASSES.politica_declaratii(r));
line("politică automată", politicsAuto);
line("internațional automat", rows.filter((r) => !r.manual && r.section === "international"));

console.log("\nARTICOLELE CU 10+ VIZUALIZĂRI (vizualizări | RU | rubrica | tip | public | editor | titlu):");
for (const r of rows.filter((x) => x.views >= 10)) {
  console.log(`${String(r.views).padStart(5)} | ${String(r.ru_views ?? 0).padStart(3)} | ${(r.section + (r.locality ? "/" + r.locality : "")).padEnd(22)} | ${r.kind.padEnd(8)} | ${(r.audience ?? "-").padEnd(8)} | ${r.manual ? "E" : " "} | ${r.title.slice(0, 110)}`);
}
console.log("\nCELE AUTOMATE CU 0-1 VIZUALIZĂRI (rubrica | titlu), primele 60:");
for (const r of rows.filter((x) => !x.manual && x.views <= 1).slice(-60)) console.log(`${r.section.padEnd(14)} | ${r.title.slice(0, 120)}`);
