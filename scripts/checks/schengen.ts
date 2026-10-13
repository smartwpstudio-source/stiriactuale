// Regula 90/180 (schengenDays din src/lib/calculators.ts) + rata la credit și porțiile.
// npx tsx scripts/checks/schengen.ts
import assert from "node:assert";
import { eventPortions, loan, schengenDays } from "../../src/lib/calculators";

const C = "2026-10-14"; // fereastra: 2026-04-18 … 2026-10-14
assert.equal(schengenDays([], C)!.windowStart, "2026-04-18");

// o călătorie în fereastră: 1–10 august = 10 zile (intrarea și ieșirea se numără)
assert.deepEqual(schengenDays([{ from: "2026-08-01", to: "2026-08-10" }], C), { used: 10, remaining: 80, over: false, windowStart: "2026-04-18" });

// parțial înainte de fereastră: 10–20 aprilie -> doar 18, 19, 20 aprilie
assert.equal(schengenDays([{ from: "2026-04-10", to: "2026-04-20" }], C)!.used, 3);

// suprapuse: 1–10 și 5–15 august -> 15 zile, nu 21
assert.equal(schengenDays([{ from: "2026-08-01", to: "2026-08-10" }, { from: "2026-08-05", to: "2026-08-15" }], C)!.used, 15);

// exact 90 de zile: 17 iulie … 14 octombrie -> la limită, fără depășire
const full = schengenDays([{ from: "2026-07-17", to: "2026-10-14" }], C)!;
assert.deepEqual([full.used, full.remaining, full.over], [90, 0, false]);
const over = schengenDays([{ from: "2026-07-16", to: "2026-10-14" }], C)!;
assert.deepEqual([over.used, over.remaining, over.over], [91, 0, true]);

// după data de control nu se numără; rândurile goale sau inversate se ignoră
assert.equal(schengenDays([{ from: "2026-10-10", to: "2026-10-30" }, { from: "", to: "" }, { from: "2026-09-10", to: "2026-09-01" }], C)!.used, 5);
assert.equal(schengenDays([], ""), null);
console.log("schengen: OK");

// credit: 12 000 lei, 12%/an, 12 luni — anuitate 1066,19; descrescător 1120 … 1010
const a = loan(12000, 12, 12, "anuitate")!;
assert.equal(a.first, 1066.19);
assert.equal(a.years[0].remaining, 0);
assert.ok(Math.abs(a.total - 12794.23) < 0.01);
const d = loan(12000, 12, 12, "descrescator")!;
assert.deepEqual([d.first, d.last, d.interest], [1120, 1010, 780]);
assert.equal(loan(12000, 0, 24, "anuitate")!.interest, 0);
assert.equal(loan(12000, 12, 30, "anuitate")!.years.length, 3);
assert.equal(loan(12000, 12, 0, "anuitate"), null);
console.log("rata-credit: OK");

// porții: exemplul din ghid — 80 adulți + 10 copii mici + 5 rezervă = 90
const p = eventPortions(80, 10, 5);
assert.equal(p.portions, 90);
const it = (id: string) => p.items.find((x) => x.id === id)!;
assert.deepEqual([it("sarmale").from, it("zeama").from], [450, 27]);
assert.deepEqual([eventPortions(100, 0, 0).items.find((x) => x.id === "paine")!.from, eventPortions(100, 0, 0).items.find((x) => x.id === "paine")!.to], [8, 10]);
assert.deepEqual([it("friptura").from, it("friptura").to], [13.5, 18]);
console.log("portii-eveniment: OK");
