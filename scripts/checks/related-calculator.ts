// Potrivirea știre -> calculator (src/lib/content/related-calculator.ts).
// npx tsx scripts/checks/related-calculator.ts
import assert from "node:assert";
import { matchCalculator } from "../../src/lib/content/related-calculator";

assert.equal(matchCalculator("SFS: Cum și până când se achită taxa pentru folosirea drumurilor pentru 2026"), "taxa-drum");
assert.equal(matchCalculator("Salariul minim crește la 6.300 de lei din ianuarie"), "salariu-net");
assert.equal(matchCalculator("Indemnizația de maternitate se majorează"), "concediu-maternitate");
assert.equal(matchCalculator("CNAS: cum se plătește concediul medical"), "concediu-medical");
assert.equal(matchCalculator("Cursul BNM: leul se depreciază față de euro"), "convertor-valutar");
assert.equal(matchCalculator("UE alocă 50 de milioane de euro pentru drumuri"), undefined);
assert.equal(matchCalculator("Accident pe traseul R13"), undefined);
assert.equal(matchCalculator("Vămuirea mașinilor aduse din UE: ce se schimbă"), "vamuire-auto");
assert.equal(matchCalculator("Impozitul pe bunurile imobiliare se achită până la 30 iunie"), "impozit-imobil");
assert.equal(matchCalculator("Indemnizația pentru creșterea copilului crește din ianuarie"), "indemnizatie-crestere-copil");
assert.equal(matchCalculator("Rata șomajului a scăzut în trimestrul II"), "indemnizatie-somaj");
console.log("related-calculator: OK");
