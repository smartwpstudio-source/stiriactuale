// Diagnostic, doar citire: crește contorul de vizualizări? Două fotografii ale coloanei
// articles.views la 5 minute distanță (db-move.yml, pas = vizualizari).
import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith(".pooler.supabase.com")) url.port = "6543";
const sql = postgres(url.toString(), { max: 1, prepare: false });

const snap = () => sql`
  select slug, kind, views, published_at
  from articles
  where status = 'published' and wp_id is null and published_at > now() - interval '48 hours'
  order by published_at desc`;

const a = await snap();
await new Promise((r) => setTimeout(r, 5 * 60_000));
const b = await snap();
const before = new Map(a.map((r) => [r.slug, r.views]));

const sum = (rows) => rows.reduce((s, r) => s + r.views, 0);
console.log(`articole 48h: ${b.length}; total vizualizări: ${sum(a)} -> ${sum(b)}`);
console.log(`cu 0 vizualizări: ${b.filter((r) => r.views === 0).length}`);
const byKind = {};
for (const r of b) (byKind[r.kind] ??= { n: 0, zero: 0, views: 0 }), byKind[r.kind].n++, (byKind[r.kind].views += r.views), (byKind[r.kind].zero += r.views === 0 ? 1 : 0);
console.log(JSON.stringify(byKind));
for (const r of b.slice(0, 25)) console.log(`${String(r.views).padStart(6)} +${r.views - (before.get(r.slug) ?? 0)} ${r.kind} ${r.slug.slice(0, 70)}`);
await sql.end();
