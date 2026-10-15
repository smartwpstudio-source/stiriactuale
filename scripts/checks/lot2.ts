// Calculatoarele din lotul 2 (src/lib/calculators.ts): calorifere, lemne/peleți,
// depozit, ore suplimentare, zile lucrătoare, costul drumului — câte un caz
// calculat de mână, plus potrivirea știre -> calculator.
// npx tsx scripts/checks/lot2.ts
import assert from "node:assert/strict";
import { addWorkingDays, deposit, firewood, overtimePay, radiatorPower, tripCost, workingDays } from "../../src/lib/calculators";
import { matchCalculator } from "../../src/lib/content/related-calculator";

// calorifere: 20 m² × 100 W/m² = 2 000 W; 2000 / 160 = 12,5 -> 13 elemente; centrala 2000 × 1,2 = 2,4 kW
assert.deepEqual(radiatorPower({ area: 20, ceiling: 2.7, dwelling: "apartament", insulation: "medie", corner: false, bigWindows: false, elementW: 160 }), { watts: 2000, elements: 13, boilerKw: 2.4 });
// casă slab izolată, 100 m², tavan 3 m, colț, geamuri mari: 100 × 150 × 3/2,7 × 1,15 × 1,1 = 21 083 W -> 25,3 kW
const casa = radiatorPower({ area: 100, ceiling: 3, dwelling: "casa", insulation: "slaba", corner: true, bigWindows: true, elementW: 0 });
assert.deepEqual(casa, { watts: 21083, elements: null, boilerKw: 25.3 });

// lemne/peleți: 100 m² × 160 kWh/m² = 16 000 kWh; lemne 16000 / (1600 × 0,65) = 15,38 m³ × 1000 lei;
// peleți 16000 / (4,8 × 0,85) = 3 921,6 kg = 3,92 t -> 262 de saci de 15 kg; × 4000 lei/t = 15 686,27
const f = firewood({ area: 100, needKwhM2: 160, months: 6, woodLeiM3: 1000, pelletLeiT: 4000 });
assert.deepEqual(f, { need: 16000, woodM3: 15.38, woodLei: 15384.62, pelletT: 3.92, pelletBags: 262, pelletLei: 15686.27 });
assert.equal(firewood({ area: 100, needKwhM2: 160, months: 6, woodLeiM3: NaN, pelletLeiT: 0 }).woodLei, null);

// depozit: 100 000 lei, 12%, 12 luni, la scadență: 12 000 brut, impozit 6% = 720, net 11 280
const d1 = deposit(100000, 12, 12, "scadenta", true)!;
assert.deepEqual([d1.gross, d1.tax, d1.net, d1.final, d1.effectivePct, d1.overGuarantee], [12000, 720, 11280, 111280, 12, false]);
// capitalizare lunară: dobânda netă 1% × 0,94 = 0,94% pe lună -> 100 000 × 1,0094^12 = 111 881,84
const d2 = deposit(100000, 12, 12, "lunar", true)!;
assert.equal(d2.final, 111881.84);
assert.equal(d2.effectivePct, 12.68); // (1,01^12 − 1) × 100
assert.equal(d2.rows[0].interest, 1000);
assert.equal(d2.rows[1].interest, 1009.4); // 100 940 × 1%
assert.equal(deposit(100000, 12, 12, "scadenta", false)!.final, 112000);
assert.equal(deposit(195000, 10, 12, "scadenta", true)!.overGuarantee, true); // peste 200 000 lei la o bancă
assert.equal(deposit(0, 12, 12, "lunar", true), null);

// ore suplimentare: 16 800 lei / 168 h = 100 lei/oră. 6 ore în 2 zile: 4 × 1,5 + 2 × 2 = 10 ore plătite = 1 000;
// noapte 10 h × 0,5 = 500; sărbătoare 8 h în normă: 800 (peste normă: 1 600)
assert.deepEqual(overtimePay({ hourly: 100, overtimeHours: 6, overtimeDays: 2, nightHours: 10, holidayHours: 8, holidayInNorm: true }), { first: 4, rest: 2, overtime: 1000, night: 500, holiday: 800, total: 2300 });
assert.equal(overtimePay({ hourly: 100, overtimeHours: 0, overtimeDays: 0, nightHours: 0, holidayHours: 8, holidayInNorm: false }).holiday, 1600);
assert.equal(overtimePay({ hourly: 100, overtimeHours: 3, overtimeDays: 1, nightHours: 0, holidayHours: 0, holidayInNorm: true }).overtime, 500); // 2 × 1,5 + 1 × 2

