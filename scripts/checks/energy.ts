// Factura la gaz / curent, costul încălzirii și caloriile (src/lib/calculators.ts),
// cu câte un caz calculat de mână pe tarifele ANRE din ENERGY.
// npx tsx scripts/checks/energy.ts
import assert from "node:assert/strict";
import { applianceUse, calories, gasBill, heatingCost, powerBill } from "../../src/lib/calculators";
import { matchCalculator } from "../../src/lib/content/related-calculator";

// gaz: 50 m³ × 24,202 = 1 210,10 lei; TVA 8% = 96,81; total 1 306,91
assert.deepEqual(gasBill(50), { m3: 50, net: 1210.1, vat: 96.81, total: 1306.91 });

// curent: 100 kWh × 3,56 (Premier) = 356; FEE Nord zi/noapte: 100 × 4,11 + 50 × 3,43 = 582,50
assert.equal(powerBill("premier", 100, null).total, 356);
assert.deepEqual(powerBill("fee-nord", 100, 50), { kwh: 150, total: 582.5 });
// boiler 2000 W × 3 h × 30 zile = 180 kWh × 3,56 = 640,80
assert.deepEqual(applianceUse(2000, 3, 30, 3.56), { kwh: 180, lei: 640.8 });

// încălzire: 60 m² × 120 kWh/m² × 6/6 luni = 7 200 kWh
const h = heatingCost({ area: 60, needKwhM2: 120, months: 6, heat: "termoelectrica", power: "premier", woodLeiM3: 1000, pelletLeiT: NaN });
const o = (id: string) => h.options.find((x) => x.id === id)!;
assert.equal(h.need, 7200);
assert.equal(o("gaz").qty, 860.22); // 7200 / (9,3 × 0,9)
assert.equal(o("gaz").lei, 22484.43); // 860,215 × 24,202 = 20 818,92 + TVA 1 665,51
assert.equal(o("termoficare").qty, 6.19); // 7200 / 1163
assert.equal(o("termoficare").lei, 20287.53); // 6,19089 × 3277
assert.equal(o("curent").lei, 25632); // 7200 × 3,56
assert.equal(o("lemne").lei, 6923.08); // 7200 / (1600 × 0,65) = 6,923 m³ × 1000
assert.equal(o("peleti").lei, null); // fără preț introdus
assert.equal(heatingCost({ area: 60, needKwhM2: 120, months: 3, heat: "cet-nord", power: "fee-nord", woodLeiM3: 0, pelletLeiT: 0 }).need, 3600);

// calorii: femeie 35 ani, 70 kg, 168 cm: 700 + 1050 − 175 − 161 = 1414; × 1,375 = 1944
assert.deepEqual(calories("f", 35, 70, 168, "usor"), { bmr: 1414, maintain: 1944, lose: 1444, gain: 2444, floor: 1200 });
// bărbat 30 ani, 80 kg, 180 cm, sedentar: 800 + 1125 − 150 + 5 = 1780; × 1,2 = 2136 -> slăbit 1636
assert.equal(calories("m", 30, 80, 180, "sedentar")!.lose, 1636);
// minimul: femeie 70 ani, 45 kg, 150 cm, sedentar: 450 + 937,5 − 350 − 161 = 876,5 × 1,2 = 1052 -> sub 1200, rămâne 1052
assert.equal(calories("f", 70, 45, 150, "sedentar")!.lose, 1052);
assert.equal(calories("f", 0, 70, 168, "usor"), null);

// știre -> calculator
assert.equal(matchCalculator("Cum verifici factura la gaz din octombrie"), "factura-gaz");
assert.equal(matchCalculator("ANRE: tariful la energia electrică rămâne neschimbat"), "factura-curent");
assert.equal(matchCalculator("Termoelectrica: cât costă o Gcal din 1 octombrie"), "cost-incalzire");
assert.equal(matchCalculator("Sezonul de încălzire începe în Chișinău"), "cost-incalzire");
assert.equal(matchCalculator("Dieta mediteraneană: câte calorii are o porție"), "calorii");
assert.equal(matchCalculator("Încălzirea globală afectează recolta"), undefined);
console.log("energy, calorii: OK");
