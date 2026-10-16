// Calculatoarele din lotul 4 (src/lib/calculators.ts): vârsta de pensionare, amenzile rutiere, TVA,
// penalitățile de întârziere, materialele pentru renovare, RCA și Carte Verde — câte un caz calculat
// de mână (RCA și Carte Verde: sumele tipărite în anexele Hotărârii BNM nr. 198/2026); știre -> calculator.
// npx tsx scripts/checks/lot4.ts
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  CALCULATORS,
  TRAFFIC_FINES,
  fineLei,
  fiscalDailyPct,
  flooring,
  greenCard,
  latePayment,
  paint,
  rcaPremium,
  retirement,
  tiles,
  vat,
  wallpaper,
} from "../../src/lib/calculators";
import type { CalculatorSlug } from "../../src/lib/calculators";
import { T } from "../../src/components/calc/i18n";
import { matchCalculator } from "../../src/lib/content/related-calculator";

// pensia: femeia născută la 01.03.1964 împlinește 61 de ani la 01.03.2025, când (de la 1 iulie 2024) vârsta standard e 61
const w = retirement("1964-03-01", "f", false, 20);
assert.ok(w && !w.before2017);
assert.deepEqual([w.date, w.years, w.months, w.minimum, w.complete, w.longCareer, w.missingMin, w.missingComplete], ["2025-03-01", 61, 0, 15, 34, 37, 0, 14]);
// bărbatul născut la 10.05.1963: 63 de ani la 10.05.2026
const m = retirement("1963-05-10", "m", false, 0);
assert.ok(m && !m.before2017);
assert.deepEqual([m.date, m.years, m.longCareer, m.missingComplete], ["2026-05-10", 63, 39, null]);
// femeia născută la 15.01.1966: la 62 de ani și 6 luni (15.07.2028) vârsta e deja 63 -> 15.01.2029
const w2 = retirement("1966-01-15", "f", false, 0);
assert.ok(w2 && !w2.before2017);
assert.deepEqual([w2.date, w2.years, w2.months], ["2029-01-15", 63, 0]);
// cu 5 copii: minus 3 ani -> 57 de ani la 15.01.2023 (de la 1 iulie 2022: 60 − 3); stagiul complet atunci: 33 de ani
const w5 = retirement("1966-01-15", "f", true, 0);
assert.ok(w5 && !w5.before2017);
assert.deepEqual([w5.date, w5.years, w5.complete], ["2023-01-15", 57, 33]);
// ziua 31 -> ultima zi a lunii: 31.08.1964 + 61 ani și 6 luni = 28.02.2026 (vârsta din 1 iulie 2025)
const w3 = retirement("1964-08-31", "f", false, 0);
assert.ok(w3 && !w3.before2017);
assert.equal(w3.date, "2026-02-28");
assert.deepEqual(retirement("1950-01-01", "m", false, 0), { before2017: true });
assert.equal(retirement("", "m", false, 0), null);

// amenzi: 1 u.c. = 50 lei; viteza +20–40 km/h: 18–24 u.c. = 900–1 200 lei, jumătate în 3 zile lucrătoare: 450–600
const speed = TRAFFIC_FINES.find((f) => f.id === "viteza-20")!;
assert.deepEqual(fineLei(speed), { min: 900, max: 1200, halfMin: 450, halfMax: 600 });
assert.equal(fineLei(TRAFFIC_FINES.find((f) => f.id === "alcool")!).max, 50000);
assert.ok(TRAFFIC_FINES.length >= 15);
assert.equal(new Set(TRAFFIC_FINES.map((f) => f.id)).size, TRAFFIC_FINES.length);
for (const lang of ["ro", "ru"] as const) {
  for (const f of TRAFFIC_FINES) {
    assert.ok(T[lang].fines.items[f.id], `${lang}: lipsește textul pentru ${f.id}`);
    assert.equal(Boolean(f.extra), Boolean(T[lang].fines.extra[f.id]), `${lang}: sancțiunea complementară ${f.id}`);
  }
}