// zile lucrătoare, ianuarie 2026: 22 de zile luni–vineri − 1, 7, 8 ianuarie = 19; 6 ianuarie (ajunul) − 1 oră -> 151 h
const jan26 = workingDays("2026-01-01", "2026-01-31")!;
assert.deepEqual([jan26.calendar, jan26.work, jan26.short, jan26.hours], [31, 19, 1, 151]);
assert.deepEqual(jan26.holidays.map((h) => h.date), ["2026-01-01", "2026-01-07", "2026-01-08"]);
// mai 2026: 21 de zile luni–vineri − 1 mai = 20; 8 mai (ajunul lui 9 mai) scurtată -> 159 h
const may26 = workingDays("2026-05-01", "2026-05-31")!;
assert.deepEqual([may26.work, may26.hours], [20, 159]);
// cu transfer: ianuarie 2023 (HG nr. 963/2022): 2 ianuarie liberă, sâmbătă 28 ianuarie lucrătoare -> 22 − 1 + 1 = 22
const jan23 = workingDays("2023-01-01", "2023-01-31")!;
assert.deepEqual([jan23.work, jan23.short, jan23.hours, jan23.transfers.length], [22, 1, 175, 2]);
assert.equal(workingDays("2026-02-10", "2026-02-01"), null);
// termen: 3 zile lucrătoare după 30.12.2026 -> 31.12, (1–3 ian. libere), 4.01, 5.01
assert.equal(addWorkingDays("2026-12-30", 3), "2027-01-05");
assert.equal(addWorkingDays("2026-10-15", 0), "2026-10-15");

// drum: 450 km dus-întors = 900 km × 7 l/100 km = 63 l × 33,73 = 2 124,99 + 100 lei = 2 224,99; pe 3 persoane 741,66
assert.deepEqual(tripCost({ km: 450, roundTrip: true, lPer100: 7, price: 33.73, passengers: 3, extra: 100 }), { km: 900, liters: 63, fuel: 2124.99, total: 2224.99, perPerson: 741.66, people: 3 });
assert.equal(tripCost({ km: 100, roundTrip: false, lPer100: 10, price: NaN, passengers: 1, extra: 0 }).total, null); // GPL fără preț introdus

// știre -> calculator
assert.equal(matchCalculator("Cum se plătesc orele suplimentare în 2026"), "ore-suplimentare");
assert.equal(matchCalculator("Munca de noapte: ce adaos prevede legea"), "ore-suplimentare");
assert.equal(matchCalculator("Câte zile libere avem de Paști"), "zile-lucratoare");
assert.equal(matchCalculator("Guvernul a aprobat transferul zilelor de odihnă"), "zile-lucratoare");
assert.equal(matchCalculator("Băncile scad dobânzile la depozite"), "dobanda-depozit");
assert.equal(matchCalculator("Prețul lemnelor de foc a crescut înainte de iarnă"), "lemne-peleti");
assert.equal(matchCalculator("Peleții s-au scumpit cu 20%"), "lemne-peleti");
assert.equal(matchCalculator("Cum alegi o centrală termică pe gaz"), "putere-calorifere");
assert.equal(matchCalculator("ANRE: benzina se ieftinește de mâine"), "cost-calatorie");
assert.equal(matchCalculator("Prețul la motorină crește cu 18 bani"), "cost-calatorie");
assert.equal(matchCalculator("Salariul minim crește la 6.300 de lei din ianuarie"), "salariu-net");
assert.equal(matchCalculator("Concediul de odihnă: câte zile ai"), "concediu-odihna");
console.log("lot2: OK");
