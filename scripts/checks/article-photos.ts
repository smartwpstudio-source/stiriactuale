// Pozele din corpul știrii sursei (src/lib/pipeline/fulltext.ts).
import assert from "node:assert/strict";
import { extractArticle } from "../../src/lib/pipeline/fulltext";

const html = `<html><head><meta property="og:title" content="Accident grav la Orhei: doi răniți"><meta property="og:image" content="https://x.md/up/main-800x600.jpg"></head><body>
<img src="/logo.png"><article><img src="/up/main.jpg"><p>${"Text despre accident. ".repeat(10)}</p>
<figure><img data-src="/up/foto2.jpg" src="data:image/gif;base64,AAA" alt="Mașina după accidentul de la Orhei"></figure>
<img src="https://x.md/up/foto3.jpg?w=900" width="900"><img src="/icons/fb.png"><img src="/up/mic.jpg" width="120">
<img src="https://media.x.md/image/202610/235x132/1-2.jpg"><img src="https://x.md/crop/a.webp?width=204&height=117">
<img src="https://x.md/crop/b.webp?width=828" alt="Război în Ucraina, ziua 1710: atac în Rusia, explozii la Kiev și ajutor la Oleșki">
<img src="">
<a href="/alta-stire/"><img src="/up/recomandat.jpg"></a><a href="/up/mare.jpg"><img src="/up/mare-300x200.jpg"></a>
</article></body></html>`;
assert.deepEqual(extractArticle(html, "https://x.md/stire/1").photos, [
  "https://x.md/up/foto2.jpg",
  "https://x.md/up/foto3.jpg?w=900",
  "https://x.md/up/mare-300x200.jpg",
]);
assert.deepEqual(extractArticle(html).photos, []);
console.log("article-photos: OK");
