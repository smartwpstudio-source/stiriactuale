// Numele pașilor (JSON-LD) și nota cititorilor la rețete: npx tsx scripts/checks/recipe-rating.ts
// Cu argumentul --dump afișează numele generate pentru toți pașii, ca să le citești.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { formatRating, isStars, ratingSummary, ratingsLabel, stepName } from "../../src/lib/recipe-rating";

// --- numele pasului: prima bucată de frază, fără punctuație la final
assert.equal(stepName("Gustă o foaie de varză. Dacă e foarte sărată, ține foile în apă."), "Gustă o foaie de varză");
assert.equal(stepName("Între timp, fă tăițeii: frământă făina cu ouăle"), "Între timp, fă tăițeii");
assert.equal(stepName("Pune găina în oală cu apa rece și adu încet la fierbere."), "Pune găina în oală cu apa");
assert.equal(stepName("Unge aluatul cu ulei, acoperă-l și lasă-l 30 de minute."), "Unge aluatul cu ulei");
assert.equal(stepName("Fierbe 1,5–2 ore, la foc mic."), "Fierbe 1,5–2 ore");
assert.equal(stepName("Servește."), "Servește");
assert.equal(stepName("Смажьте тесто маслом, накройте и оставьте на 30 минут."), "Смажьте тесто маслом");
assert.equal(stepName("Тем временем приготовьте лапшу: замесите муку"), "Тем временем приготовьте лапшу");
assert.equal(stepName("Положите курицу в кастрюлю с холодной водой и медленно доведите до кипения."), "Положите курицу в кастрюлю с холодной");
assert.equal(stepName("Taie ceapa (mărunt) și călește"), "Taie ceapa");
// determinist + niciodată gol, pe toate rețetele reale
for (const dir of ["retete", "retete-ru"]) {
  const d = path.join(process.cwd(), "content", dir);
  for (const f of readdirSync(d).filter((x) => x.endsWith(".json"))) {
    const r = JSON.parse(readFileSync(path.join(d, f), "utf8")) as { steps: { text: string; name?: string }[] };
    for (const s of r.steps) {
      const n = s.name ?? stepName(s.text);
      assert.ok(n.length > 0 && n.split(/\s+/).length <= 8 && !/[,.;:]$/.test(n), `${dir}/${f}: „${n}”`);
      assert.equal(stepName(s.text), stepName(s.text));
      if (process.argv.includes("--dump")) console.log(`${dir}/${f}: ${n}`);
    }
  }
}

// --- media notelor: o zecimală, nimic inventat când nu sunt note
assert.equal(ratingSummary(0, 0), null);
assert.deepEqual(ratingSummary(5, 1), { value: 5, count: 1 });
assert.deepEqual(ratingSummary(4 + 5 + 5, 3), { value: 4.7, count: 3 });
assert.deepEqual(ratingSummary(4 + 5, 2), { value: 4.5, count: 2 });
assert.deepEqual(ratingSummary(1 + 2, 2), { value: 1.5, count: 2 });
assert.equal(ratingSummary(Number.NaN, 2), null);
assert.equal(formatRating(4.6, "ro"), "4,6 din 5");
assert.equal(formatRating(5, "ru"), "5,0 из 5");
assert.ok(isStars(1) && isStars(5) && !isStars(0) && !isStars(6) && !isStars(4.5) && !isStars("5"));

// --- pluralele
assert.equal(ratingsLabel(1, "ro"), "1 notă");
assert.equal(ratingsLabel(12, "ro"), "12 note");
assert.equal(ratingsLabel(20, "ro"), "20 de note");
assert.equal(ratingsLabel(101, "ro"), "101 note");
assert.equal(ratingsLabel(1, "ru"), "1 оценка");
assert.equal(ratingsLabel(3, "ru"), "3 оценки");
assert.equal(ratingsLabel(5, "ru"), "5 оценок");
assert.equal(ratingsLabel(11, "ru"), "11 оценок");
assert.equal(ratingsLabel(12, "ru"), "12 оценок");
assert.equal(ratingsLabel(21, "ru"), "21 оценка");
assert.equal(ratingsLabel(22, "ru"), "22 оценки");

console.log("recipe-rating: ok");
