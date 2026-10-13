// Rotația pozelor din arhiva de locuri (src/lib/pipeline/places.ts).
// npx tsx scripts/checks/places.ts
import assert from "node:assert";
import { groupSymbolPhotos, pickRotated, sameTheme } from "../../src/lib/pipeline/places";

const p = (url: string) => ({ url, credit: "c" });
// niciodată folosită bate una folosită
assert.equal(pickRotated([p("a"), p("b")], ["a"])?.url, "b");
// ambele folosite: cea mai veche, dacă e destul de departe
const recent = ["a", ...Array(20).fill("x"), "b"];
assert.equal(pickRotated([p("a"), p("b")], recent)?.url, "b");
assert.equal(recent[0], "b"); // trecută în față pentru rulările următoare
// singura poză, folosită chiar adineauri: nu se repetă alăturat
assert.equal(pickRotated([p("a")], ["x", "a"]), null);

// --- pozele simbol: pe aceeași temă -> un singur loc cu mai multe poze, rotite
assert.ok(sameTheme("Accident rutier pe un drum național", "Accident rutier pe drum"));
assert.ok(!sameTheme("Accident rutier pe un drum național", "Pompieri la un incendiu de vegetație"));
const groups = groupSymbolPhotos([
  { id: 10, title: "Trei mașini avariate la Orhei", alt: "Accident rutier", url: "u1" },
  { id: 9, title: "Coliziune pe R1", alt: "accident rutier.", url: "u2" },
  { id: 8, title: "Tamponare la Bălți", alt: "Accident rutier, mașini avariate", url: "u3" },
  { id: 7, title: "Incendiu la Ialoveni", alt: "Pompieri la un incendiu", url: "u4" },
  { id: 6, title: "Aceeași poză refolosită", alt: "Accident rutier", url: "u1" }, // aceeași adresă: o singură dată
  { id: 5, title: "Știre fără descriere", alt: null, url: "u5" },
  { id: 4, title: "Fără poză", alt: "Accident rutier", url: null },
]);
assert.equal(groups.length, 3);
const accident = groups[0];
assert.deepEqual(accident.photos.map((x) => x.url), ["u1", "u2", "u3"]);
assert.equal(accident.name, "TEMĂ (poză simbol): Accident rutier");
assert.equal(accident.photos[0].credit, "Imagine simbol");
assert.equal(groups[2].name, "TEMĂ (poză simbol): Știre fără descriere", "fără descriere: tema e titlul");
// rotația între pozele temei: niciodată folosită întâi, apoi cea folosită cel mai demult;
// știrile alăturate nu primesc aceeași poză
const used = ["u1", "u2"];
assert.equal(pickRotated(accident.photos, used)?.url, "u3");
const far = ["u2", ...Array(15).fill("x"), "u1", ...Array(15).fill("y"), "u3"];
assert.equal(pickRotated(accident.photos, far)?.url, "u3", "cea mai veche dintre cele folosite");
assert.equal(pickRotated(accident.photos, far)?.url, "u1", "următoarea știre: altă poză");
// toate trei folosite în ultimele articole: nu se repetă, se trece la stoc
assert.equal(pickRotated(accident.photos, ["u1", "u2", "u3"]), null);

console.log("places: OK");
