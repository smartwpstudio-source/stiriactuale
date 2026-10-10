// Poze de stoc Magnific (licență comercială) pentru ghiduri și rețete.
//   npx tsx --env-file=.env.local scripts/stock.ts search "sarmale" [10]
//   npx tsx --env-file=.env.local scripts/stock.ts get <id> retete/sarmale
// `get` copiază poza în Vercel Blob și afișează adresa publică.
import { copyToBlob, searchStock } from "../src/lib/pipeline/image";

const API = "https://api.magnific.com/v1";

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "search" && a) {
    for (const r of await searchStock(a, Number(b) || 10)) console.log(`${r.id}\t${r.title}\t${r.preview}`);
    return;
  }
  if (cmd === "get" && a && b) {
    const res = await fetch(`${API}/resources/${a}/download?image_size=medium`, {
      headers: { "x-magnific-api-key": process.env.MAGNIFIC_API_KEY! },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: { url?: string; signed_url?: string } };
    console.log(await copyToBlob(data.url ?? data.signed_url!, `${b}.jpg`));
    return;
  }
  console.error("folosire: search <termen> [n] | get <id> <cale-blob-fara-extensie>");
  process.exit(1);
}
main();
