// Verificarea cifrelor din blocul „Ce înseamnă pentru tine”: npx tsx scripts/checks/impact.ts
import assert from "node:assert/strict";
import { numbersInSource, validateImpact } from "../../src/lib/impact";

const src = "ANRE: benzina A95 nu va depăși 34,22 lei, motorina 35,42 lei, din 8 octombrie. Plafonul de 1 500 lei rămâne.";
assert.ok(numbersInSource("Benzina: maximum 34,22 lei din 8 octombrie", src));
assert.ok(numbersInSource("plafon 1500 lei", src)); // spațiul de mii nu contează
assert.ok(numbersInSource("34.22 lei", src)); // virgulă sau punct
assert.ok(!numbersInSource("scade cu 16 bani", src)); // cifră care nu e în sursă
const ok = { tip: "bani", cine: "șoferii", ce: "Benzina A95 costă cel mult 34,22 lei", pasi: ["Compară prețurile"], unelte: ["calc:x", "ghid:inventat"] };
assert.deepEqual(validateImpact(ok, src, ["calc:x"])?.unelte, ["calc:x"]); // doar unelte din listă
assert.equal(validateImpact({ ...ok, ce: "costă 40 lei" }, src, []), null);
assert.equal(validateImpact({ ...ok, tip: "altceva" }, src, []), null);
assert.equal(validateImpact({ ...ok, pasi: [] }, src, []), null);
import("../../src/lib/content/guide-country").then(({ guideCountry }) => {
  assert.equal(guideCountry("permesso-di-soggiorno-pentru-moldoveni-italia"), "italia");
  assert.equal(guideCountry("munca-si-sederea-in-regatul-unit-pentru-moldovenii-cu-cetatenie-romana"), "regatul-unit");
  assert.equal(guideCountry("cetatenia-romana-pentru-moldoveni-dosar-juramant-pasaport"), "romania");
  assert.equal(guideCountry("moldovenii-in-sua-ambasada-washington-pasaport-procura"), "sua");
  assert.equal(guideCountry("viza-de-turist-pentru-rudele-din-moldova-sua-canada-regatul-unit"), null);
  assert.equal(guideCountry("permis-conducere-moldovenesc-in-italia-germania-si-ue"), null);
  assert.equal(guideCountry("apostila-acte-moldovenesti"), null);
  return import("../../src/lib/content/related-dossier").then(({ matchDossier }) => {
    assert.equal(matchDossier("Aderarea la UE fără drept de veto: cum reacționează partidele"), "aderarea-moldovei-la-ue-etape-si-calendar");
    assert.equal(matchDossier("Trupele ruse din Transnistria: Ambasada Rusiei susține că UE le-a acceptat"), "transnistria-situatia-regiunii-si-impactul");
    assert.equal(matchDossier("Ignăței, Rezina: un fermier vinde roșii la 5 lei"), undefined);
    assert.equal(matchDossier("Pensionarii vor primi un supliment în decembrie"), "pensiile-in-moldova-tot-ce-trebuie-sa-stii");
    assert.equal(matchDossier("Pensiunile din Bucovina, pline de turiști"), undefined);
    assert.equal(matchDossier("Șofer prins beat la volan pe traseul Chișinău–Orhei"), "alcoolul-la-volan-limite-si-sanctiuni");
    assert.equal(matchDossier("Poliția amendează șoferii care vorbesc cu telefonul la volan"), "reguli-de-circulatie-incalcate-des-si-amenzile");
    assert.equal(matchDossier("ANSA a aplicat amenzi de 50.000 de lei la piața centrală"), "amenzile-in-moldova-cine-te-poate-amenda-si-cum-contesti");
    assert.equal(matchDossier("Examenul teoretic auto se schimbă de la 1 ianuarie"), "cum-obtii-permisul-de-conducere-in-moldova-pas-cu-pas");
    console.log("impact: OK");
  });
});
