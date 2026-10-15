// Calculatoarele din lotul 3 (src/lib/calculators.ts): IMC, sarcina, indemnizația unică la
// naștere, măsuri culinare — câte un caz calculat de mână; scalarea ingredientelor pe porții
// (recipe-client.tsx) pe rețete reale; formatarea sumelor din tabelul depozitului; știre -> calculator.
// npx tsx scripts/checks/lot3.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { birthAllowance, bmi, deposit, kitchenMeasure, pregnancy } from "../../src/lib/calculators";
import { fixed } from "../../src/components/calc/i18n";
import { scaleQty } from "../../src/components/recipe-client";
import { matchCalculator } from "../../src/lib/content/related-calculator";
import type { Recipe } from "../../src/lib/content/recipes";

// IMC: 70 / 1,75² = 22,86 -> 22,9, normal; greutatea sănătoasă 18,5 × 3,0625 = 56,7 … 24,9 × 3,0625 = 76,3
assert.deepEqual(bmi(70, 175), { value: 22.9, category: "normal", minor: false, minKg: 56.7, maxKg: 76.3 });
assert.equal(bmi(95, 170)!.category, "ob1"); // 32,9
assert.equal(bmi(45, 170)!.category, "sub"); // 15,6
assert.equal(bmi(130, 170)!.category, "ob3"); // 45,0
assert.equal(bmi(72.2, 170)!.value, 25); // 24,98 -> 25,0: supraponderal, ca în clasificarea pe o zecimală
assert.equal(bmi(72.2, 170)!.category, "supra");
assert.deepEqual([bmi(50, 160, 15)!.minor, bmi(50, 160, 15)!.category], [true, null]); // sub 18 ani: fără categorie
assert.equal(bmi(70, 0), null);

// sarcina: ultima menstruație 01.01.2026 + 280 = 08.10.2026; la 01.05.2026 — 120 de zile = 17 săpt. + 1 zi,
// trimestrul II, 160 de zile rămase; trimestrul I se încheie la +97 (08.04), II la +195 (15.07), 37 săpt. = 17.09, 42 = 22.10
assert.deepEqual(pregnancy("menstruatie", "2026-01-01", 28, "2026-05-01"), {
  due: "2026-10-08",
  weeks: 17,
  days: 1,
  trimester: 2,
  left: 160,
  milestones: { trimestrul1: "2026-04-08", trimestrul2: "2026-07-15", termen: "2026-09-17", depasire: "2026-10-22" },
});
assert.equal(pregnancy("menstruatie", "2026-01-01", 32, "2026-05-01")!.due, "2026-10-12"); // ciclu de 32 de zile: +4
assert.equal(pregnancy("conceptie", "2026-01-15", 0, "2026-05-01")!.due, "2026-10-08"); // concepția + 266
assert.equal(pregnancy("menstruatie", "2026-03-01", 28, "2026-03-20")!.trimester, 1);
assert.equal(pregnancy("menstruatie", "2026-06-01", 28, "2026-05-01"), null); // în viitor
assert.equal(pregnancy("menstruatie", "2026-01-01", 50, "2026-05-01"), null); // ciclu imposibil

// indemnizația unică: 2026 — 21 886 lei pentru fiecare copil; gemeni = 43 772; 2027 nu e aprobată
assert.deepEqual(birthAllowance(2026, 2), { perChild: 21886, children: 2, total: 43772 });
assert.equal(birthAllowance(2025, 1)!.total, 21350);
assert.equal(birthAllowance(2027, 1), null);
assert.equal(birthAllowance(2026, 0), null);

// măsuri: 1 pahar de 250 ml de făină × 0,65 g/ml = 162,5 g; 100 g de zahăr = 125 ml = 8,33 linguri;
// 1 lingură de miere = 15 × 1,4 = 21 g
assert.equal(kitchenMeasure("faina", 1, "pahar250")!.grams, 162.5);
const sugar = kitchenMeasure("zahar", 100, "g")!;
assert.equal(sugar.ml, 125);
assert.equal(sugar.units.find((u) => u.id === "lingura")!.qty, 8.33);
assert.equal(sugar.units.find((u) => u.id === "pahar250")!.qty, 0.5);
assert.equal(kitchenMeasure("miere", 1, "lingura")!.grams, 21);
assert.equal(kitchenMeasure("apa", 0, "ml"), null);

