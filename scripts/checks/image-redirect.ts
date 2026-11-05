// Adresele vechi /_next/image -> miniatura gata făcută (cloudflare/worker.ts): npx tsx scripts/checks/image-redirect.ts
import assert from "node:assert/strict";
import { miniUrl } from "../../src/lib/media-url";

// aceeași alegere ca în worker.ts
const to = (src: string, w: string) => {
  const mini = miniUrl(src, Number(w) > 384 ? 828 : 384);
  return mini && new URL(mini, "https://stiriactuale.info/_next/image").toString();
};
assert.equal(to("https://media.stiriactuale.info/articole/x-1.jpg", "1200"), "https://media.stiriactuale.info/mini/828/articole/x-1.webp");
assert.equal(to("/simbol/pieton-1.png", "640"), "https://stiriactuale.info/simbol/mini/828/pieton-1.webp");
assert.equal(to("https://stiriactuale.info/simbol/razboi-2.png", "256"), "https://stiriactuale.info/simbol/mini/384/razboi-2.webp");
assert.equal(to("https://i.ytimg.com/vi/a/hq.jpg", "640"), null, "fără miniatură: rămâne optimizarea Next");
assert.equal(to("", "640"), null);
console.log("image-redirect: OK");
