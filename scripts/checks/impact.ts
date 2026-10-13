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
    // Vulcănești = orașul; doar linia electrică Vulcănești–Chișinău ține de energie
    assert.equal(matchDossier("Vulcănești: un bărbat de 58 de ani, găsit mort lângă câinele său"), undefined);
    assert.equal(matchDossier("Linia Vulcănești–Chișinău a fost pusă în funcțiune"), "independenta-energetica-gaz-si-curent-moldova");
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
    const edu = "educatia-in-moldova-ghid-complet";
    assert.equal(matchDossier("Ministerul Educației a aprobat lista școlilor care vor fi reorganizate"), edu);
    assert.equal(matchDossier("Optimizarea rețelei școlare: 73 de instituții, comasate până în septembrie"), edu);
    assert.equal(matchDossier("Cadrele didactice vor primi salarii mai mari de la 1 septembrie"), edu);
    assert.equal(matchDossier("Grădinițele din Chișinău nu au locuri pentru toți copiii"), edu);
    assert.equal(matchDossier("Bacalaureat 2027: MEC a publicat calendarul probelor"), "bacalaureatul-2027-calendar-probe-contestatii");
    assert.equal(matchDossier("Admiterea la facultate: câte locuri bugetare oferă universitățile"), "admiterea-la-facultate-in-moldova-calendar-si-acte");
    assert.equal(matchDossier("Școala auto din Bălți: elevii nu mai pot susține examenul"), "cum-obtii-permisul-de-conducere-in-moldova-pas-cu-pas");
    assert.equal(matchDossier("Elevii din Franța vor purta uniformă școlară"), undefined);
    assert.equal(matchDossier("Universitatea Harvard pierde finanțarea federală"), undefined);
    assert.equal(matchDossier("Bacalaureatul în România: rezultatele de anul acesta"), undefined);
    assert.equal(matchDossier("Liftul nu funcționează: elevatorul a fost oprit"), undefined);
    assert.equal(matchDossier("Escrocii au furat 400.000 de lei de la o pensionară din Bălți"), "escrocheriile-in-moldova-cum-le-recunosti-si-ce-faci");
    assert.equal(matchDossier("Fraudă electorală: CEC verifică sesizările"), undefined);
    assert.equal(matchDossier("Dobânzile la depozite au scăzut în august"), "banii-in-familie-buget-economii-credite-ghid-complet");
    assert.equal(matchDossier("Grindina a lovit viile din raionul Cimișlia"), "calendarul-agricol-al-moldovei-ce-si-cand-semeni");
    assert.equal(matchDossier("Ger și ninsoare la Chișinău: cum circulă transportul"), undefined);
    assert.equal(matchDossier("Sute de albine au murit după stropirea unui lan de rapiță"), "stropirile-si-albinele-ce-spune-legea");
    assert.equal(matchDossier("Un copil, mușcat de un câine fără stăpân în Bălți"), "ce-faci-daca-te-musca-un-caine-rabie-maidanezi");
    assert.equal(matchDossier("Explozie de gaz într-un bloc din Chișinău"), "verificarea-gazului-si-a-cosului-de-fum-obligatii");
    assert.equal(matchDossier("Familie intoxicată cu monoxid de carbon la Soroca"), "intoxicatia-cu-monoxid-de-carbon-semne-prim-ajutor");
    assert.equal(matchDossier("Tariful de salubrizare crește la Chișinău"), "deseurile-sortare-voluminoase-tarife-salubrizare");
    assert.equal(matchDossier("Numărul turiștilor străini în Moldova a crescut cu 10%"), "moldova-turistica-ce-vizitezi-trasee-vinarii-manastiri");
    assert.equal(matchDossier("Turiștii moldoveni din Turcia, blocați la aeroport"), undefined);
    assert.equal(matchDossier("Trei morți după un incendiu la o școală din Cahul"), undefined);
    assert.equal(matchDossier("Un elev a murit lovit de o mașină în Ialoveni"), undefined);
    console.log("impact: OK");
  });
});
