// Pozele din corpul știrii sursei (src/lib/pipeline/fulltext.ts).
import assert from "node:assert/strict";
import { extractArticle } from "../../src/lib/pipeline/fulltext";

const html = `<html><head><meta property="og:image" content="https://x.md/up/main-800x600.jpg"></head><body>
<img src="/logo.png"><article><img src="/up/main.jpg"><p>${"Text despre accident. ".repeat(10)}</p>
<figure><img data-src="/up/foto2.jpg" src="data:image/gif;base64,AAA"></figure>
<img src="https://x.md/up/foto3.jpg?w=900" width="900"><img src="/icons/fb.png"><img src="/up/mic.jpg" width="120">
<a href="/alta-stire/"><img src="/up/recomandat.jpg"></a><a href="/up/mare.jpg"><img src="/up/mare-300x200.jpg"></a>
</article></body></html>`;
assert.deepEqual(extractArticle(html, "https://x.md/stire/1").photos, [
  "https://x.md/up/foto2.jpg",
  "https://x.md/up/foto3.jpg?w=900",
  "https://x.md/up/mare-300x200.jpg",
]);
assert.deepEqual(extractArticle(html).photos, []);
console.log("article-photos: OK");
