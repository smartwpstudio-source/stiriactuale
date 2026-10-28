// Miniaturile arhivei (2026-10-18): fiecare imagine din media.stiriactuale.info/arhiva/
// micșorată o singură dată la 384 și 828 px lățime (WebP) în mini/<lățime>/arhiva/…webp.
// Site-ul le servește direct (loader-ul din article-thumb.tsx), fără transformări
// Cloudflare Images (5.000 incluse pe lună). Rulează în GitHub Actions (media-move.yml,
// pas = miniaturi-arhiva). Reluabil: sare peste miniaturile care există deja.
// Din 2026-10-28 și pozele din articole/, locuri/, retete/ (cele noi le primesc la
// încărcare, putMedia din src/lib/media.ts).
import sharp from "sharp";
import { MEDIA_BUCKET, MEDIA_ORIGIN, putMediaExact } from "../../src/lib/media";
import { MINI_WIDTHS, miniKey } from "../../src/lib/media-url";

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID!;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const WIDTHS = MINI_WIDTHS;
const PREFIXES = ["arhiva/", "articole/", "locuri/", "retete/"];
const CONCURRENCY = 6;

const thumbKey = miniKey;

async function keys(prefix: string): Promise<Set<string>> {
  const out = new Set<string>();
  let cursor = "";
  do {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/r2/buckets/${MEDIA_BUCKET}/objects?per_page=1000&prefix=${encodeURIComponent(prefix)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`R2 list: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { result: { key: string }[]; result_info?: { cursor?: string; is_truncated?: boolean | string } };
    for (const o of json.result) out.add(o.key);
    const info = json.result_info;
    cursor = info && (info.is_truncated === true || info.is_truncated === "true") ? (info.cursor ?? "") : "";
  } while (cursor);
  return out;
}

(async () => {
  const sources = (await Promise.all(PREFIXES.map(keys))).flatMap((s) => [...s]).filter((k) => /\.(jpe?g|png|webp|gif)$/i.test(k));
  const done = await keys("mini/");
  const todo = sources.filter((k) => WIDTHS.some((w) => !done.has(thumbKey(k, w))));
  console.log(`${PREFIXES.join(" ")}: ${sources.length} imagini, de făcut: ${todo.length}`);

  let n = 0;
  const failed: string[] = [];
  const worker = async () => {
    for (let k = todo.shift(); k; k = todo.shift()) {
      try {
        const res = await fetch(`${MEDIA_ORIGIN}/${k}`, { signal: AbortSignal.timeout(60_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const input = Buffer.from(await res.arrayBuffer());
        for (const w of WIDTHS) {
          const out = await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
          await putMediaExact(thumbKey(k, w), out, "image/webp");
        }
      } catch (e) {
        failed.push(`${k}: ${(e as Error).message}`);
      }
      if (++n % 200 === 0) console.log(`  ${n} gata`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const after = await keys("mini/");
  const missing = sources.filter((k) => WIDTHS.some((w) => !after.has(thumbKey(k, w))));
  console.log(`miniaturi lipsă: ${missing.length}`);
  for (const f of failed.slice(0, 30)) console.log(`  eroare ${f}`);
  if (missing.length) process.exit(1);
})();
