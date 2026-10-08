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
    assert.equal(matchDossier("Parcul auto în Moldova, peste 1,35 milioane: lege nouă pentru trafic"), "masina-in-moldova-ghidul-complet-al-soferului");
    assert.equal(matchDossier("Inspecția tehnică se va face doar la stații digitalizate"), "inspectia-tehnica-periodica-a-masinii-in-moldova");
    assert.equal(matchDossier("Accident la Orhei: șoferul a pierdut controlul"), undefined);
    assert.equal(matchDossier("Accident rutier în lanț pe strada Calea Ieșilor: trei mașini avariate"), "accidentul-usor-constatare-amiabila-si-rca");
    assert.equal(matchDossier("Accident rutier mortal la Strășeni: un tânăr a murit"), undefined);
    assert.equal(matchDossier("Judecătoria Chișinău a amânat ședința de judecată în dosarul fostului primar"), "instanta-de-judecata-in-moldova-ghid-practic");
    assert.equal(matchDossier("Poșta Moldovei suspendă trimiterile către Australia"), "posta-moldovei-servicii-tarife-urmarire-colete");
    assert.equal(matchDossier("Poșta Română scumpește timbrele de la 1 noiembrie"), undefined);
    assert.equal(matchDossier("Trenul Chișinău–București va circula zilnic din decembrie"), "calea-ferata-din-moldova-trenuri-rute-bilete");
    assert.equal(matchDossier("Un tren de marfă a deraiat în Germania"), undefined);
    assert.equal(matchDossier("APP a scos la licitație Hotelul Zarea"), "intreprinderile-de-stat-din-moldova");
    assert.equal(matchDossier("Î.S. „Fabrica de Sticlă” nu a atras niciun investitor"), "intreprinderile-de-stat-din-moldova");
    assert.equal(matchDossier("Moldovagaz, compania cu capital de stat minoritar"), "moldovagaz-si-datoriile-la-gaz");
    assert.equal(matchDossier("Privatizarea apartamentului: ce acte îți trebuie"), undefined);
    assert.equal(matchDossier("Apple lansează o nouă versiune a App Store"), undefined);
    assert.equal(matchDossier("Centrala termoelectrică din Iași va fi modernizată"), undefined);
    assert.equal(matchDossier("Armata Națională: 1.200 de recruți vor fi încorporați în primăvară"), "armata-nationala-a-moldovei-ghid-complet");
    assert.equal(matchDossier("Moldovenii plecați peste hotare trebuie să predea livretul militar"), "armata-nationala-a-moldovei-ghid-complet");
    assert.equal(matchDossier("Ministerul Apărării anunță exerciții cu participarea militarilor moldoveni"), "armata-nationala-a-moldovei-ghid-complet");
    assert.equal(matchDossier("Rusia a mobilizat încă 300.000 de rezerviști"), undefined);
    assert.equal(matchDossier("Israelul cheamă rezerviști, militarii intră în Gaza"), undefined);
    assert.equal(matchDossier("Ministerul Apărării Naționale de la București cumpără avioane"), undefined);
    console.log("impact: OK");
  });
});
