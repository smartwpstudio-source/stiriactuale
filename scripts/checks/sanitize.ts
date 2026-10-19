// Verificare rapidă a listei albe HTML: npx tsx scripts/checks/sanitize.ts
import assert from "node:assert/strict";
import { sanitizeBody as s, splitForAds } from "../../src/lib/content/sanitize";

assert.equal(s('<p onclick="x()">a<script>alert(1)</script></p>'), "<p>a</p>");
assert.equal(s('<a href="javascript:alert(1)">x</a>'), "<a href>x</a>");
assert.equal(s('<iframe src="https://evil.com/x"></iframe>'), "<iframe></iframe>");
assert.equal(s('<iframe src="https://www.youtube.com/embed/a"></iframe>'), '<iframe src="https://www.youtube.com/embed/a"></iframe>');
assert.equal(s("<img src=x onerror=alert(1)>"), "<img src>");
assert.equal(s('<a href="https://zdg.md/x">z</a>'), '<a href="https://zdg.md/x">z</a>');
assert.equal(s('<video src="https://x.public.blob.vercel-storage.com/a.mp4" controls onplay="x()"></video>'), '<video src="https://x.public.blob.vercel-storage.com/a.mp4" controls></video>');
assert.equal(s('<video src="javascript:alert(1)"></video>'), "<video src></video>");
// reclama: după blocul 2, una singură; măcar 2 blocuri după ea
const P = (n: number) => Array.from({ length: n }, (_, i) => `<p>${i + 1}</p>`).join("");
assert.equal(splitForAds(P(3)).length, 1);
assert.deepEqual(splitForAds(P(4)), [P(2), "<p>3</p><p>4</p>"]);
assert.equal(splitForAds(P(40)).length, 2); // o singură reclamă în text
assert.equal(splitForAds("<p>a</p><ul><li>x</li></ul><table></table><p>b</p>").length, 2);
assert.equal(splitForAds(P(9)).join(""), P(9));
console.log("sanitize: OK");
