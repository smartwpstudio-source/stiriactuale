// Adresele miniaturilor (src/lib/media-url.ts): R2 și ilustrațiile-simbol.
import assert from "node:assert/strict";
import { miniUrl } from "../../src/lib/media-url";

assert.equal(miniUrl("https://media.stiriactuale.info/articole/a-b1.jpg", 828), "https://media.stiriactuale.info/mini/828/articole/a-b1.webp");
assert.equal(miniUrl("https://media.stiriactuale.info/mini/384/articole/a.webp", 384), null);
assert.equal(miniUrl("https://stiriactuale.info/simbol/lupte-1.png", 384), "/simbol/mini/384/lupte-1.webp");
assert.equal(miniUrl("/simbol/accident-rutier-2.png", 828), "/simbol/mini/828/accident-rutier-2.webp");
assert.equal(miniUrl("https://stiriactuale.info/grafic/cod-galben.png", 828), null);
assert.equal(miniUrl("https://i.ytimg.com/vi/x/hqdefault.jpg", 828), null);
console.log("media-url: OK");
