// Formulele calculatoarelor (src/lib/calculators.ts) pe valori de test
// (nu reale — cele reale sunt în content/calculatoare/parametri.json).
// npx tsx scripts/checks/calculators.ts
import assert from "node:assert";
import { childcare, customsExcise, grossForNet, maternityPay, netSalary, propertyTax, roadTax, sickPay, unemployment, vacationPay } from "../../src/lib/calculators";

const s = {
  impozit_venit_pct: 10, scutire_personala_anuala_lei: 12000, cnam_angajat_pct: 5, cnas_angajat_pct: 5,
  salariu_minim_lei: 0, cnas_deductibil: true, cnam_deductibil: false, surse: [],
};
// 10000 brut: CNAM 500, CNAS 500, baza = 10000 - 500 - 1000 = 8500, impozit 850, net 8150
assert.deepEqual(netSalary(10000, s), { gross: 10000, cnam: 500, cnas: 500, tax: 850, net: 8150 });
assert.equal(netSalary(500, s).tax, 0); // sub scutire: fără impozit
assert.ok(Math.abs(netSalary(grossForNet(8150, s), s).net - 8150) < 0.02);

const c = { trepte: [{ stagiu_min_ani: 0, procent: 60 }, { stagiu_min_ani: 5, procent: 70 }, { stagiu_min_ani: 8, procent: 90 }], luni_baza: 6, zile_medii_luna: 20, plafon_lei: null, primele_zile_angajator: 5, surse: [] };
// fără angajator_pct: toate zilele la procentul CNAS
assert.equal(sickPay(10000, 6, 10, c).total, 3500);
// primele 5 zile angajatorul la 75%: 5 × 375 + 5 × 350
const e = sickPay(10000, 6, 10, { ...c, angajator_pct: 75 });
assert.deepEqual([e.employer, e.cnas, e.total], [1875, 1750, 3625]);
assert.equal(sickPay(10000, 9, 1, c).pct, 90);
assert.equal(sickPay(10000, 9, 1, { ...c, plafon_lei: 5000 }).daily, 225);

const m = { procent: 100, luni_baza: 12, zile_total: 126, zile_medii_luna: 30, plafon_lei: null, surse: [] };
assert.deepEqual(maternityPay(9000, m), { daily: 300, total: 37800, days: 126 });
assert.equal(maternityPay(9000, m, 140).total, 42000);
// peste pragul anual: fără scutire (12 × 40000 ≥ 360000)
assert.equal(netSalary(40000, { ...s, scutire_prag_venit_anual_lei: 360000 }).tax, 3800);
console.log("calculators: OK");

// taxa pentru drumuri pe cotele reale din parametri.json (exemplele din Codul fiscal / FISC.md)
import params from "../../content/calculatoare/parametri.json";
const cat = (id: string) => (params as { taxa_drum: { categorii: Parameters<typeof roadTax>[1][] } }).taxa_drum.categorii.find((x) => x.id === id)!;
assert.equal(roadTax(1998, cat("autoturism")).tax, 1198.8); // 1998 cm³ × 0,60
assert.equal(roadTax(2000, cat("autoturism")).tax, 1200); // pragul 2000 inclusiv la 0,60
assert.equal(roadTax(2001, cat("autoturism")).tax, 1800.9); // toată capacitatea la 0,90
assert.equal(roadTax(5001, cat("autoturism")).tax, 9001.8); // peste 5000: 1,8
assert.equal(roadTax(1800, cat("autoturism-electric")).tax, 1620); // exemplul FISC.md
assert.equal(roadTax(20, cat("semiremorca")).tax, 4500); // 225 × 20
assert.equal(roadTax(20.5, cat("semiremorca")).tax, 4500); // peste 20 t: sumă fixă
assert.equal(roadTax(3.5, cat("camion")).tax, 2250);
assert.equal(roadTax(18, cat("autobuz")).tax, 4275);
assert.equal(roadTax(0, cat("tractor")).tax, 2250);
console.log("taxa-drum: OK");

// calculatoarele noi, pe valorile reale din parametri.json
const P = params as unknown as Required<import("../../src/lib/calculators").CalcParams>;
assert.equal(vacationPay(15200, 28, P.concediu_odihna).total, 14000); // 15200/30,4 = 500 × 28
assert.equal(unemployment(10000, 11, P.somaj), null); // sub 12 luni stagiu
assert.deepEqual(unemployment(10000, 60, P.somaj), { monthly: 4000, luni: 5, total: 20000 }); // 40%, 5 luni
assert.equal(unemployment(10000, 130, P.somaj)!.luni, 7); // 10-15 ani
assert.equal(unemployment(10000, 200, P.somaj)!.luni, 9); // peste 15 ani
const cc = childcare(10000, P.crestere_copil);
assert.equal(cc[0].total, 3000 * 36); // A: 30% × 36 luni
assert.equal(cc[1].total, 6000 * 12 + 3000 * 12); // B
assert.equal(cc[2].total, 9000 * 12); // C
assert.equal(childcare(1000, P.crestere_copil)[0].etape[0].lunar, 740); // minimul
assert.equal(childcare(200000, P.crestere_copil)[2].etape[0].lunar, 78300); // plafon 87000 × 90%
console.log("calculatoare noi: OK");

// vămuirea (exemplele din Anexa nr. 2) și impozitul pe imobil
assert.equal(customsExcise("diesel", 2000, 10, 0, P.vamuire_auto).excise, 101620); // 50,81 × 2000
assert.equal(customsExcise("benzina", 1600, 8, 0, P.vamuire_auto).excise, 37888); // 23,68 × 1600
assert.equal(customsExcise("benzina", 1400, 1, 0, P.vamuire_auto).excise, 17122); // 0-2 ani: 12,23
assert.equal(customsExcise("hibrid-benzina", 1800, 5, 0, P.vamuire_auto).excise, 26419.5); // −25%
assert.equal(customsExcise("benzina", 1600, 25, 0, P.vamuire_auto).rate, 85.63); // 20+ ani
assert.equal(customsExcise("electric", 0, 3, 650000, P.vamuire_auto).total, 13000); // doar lux 2%
assert.equal(propertyTax(1000000, 0.185), 1850);
console.log("vamuire, imobil: OK");
