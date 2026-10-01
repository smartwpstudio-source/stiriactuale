// Urcă în Vercel Blob pozele și clipurile arhivei descărcate de
// download-images.ts și înlocuiește URL-urile WordPress din baza de date
// (imaginea reprezentativă + <img>/<video> din text). DUPĂ activarea Vercel
// Pro și setarea BLOB_READ_WRITE_TOKEN. Se poate relua: căile din Blob sunt
// fixe (arhiva/AAAA/LL/fisier), un fișier deja urcat se suprascrie identic.
// După rulare, domeniul stiriactuale.info poate ieși din next.config.ts
// (images.remotePatterns).
//
// Rulare: npm run migrate:upload-images

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { put } from "@vercel/blob";
import { and, eq, isNotNull, like, or } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";
import type { WpContentPost } from "./export-wp-content";
import { archiveImageUrls, localPath, WP_UPLOADS_PREFIX } from "./lib/archive-images";
import { copiedSource } from "./lib/wp-archive";

const CONCURRENCY = 4;
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".mp4": "video/mp4", ".mov": "video/quicktime",
};

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN lipsește din .env.local");

  const { posts } = JSON.parse(
    await readFile(path.join(import.meta.dirname, "data", "wp-content.json"), "utf8"),
  ) as { posts: WpContentPost[] };
  const urls = archiveImageUrls(posts.filter((p) => !copiedSource(p)));

  const map = new Map<string, string>();
  const failed: string[] = [];
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        try {
          const rel = decodeURIComponent(url.slice(WP_UPLOADS_PREFIX.length).split("?")[0]);
          const blob = await put(`arhiva/${rel}`, await readFile(localPath(url)), {
            access: "public",
            contentType: TYPES[path.extname(rel).toLowerCase()] ?? "application/octet-stream",
            addRandomSuffix: false,
            allowOverwrite: true,
            multipart: rel.endsWith(".mp4") || rel.endsWith(".mov"),
          });
          map.set(url, blob.url);
          if (map.size % 50 === 0) console.log(`urcate: ${map.size}/${urls.length}`);
        } catch (err) {
          failed.push(`${url} — ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }),
  );
  console.log(`Urcate: ${map.size}, eșuate: ${failed.length}`);
  failed.forEach((f) => console.error(f));

  // Rescrierea URL-urilor în articolele importate
  const db = getDb();
  const rows = await db
    .select({ id: articles.id, imageUrl: articles.imageUrl, bodyHtml: articles.bodyHtml })
    .from(articles)
    .where(
      and(
        isNotNull(articles.wpId),
        or(like(articles.imageUrl, `${WP_UPLOADS_PREFIX}%`), like(articles.bodyHtml, "%/wp-content/uploads/%")),
      ),
    );
  let updated = 0;
  for (const r of rows) {
    const imageUrl = r.imageUrl && map.has(r.imageUrl) ? map.get(r.imageUrl)! : r.imageUrl;
    const bodyHtml = r.bodyHtml.replace(/(?:https?:)?\/\/stiriactuale\.info\/wp-content\/uploads\/[^"'\s)]+/g, (u) => {
      const abs = `https:${u.replace(/^https?:/, "")}`;
      return map.get(abs) ?? u;
    });
    if (imageUrl !== r.imageUrl || bodyHtml !== r.bodyHtml) {
      await db.update(articles).set({ imageUrl, bodyHtml }).where(eq(articles.id, r.id));
      updated++;
    }
  }
  console.log(`Articole actualizate: ${updated}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
