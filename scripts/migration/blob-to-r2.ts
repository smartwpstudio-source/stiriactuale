// Copiază toate fișierele din Vercel Blob (stiriactuale-media) în Cloudflare R2,
// cu aceeași cale (arhiva/2022/12/x.webp -> media.stiriactuale.info/arhiva/2022/12/x.webp).
// Rulează în GitHub Actions (media-move.yml). Reluabil: sare peste ce există deja
// în R2 cu aceeași mărime. La final compară numărul și mărimea totală.
import { list } from "@vercel/blob";
import { MEDIA_BUCKET, putMediaExact } from "../../src/lib/media";

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID!;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const CONCURRENCY = 8;

async function r2Objects(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  let cursor = "";
  do {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/r2/buckets/${MEDIA_BUCKET}/objects?per_page=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`R2 list: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { result: { key: string; size: number }[]; result_info?: { cursor?: string; is_truncated?: boolean | string } };
    for (const o of json.result) out.set(o.key, o.size);
    const info = json.result_info;
    cursor = info && (info.is_truncated === true || info.is_truncated === "true") ? info.cursor ?? "" : "";
  } while (cursor);
  return out;
}

(async () => {
  const blobs: { pathname: string; url: string; size: number; contentType?: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const total = blobs.reduce((s, b) => s + b.size, 0);
  console.log(`Blob: ${blobs.length} fișiere, ${(total / 1e6).toFixed(1)} MB`);

  const existing = await r2Objects();
  const todo = blobs.filter((b) => existing.get(b.pathname) !== b.size);
  console.log(`deja în R2: ${blobs.length - todo.length}, de copiat: ${todo.length}`);

  let done = 0;
  const failed: string[] = [];
  const worker = async () => {
    for (let b = todo.shift(); b; b = todo.shift()) {
      try {
        const res = await fetch(b.url, { signal: AbortSignal.timeout(60_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const type = res.headers.get("content-type") ?? "application/octet-stream";
        await putMediaExact(b.pathname, new Uint8Array(await res.arrayBuffer()), type);
      } catch (e) {
        failed.push(`${b.pathname}: ${(e as Error).message}`);
      }
      if (++done % 250 === 0) console.log(`  ${done} copiate`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const after = await r2Objects();
  const missing = blobs.filter((b) => after.get(b.pathname) !== b.size);
  const r2Total = [...after.values()].reduce((s, n) => s + n, 0);
  console.log(`R2: ${after.size} fișiere, ${(r2Total / 1e6).toFixed(1)} MB`);
  if (failed.length) console.log(`erori (${failed.length}):\n${failed.slice(0, 30).join("\n")}`);
  console.log(missing.length ? `LIPSESC ${missing.length}: ${missing.slice(0, 20).map((b) => b.pathname).join(", ")}` : "VERIFICARE OK: toate fișierele sunt în R2 cu aceeași mărime");
  process.exit(missing.length ? 1 : 0);
})();
