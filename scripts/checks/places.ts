// Rotația pozelor din arhiva de locuri (src/lib/pipeline/places.ts).
// npx tsx scripts/checks/places.ts
import assert from "node:assert";
import { pickRotated } from "../../src/lib/pipeline/places";

const p = (url: string) => ({ url, credit: "c" });
// niciodată folosită bate una folosită
assert.equal(pickRotated([p("a"), p("b")], ["a"])?.url, "b");
// ambele folosite: cea mai veche, dacă e destul de departe
const recent = ["a", ...Array(20).fill("x"), "b"];
assert.equal(pickRotated([p("a"), p("b")], recent)?.url, "b");
assert.equal(recent[0], "b"); // trecută în față pentru rulările următoare
// singura poză, folosită chiar adineauri: nu se repetă alăturat
assert.equal(pickRotated([p("a")], ["x", "a"]), null);
console.log("places: OK");
