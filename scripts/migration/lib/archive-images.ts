// Comun pentru download-images.ts și upload-images.ts: ce poze și clipuri are arhiva
// și unde stau pe disc.
import path from "node:path";
import type { WpContentPost } from "../export-wp-content";

export const UPLOADS = path.join(import.meta.dirname, "..", "data", "uploads");
export const WP_UPLOADS_PREFIX = "https://stiriactuale.info/wp-content/uploads/";

export function localPath(url: string): string {
  return path.join(UPLOADS, ...decodeURIComponent(url.slice(WP_UPLOADS_PREFIX.length).split("?")[0]).split("/"));
}

export function archiveImageUrls(posts: WpContentPost[]): string[] {
  const urls = new Set<string>();
  for (const p of posts) {
    if (p.featured?.url.startsWith(WP_UPLOADS_PREFIX)) urls.add(p.featured.url);
    // poze și clipuri din text (<img>, <video src>, <source src>)
    for (const m of p.content.rendered.matchAll(/<(?:img|video|source)[^>]+src="([^"]+)"/g)) {
      const src = m[1].replace(/^http:\/\//, "https://");
      if (src.startsWith(WP_UPLOADS_PREFIX)) urls.add(src);
    }
  }
  return [...urls];
}

