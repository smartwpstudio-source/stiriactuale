// Înlocuiește în baza de date adresele Vercel Blob cu media.stiriactuale.info,
// în toate coloanele text ale schemei site-ului (poze, text de articol cu imagini/video).
// Fără „--aplica” doar numără. Rulează în GitHub Actions (media-move.yml).
import { sql } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { MEDIA_ORIGIN } from "../../src/lib/media";

const OLD = "https://adbkkroefuiuzovm.public.blob.vercel-storage.com";

(async () => {
  const apply = process.argv.includes("--aplica");
  const db = getDb();
  const cols = (await db.execute(sql`
    select table_name, column_name from information_schema.columns
    where table_schema = current_schema() and data_type in ('text', 'character varying', 'jsonb', 'json')
  `)) as unknown as { table_name: string; column_name: string }[];
  let total = 0;
  for (const { table_name: t, column_name: c } of cols) {
    const isJson = (await db.execute(sql`select data_type from information_schema.columns where table_schema = current_schema() and table_name = ${t} and column_name = ${c}`)) as unknown as { data_type: string }[];
    const json = isJson[0]?.data_type.startsWith("json");
    const asText = json ? sql`${sql.identifier(c)}::text` : sql.identifier(c);
    const [{ n }] = (await db.execute(sql`select count(*)::int as n from ${sql.identifier(t)} where ${asText} like ${"%" + OLD + "%"}`)) as unknown as { n: number }[];
    if (!n) continue;
    total += n;
    console.log(`${t}.${c}: ${n} rânduri`);
    if (apply) {
      const set = json
        ? sql`${sql.identifier(c)} = replace(${sql.identifier(c)}::text, ${OLD}, ${MEDIA_ORIGIN})::${sql.raw(isJson[0].data_type)}`
        : sql`${sql.identifier(c)} = replace(${sql.identifier(c)}, ${OLD}, ${MEDIA_ORIGIN})`;
      await db.execute(sql`update ${sql.identifier(t)} set ${set} where ${asText} like ${"%" + OLD + "%"}`);
    }
  }
  console.log(`total: ${total} rânduri${apply ? " actualizate" : " (doar numărare; rulează cu --aplica)"}`);
  process.exit(0);
})();
