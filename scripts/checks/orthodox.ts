// Calendarul ortodox calculat (src/lib/orthodox.ts) pe date cunoscute.
// npx tsx scripts/checks/orthodox.ts
import assert from "node:assert";
import { churchDay, civilDays, fixedDate, orthodoxEaster, yearFasts } from "../../src/lib/orthodox";

const iso = (d: Date | null) => d?.toISOString().slice(0, 10);
// Paștele ortodox, date publicate
for (const [y, e] of [[2024, "2024-05-05"], [2025, "2025-04-20"], [2026, "2026-04-12"], [2027, "2027-05-02"], [2028, "2028-04-16"]] as const)
  assert.equal(iso(orthodoxEaster(y)), e, String(y));
// Crăciunul: 25 dec stil nou; stil vechi 7 ianuarie
assert.equal(iso(fixedDate(12, 25, 2026, "nou")), "2026-12-25");
assert.equal(iso(fixedDate(12, 25, 2027, "vechi")), "2027-01-07");
assert.equal(iso(fixedDate(12, 6, 2026, "vechi")), "2026-12-19"); // Sf. Nicolae pe stil vechi
assert.equal(iso(fixedDate(1, 6, 2026, "vechi")), "2026-01-19"); // Boboteaza pe stil vechi
// pe stil vechi, 7 ianuarie civil = 25 decembrie bisericesc
assert.deepEqual(churchDay(new Date(Date.UTC(2027, 0, 7)), "vechi"), { month: 12, day: 25 });
// Postul Crăciunului pe stil vechi: 28 noiembrie – 6 ianuarie
const p = yearFasts(2026, "vechi").find((f) => f.name.startsWith("Postul Nașterii"))!;
assert.deepEqual([iso(p.from), iso(p.to)], ["2026-11-28", "2027-01-06"]);
const pn = yearFasts(2026, "nou").find((f) => f.name.startsWith("Postul Nașterii"))!;
assert.deepEqual([iso(pn.from), iso(pn.to)], ["2026-11-15", "2026-12-24"]);
// Ziua Vinului: primul weekend din octombrie (2026: 3–4 oct); Ziua Mamei: prima duminică din mai
const civ = civilDays(2026);
assert.equal(iso(civ.find((d) => d.name.startsWith("Ziua Națională a Vinului"))!.date), "2026-10-03");
assert.equal(iso(civ.find((d) => d.name === "Ziua Mamei")!.date), "2026-05-03");
assert.equal(iso(civilDays(2027).find((d) => d.name === "Ziua Mamei")!.date), "2027-05-02");
console.log("orthodox: OK");