// TVA: 1 000 + 20% = 1 200; din 1 200 cu TVA scoți 200; din 108 cu 8% scoți 8; 99,99 -> 83,33 + 16,66
assert.deepEqual(vat(1000, 20, "adauga"), { net: 1000, tax: 200, gross: 1200 });
assert.deepEqual(vat(1200, 20, "scoate"), { net: 1000, tax: 200, gross: 1200 });
assert.deepEqual(vat(108, 8, "scoate"), { net: 100, tax: 8, gross: 108 });
assert.deepEqual(vat(99.99, 20, "scoate"), { net: 83.33, tax: 16.66, gross: 99.99 });
assert.equal(vat(0, 20, "adauga"), null);

// majorarea la impozite: 2025 — (4 + 5) / 365 = 0,0247% pe zi; 2026 — (6 + 5) / 365 = 0,0301%; 2027 — necunoscută
assert.deepEqual([fiscalDailyPct(2025), fiscalDailyPct(2026), fiscalDailyPct(2027)], [0.0247, 0.0301, null]);
// 10 000 lei, scadența 01.03.2026, plătit 31.03.2026: 30 de zile × 0,0301% = 90,30
assert.equal(latePayment(10000, "2026-03-01", "2026-03-31", "fiscal")!.total, 90.3);
// peste an: 31.12.2025 la 0,0247% + 1 și 2.01.2026 la 0,0301% = 2,47 + 6,02 = 8,49
const y = latePayment(10000, "2025-12-30", "2026-01-02", "fiscal")!;
assert.deepEqual([y.days, y.total, y.parts.length], [3, 8.49, 2]);
// dobânda civilă, consumator: 10 zile din iunie la 5 + 5 = 10% pe an și 10 zile din iulie la 7 + 5 = 12%:
// 10 000 × (0,10 × 10 + 0,12 × 10) / 365 = 27,40 + 32,88 = 60,27
const c = latePayment(10000, "2026-06-20", "2026-07-10", "consumator")!;
assert.deepEqual([c.days, c.total, c.parts.map((p) => p.rate)], [20, 60.27, [10, 12]]);
// între profesioniști: + 9 puncte -> 14% și 16%
assert.deepEqual(latePayment(10000, "2026-06-20", "2026-07-10", "profesionist")!.parts.map((p) => p.rate), [14, 16]);
// penalitatea din contract: 0,1% pe zi × 5 000 lei × 10 zile = 50
assert.equal(latePayment(5000, "2026-10-01", "2026-10-11", "contract", 0.1)!.total, 50);
// fără întârziere
assert.equal(latePayment(5000, "2026-10-01", "2026-10-01", "contract", 0.1)!.total, 0);
// înainte de 2025 nu avem rata BNM în tabel
assert.equal(latePayment(1000, "2024-12-01", "2025-01-10", "consumator")!.missing, "2024-12-02");
assert.equal(latePayment(1000, "2026-10-10", "2026-10-01", "fiscal"), null);

// vopsea: 4 × 3 m, 2,7 m înălțime: pereți 37,8 − 3,5 m² goluri + tavan 12 = 46,3 m²;
// 46,3 × 2 straturi / 10 m²/l × 1,1 = 10,19 l -> 2 găleți de 10 l
assert.deepEqual(paint({ length: 4, width: 3, height: 2.7, openings: 3.5, ceiling: true, coats: 2, m2PerL: 10, bucketL: 10, reservePct: 10 }), { area: 46.3, liters: 10.19, buckets: 2 });
// gresie: 10 m² + 10% = 11 m², placa 30 × 60 = 0,18 m² -> 61,1 -> 62 de plăci, 8 pe cutie -> 8 cutii
assert.deepEqual(tiles(10, 30, 60, 8, 10), { withReserve: 11, tile: 0.18, count: 62, boxes: 8 });
// tapet: perimetrul 14 m, înălțimea 2,7 + 10 cm = 2,8 m pe fâșie; rola 10,05 m -> 3 fâșii; 14 / 0,53 -> 27 de fâșii -> 9 role
assert.deepEqual(wallpaper(14, 2.7, 0.53, 10.05, 0, 10), { strip: 2.8, strips: 27, perRoll: 3, rolls: 9 });
// cu raport de model de 64 cm: fâșia 3,44 m -> 2 pe rolă -> 14 role
assert.equal(wallpaper(14, 2.7, 0.53, 10.05, 64, 10)!.rolls, 14);
// laminat: 20 m² + 7% = 21,4 m², pachete de 2 m² -> 11
assert.deepEqual(flooring(20, 2, 7), { withReserve: 21.4, packs: 11 });

