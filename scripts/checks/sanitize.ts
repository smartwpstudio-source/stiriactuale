// Verificare rapidă a listei albe HTML: npx tsx scripts/checks/sanitize.ts
import assert from "node:assert/strict";
import { sanitizeBody as s } from "../../src/lib/content/sanitize";

assert.equal(s('<p onclick="x()">a<script>alert(1)</script></p>'), "<p>a</p>");
assert.equal(s('<a href="javascript:alert(1)">x</a>'), "<a href>x</a>");
assert.equal(s('<iframe src="https://evil.com/x"></iframe>'), "<iframe></iframe>");
assert.equal(s('<iframe src="https://www.youtube.com/embed/a"></iframe>'), '<iframe src="https://www.youtube.com/embed/a"></iframe>');
assert.equal(s("<img src=x onerror=alert(1)>"), "<img src>");
assert.equal(s('<a href="https://zdg.md/x">z</a>'), '<a href="https://zdg.md/x">z</a>');
console.log("sanitize: OK");
