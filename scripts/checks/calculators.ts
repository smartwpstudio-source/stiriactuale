// Formulele calculatoarelor (src/lib/calculators.ts) pe valori de test
// (nu reale — cele reale sunt în content/calculatoare/parametri.json).
// npx tsx scripts/checks/calculators.ts
import assert from "node:assert";
import { grossForNet, maternityPay, netSalary, sickPay } from "../../src/lib/calculators";

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