// RCA internă: sumele din anexa nr. 2 la Hotărârea BNM nr. 198/2026
assert.equal(rcaPremium("auto-1200", "chisinau", "pf", "tanar-nou").premium, 4364.5);
assert.equal(rcaPremium("auto-1200", "chisinau", "pf", "experimentat").premium, 1217.31);
assert.equal(rcaPremium("auto-1200", "chisinau", "pj", "tanar-nou").premium, 2344.87);
assert.equal(rcaPremium("auto-1600", "alte", "pf", "experimentat").premium, 662.04);
assert.equal(rcaPremium("auto-1600", "alte", "pj", "experimentat").premium, 1275.27);
assert.equal(rcaPremium("auto-1200", "alte", "pf", "experimentat").premium, 640.22);
assert.equal(rcaPremium("taxi", "chisinau", "pf", "tanar-nou").premium, 15278.49);
assert.equal(rcaPremium("taxi", "alte", "pj", "experimentat").premium, 8035.35);
assert.equal(rcaPremium("troleibuz", "chisinau", "pj", "experimentat").premium, 19170);
assert.equal(rcaPremium("camion-3500", "chisinau", "pf", "tanar-nou").premium, 5356.44);
assert.equal(rcaPremium("moto-300", "chisinau", "pf", "tanar-nou").premium, 495.97);
assert.equal(rcaPremium("tractor-45", "chisinau", "pf", "tanar-nou").premium, 743.95);
assert.equal(rcaPremium("auto-electric", "chisinau", "pf", "tanar-nou").premium, 9869.73);
assert.equal(rcaPremium("pasageri-30+", "chisinau", "pf", "tanar-nou").premium, 16069.31);
assert.equal(rcaPremium("auto-1200", "chisinau", "pf", "experimentat").trailer, 243.46);
// Carte Verde: anexa nr. 3 (euro)
assert.equal(greenCard("zona3", "A", "12").premium, 315.84);
assert.equal(greenCard("zona3", "A", "15z").premium, 31.58);
assert.equal(greenCard("zona3", "A", "8").premium, 268.46);
assert.equal(greenCard("zona3", "C1", "8").premium, 985.32);
assert.equal(greenCard("zona3", "E2", "9").premium, 1140.05);
assert.equal(greenCard("zona1", "A", "15z").premium, 1.99);
assert.equal(greenCard("zona1", "A", "12").premium, 13.28);
assert.equal(greenCard("zona1", "C2", "15z").premium, 4.27);
assert.equal(greenCard("zona1", "E2", "9").premium, 130.03);
assert.equal(greenCard("zona1", "E1", "8").premium, 81.46);

// fiecare calculator din lot are ghidul existent și calculatoarele din „see” existente
const LOT4: CalculatorSlug[] = ["varsta-pensionare", "amenzi-rutiere", "tva", "penalitati-intarziere", "materiale-renovare", "rca-carte-verde"];
const slugs = new Set<string>(CALCULATORS.map((x) => x.slug));
const guides = new Set(readdirSync("content/ghiduri").map((f) => f.replace(/\.json$/, "")));
for (const s of LOT4) {
  const calc = CALCULATORS.find((x) => x.slug === s)!;
  assert.ok(calc, s);
  assert.ok("guide" in calc && guides.has(calc.guide), `${s}: ghid inexistent`);
  for (const x of "see" in calc ? calc.see : []) assert.ok(slugs.has(x), `${s}: see ${x}`);
  for (const lang of ["ro", "ru"] as const) {
    assert.ok(T[lang].notes.own[s], `${lang}: nota pentru ${s}`);
    assert.ok(T[lang].page.guideTexts[s], `${lang}: textul ghidului pentru ${s}`);
  }
}

