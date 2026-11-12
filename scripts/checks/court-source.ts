// Hotărârile instanțelor (court-source.ts): npx tsx scripts/checks/court-source.ts
import assert from "node:assert/strict";
import { courtSummary, parseCourtList } from "../../src/lib/pipeline/court-source";

const html = `<table><tbody><tr><td>Judecătoria Drochia</td><td>4-26052442-26-4-28042026</td><td>VRABII AUREL - Articolul 78[1]. Violența în familie</td><td>2026-11-9</td><td>2026-11-9</td><td>2026-11-9</td><td>Contravenţional</td><td>Articolul 78[1]. Violența în familie</td><td>MARIA ADOMNIŢA</td><td><a href="pigd_integration/pdf/9BBDA530">PDF</a></td></tr></tbody></table>`;
const [row] = parseCourtList(html);
assert.equal(row.subject, "Articolul 78[1]. Violența în familie");
assert.equal(row.published, "2026-11-9");
assert.equal(row.pdf, "https://instante.justice.md/ro/pigd_integration/pdf/9BBDA530");

const text = "dosarul nr.4-137/2026 H O T Ă R Â R E 09 noiembrie 2026 Judecătoria Drochia, sediul Rîșcani ... martorul a constatat că era beat ... a c o n s t a t a t X, la 11 martie 2026, a lovit-o pe concubina sa. ... h o t ă r ă ş t e X se recunoaște vinovat, 40 de ore de muncă neremunerată.";
const sum = courtSummary(text);
assert.match(sum, /Judecătoria Drochia, sediul Rîșcani, 09 noiembrie 2026/);
assert.match(sum, /FAPTELE: a c o n s t a t a t X, la 11 martie/, "faptele încep la „a c o n s t a t a t”, nu la declarația martorului");
assert.match(sum, /DECIZIA: h o t ă r ă ş t e X se recunoaște vinovat, 40 de ore/);
console.log("court-source: OK");
