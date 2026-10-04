// Marcajul (VIDEO)/(FOTO) din titlu (src/lib/pipeline/media-tag.ts).
// npx tsx scripts/checks/media-tag.ts
import assert from "node:assert";
import { mediaTag } from "../../src/lib/pipeline/media-tag";

assert.equal(mediaTag("Atac la Kiev", true, false), "Atac la Kiev (VIDEO)");
assert.equal(mediaTag("Tu-95 prăbușit", false, true), "Tu-95 prăbușit (FOTO)");
assert.equal(mediaTag("Știre simplă", false, false), "Știre simplă");
assert.equal(mediaTag("Deja (VIDEO)", true, false), "Deja (VIDEO)");
console.log("media-tag: OK");