// știre -> calculator
assert.equal(matchCalculator("Vârsta de pensionare a femeilor crește din 1 iulie"), "varsta-pensionare");
assert.equal(matchCalculator("CNAS: ce stagiu de cotizare îți trebuie pentru pensie"), "varsta-pensionare");
assert.equal(matchCalculator("Amenzi mai mari pentru șoferii care depășesc viteza"), "amenzi-rutiere");
assert.equal(matchCalculator("Poliția a aplicat 300 de amenzi pentru folosirea telefonului la volan"), "amenzi-rutiere");
assert.equal(matchCalculator("Câte puncte de penalizare primești pentru trecerea pe roșu"), "amenzi-rutiere");
assert.equal(matchCalculator("ANSA a amendat un magazin din Bălți"), undefined);
assert.equal(matchCalculator("Amenzi pentru arderea frunzelor"), undefined);
assert.equal(matchCalculator("Cota TVA la serviciile HoReCa rămâne 8%"), "tva");
assert.equal(matchCalculator("Firmele cer restituirea TVA mai rapidă"), "tva");
assert.equal(matchCalculator("Majorarea de întârziere la impozite în 2026"), "penalitati-intarziere");
assert.equal(matchCalculator("Ce dobândă de întârziere poate cere creditorul"), "penalitati-intarziere");
assert.equal(matchCalculator("Prețul RCA crește din octombrie"), "rca-carte-verde");
assert.equal(matchCalculator("Cartea Verde, acum doar în format digital"), "rca-carte-verde");
assert.equal(matchCalculator("Cât costă renovarea unui apartament în 2026"), "materiale-renovare");
assert.equal(matchCalculator("Renovarea școlii din Ungheni s-a încheiat"), undefined);
assert.equal(matchCalculator("Penalități pentru clubul de fotbal după meci"), undefined);

// ghidurile: niciun titlu de ghid nu primește din greșeală unul dintre calculatoarele noi
// (tarifele ANRE: „fără TVA” în descriere — anulat în GUIDE_CALCULATORS)
const expected: Record<string, string> = {
  "varsta-de-pensionare-in-moldova-calendar-femei-barbati": "varsta-pensionare",
  "cum-se-calculeaza-pensia-pentru-limita-de-varsta": "varsta-pensionare",
  "pensiile-in-moldova-tot-ce-trebuie-sa-stii": "varsta-pensionare",
  "reguli-de-circulatie-incalcate-des-si-amenzile": "amenzi-rutiere",
  "amenzi-de-circulatie-verificare-si-plata-online": "amenzi-rutiere",
  "alcoolul-la-volan-limite-si-sanctiuni": "amenzi-rutiere",
  "scaunul-auto-pentru-copii-obligatii-si-varsta": "amenzi-rutiere",
  "rca-si-cartea-verde-ce-acopera-si-cum-le-cumperi": "rca-carte-verde",
  "accidentul-usor-constatare-amiabila-si-rca": "rca-carte-verde",
  "asiguratorul-nu-plateste-despagubirea-rca-casco": "rca-carte-verde",
  "impozitele-firmei-mici-regimul-imm-4-la-suta-tva-dividende": "tva",
  "tarifele-la-gaz-energie-electrica-si-termoficare": "tva",
};
const wrong: string[] = [];
for (const f of readdirSync("content/ghiduri").filter((x) => x.endsWith(".json"))) {
  const g = JSON.parse(readFileSync(`content/ghiduri/${f}`, "utf8")) as { slug: string; title: string; description: string };
  const hit = matchCalculator(`${g.title} ${g.description}`);
  if (hit && LOT4.includes(hit as CalculatorSlug) && expected[g.slug] !== hit) wrong.push(`${g.slug} -> ${hit}`);
}
assert.deepEqual(wrong, []);
console.log("lot4: OK");
