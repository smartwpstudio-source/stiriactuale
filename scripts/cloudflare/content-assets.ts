// Copiază content/ în Workers Static Assets, după `opennextjs-cloudflare build`
// (pe Workers nu există sistem de fișiere — vezi src/lib/content/store.ts):
//   .open-next/assets/_continut/<dir>/<slug>.json   fișierele citite pe rând
//   .open-next/assets/_continut/<dir>.all.json      pachetul listelor mari
//   .open-next/assets/_continut/_index.json         slug-urile pe director
// Prefixul nu e public (worker-ul răspunde 404 la cererile directe).
// Rulare: npm run cf:build (sau direct: npx tsx scripts/cloudflare/content-assets.ts)
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BUNDLED_DIRS,
  bundleName,
  CONTENT_ASSETS_PREFIX,
  CONTENT_INDEX,
  SITE_CONTENT_DIRS,
} from "../../src/lib/content/store";

const SRC = path.join(process.cwd(), "content");
const ASSETS = path.join(process.cwd(), ".open-next", "assets");
const OUT = path.join(ASSETS, CONTENT_ASSETS_PREFIX);
const MAX_ASSET = 25 * 1024 * 1024; // limita Cloudflare pe fișier

async function main() {
  await stat(ASSETS).catch(() => {
    throw new Error(`${ASSETS} lipsește — rulează întâi opennextjs-cloudflare build`);
  });
  await rm(OUT, { recursive: true, force: true });

  const index: Record<string, string[]> = {};
  let files = 0;
  let bytes = 0;
  const write = async (rel: string, data: string) => {
    if (Buffer.byteLength(data) > MAX_ASSET) throw new Error(`${rel}: peste 25 MiB, limita unui asset Cloudflare`);
    const f = path.join(OUT, rel);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, data);
    files++;
    bytes += Buffer.byteLength(data);
  };

  for (const dir of SITE_CONTENT_DIRS) {
    const slugs = (await readdir(path.join(SRC, dir)))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5))
      .sort();
    index[dir] = slugs;
    const all: unknown[] = [];
    for (const slug of slugs) {
      const raw = await readFile(path.join(SRC, dir, `${slug}.json`), "utf8");
      const parsed = JSON.parse(raw); // JSON stricat = build oprit, nu pagină goală
      all.push(parsed);
      await write(`${dir}/${slug}.json`, JSON.stringify(parsed));
    }
    if (BUNDLED_DIRS.includes(dir)) await write(bundleName(dir), JSON.stringify(all));
    console.log(`${dir}: ${slugs.length}`);
  }
  await write(CONTENT_INDEX, JSON.stringify(index));
  console.log(`content-assets: ${files} fișiere, ${(bytes / 1e6).toFixed(1)} MB în ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
