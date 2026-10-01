// Descarcă local pozele articolelor PROPRII din arhiva WordPress (imaginea
// reprezentativă + pozele din text găzduite pe stiriactuale.info), în scripts/migration/data/uploads/,
// păstrând calea din wp-content/uploads. Se poate relua: fișierele existente
// se sar. Urcarea în Vercel Blob e un pas separat (upload-images.ts), după
// activarea planului Pro.
//
// Rulare: npm run migrate:download-images

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WpContentPost } from "./export-wp-content";
import { archiveImageUrls, localPath } from "./lib/archive-images";
import { copiedSource } from "./lib/wp-archive";

const DATA = path.join(import.meta.dirname, "data");
const HEADERS = { "User-Agent": "Mozilla/5.0 (stiriactuale-migration-script)" };
const CONCURRENCY = 3;

async function exists(p: string) {
  return stat(p).then(
    () => true,
    () => false,
  );
}

async function main() {
  const { posts } = JSON.parse(await readFile(path.join(DATA, "wp-content.json"), "utf8")) as { posts: WpContentPost[] };
  // articolele preluate se importă fără imagine — nu le descărcăm pozele
  const urls = archiveImageUrls(posts.filter((p) => !copiedSource(p)));
  console.log(`${urls.length} imagini de descărcat`);

  let done = 0, skipped = 0, bytes = 0;
  const failed: string[] = [];
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        const file = localPath(url);
        if (await exists(file)) {
          skipped++;
          continue;
        }
        try {
          const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60_000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          await mkdir(path.dirname(file), { recursive: true });
          await writeFile(file, buf);
          bytes += buf.length;
        } catch (err) {
          failed.push(`${url} — ${err instanceof Error ? err.message : String(err)}`);
        }
        if (++done % 100 === 0) console.log(`${done + skipped}/${urls.length} (${(bytes / 1e6).toFixed(0)} MB)`);
      }
    }),
  );

  await writeFile(path.join(DATA, "download-failed.txt"), failed.join("\n"));
  console.log(`Gata: ${done - failed.length} descărcate, ${skipped} existau deja, ${failed.length} eșuate, ${(bytes / 1e6).toFixed(0)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