// rețeta pentru N porții: rânduri reale din content/retete
const recipe = (slug: string): Recipe => JSON.parse(readFileSync(`content/retete/${slug}.json`, "utf8"));
const qtys = (r: Recipe, n: number) => r.ingredients.flatMap((g) => g.items.map((i) => (i.qty ? scaleQty(i.qty, n / r.servings) : null)));
// tocana de porc (6 porții) -> 8 porții: 1,2 kg × 4/3 = 1,6 kg; 1 1/2 lingurițe -> 2; 1,6 l -> 2,13 ≈ „2,1”
const tocana = recipe("tocana-de-porc-cu-mamaliga");
const items = tocana.ingredients.flatMap((g) => g.items);
const at = (qty: string) => qtys(tocana, 8)[items.findIndex((i) => i.qty === qty)];
assert.equal(at("1,2"), "1,6");
assert.equal(at("1 1/2"), "2");
assert.equal(at("1,6"), "2,1");
assert.equal(at("500"), "667"); // 500 ml apă fierbinte
// ciorba de perișoare (8) -> 4: 2,5 l -> 1 1/4; 1/2 linguriță -> 1/4
const ciorba = recipe("ciorba-de-perisoare");
const ciorbaItems = ciorba.ingredients.flatMap((g) => g.items);
assert.equal(qtys(ciorba, 4)[ciorbaItems.findIndex((i) => i.qty === "2,5")], "1 1/4");
assert.equal(qtys(ciorba, 4)[ciorbaItems.findIndex((i) => i.qty === "1/2")], "1/4");
// compot (10) -> 5: intervalul 100-150 g -> 50–75
const compot = recipe("compot-de-fructe-uscate");
assert.equal(qtys(compot, 5)[compot.ingredients.flatMap((g) => g.items).findIndex((i) => i.qty === "100-150")], "50–75");
// rânduri tipice + text fără cantitate
assert.equal(scaleQty("500", 2), "1000"); // 500 g făină
assert.equal(scaleQty("1/2", 3), "1 1/2"); // 1/2 linguriță sare
assert.equal(scaleQty("1,5", 2), "3"); // 1,5 l apă
assert.equal(scaleQty("2", 1.5), "3"); // 2 ouă
assert.equal(scaleQty("după gust", 2), "după gust");
assert.equal(scaleQty("500", 1), "500");

// tabelul depozitului: sume cu exact 2 zecimale. 1 250 lei × 1% = 12,5 -> „12,50”
const dep = deposit(1250, 12, 1, "lunar", true)!;
assert.equal(fixed(dep.rows[0].interest, "ro"), "12,50");
assert.equal(fixed(dep.rows[0].tax, "ro"), "0,75");
assert.equal(fixed(100, "ro"), "100,00");

// știre -> calculator
assert.equal(matchCalculator("Câte persoane au IMC peste 30 în Moldova"), "imc");
assert.equal(matchCalculator("Obezitatea la copii, în creștere"), "imc");
assert.equal(matchCalculator("Jumătate dintre adulți sunt supraponderali"), "imc");
assert.equal(matchCalculator("Gravidele vor fi vaccinate gratuit"), "sarcina");
assert.equal(matchCalculator("Ce analize se fac în timpul sarcinii"), "sarcina");
assert.equal(matchCalculator("Cum afli data probabilă a nașterii copilului"), "sarcina");
assert.equal(matchCalculator("Data nașterii scrisă greșit în buletin"), undefined); // „data nașterii” generic
assert.equal(matchCalculator("Sarcina fiscală pentru IMM-uri crește"), undefined);
assert.equal(matchCalculator("Indemnizația unică la nașterea copilului crește în 2026"), "indemnizatie-nastere");
assert.equal(matchCalculator("Cât e indemnizația la naștere pentru gemeni"), "indemnizatie-nastere");
assert.equal(matchCalculator("Indemnizația pentru creșterea copilului crește din ianuarie"), "indemnizatie-crestere-copil");
assert.equal(matchCalculator("Indemnizația de maternitate se majorează"), "concediu-maternitate");
console.log("lot3: OK");
