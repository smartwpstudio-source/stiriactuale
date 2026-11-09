// Regula „știre cu ghid” (src/lib/pipeline/guide-rule.ts) și raportul din admin.
// npx tsx scripts/checks/guide-rule.ts
import assert from "node:assert/strict";
import {
  cityGuideAllowed,
  finalPublish,
  guideDecision,
  guideExempt,
  ruleMatch,
  validatePick,
  type GuideCheck,
} from "../../src/lib/pipeline/guide-rule";
import { isDeclaration, passesSelection, reviewRank } from "../../src/lib/pipeline/run";
import { fallbackCard } from "../../src/lib/pipeline/places";
import { missingGuidesReport, NO_PRACTICAL_NEED } from "../../src/lib/admin/guide-report";
import type { ScoredCandidate } from "../../src/lib/pipeline/types";

const none: GuideCheck = { tool: null, via: "niciunul" };
const found: GuideCheck = { tool: "ghid:pretul-gazului-in-moldova-tarif-si-schimbari", via: "dosar" };

// --- potrivirea existentă, fără AI
const m = (title: string, section = "national") => ruleMatch({ title, summary: "", section, topics: [] })?.tool;
assert.equal(m("ANRE a aprobat un nou tarif la gaz: prețul la gaz scade"), "ghid:pretul-gazului-in-moldova-tarif-si-schimbari");
assert.equal(m("Cursul BNM: leul se depreciază față de euro"), "calc:convertor-valutar");
assert.equal(m("Pensionarii vor primi un supliment în decembrie"), "ghid:pensiile-in-moldova-tot-ce-trebuie-sa-stii");
assert.equal(m("Sheriff a câștigat meciul cu Zimbru"), undefined);
// ghidurile doar pentru Moldova nu se leagă de știrile din străinătate
assert.equal(m("Germania: amendă pentru parcare greșită", "international"), undefined);

// --- ghidurile de raion: doar la servicii publice locale
const city = "ghid:cahul-primaria-spitalul-asp-transportul";
assert.ok(cityGuideAllowed(city, "Primăria Cahul anunță program nou la ASP"));
assert.ok(cityGuideAllowed(city, "Cahul: apa va fi sistată pe trei străzi"));
assert.ok(!cityGuideAllowed(city, "Accident pe drumul spre Cahul: un șofer a murit"));
assert.ok(!cityGuideAllowed(city, "Festival de folclor la Cahul"));
assert.ok(cityGuideAllowed("ghid:pensiile-in-moldova-tot-ce-trebuie-sa-stii", "Accident la Cahul"), "ghidurile obișnuite nu sunt afectate");

// --- răspunsul AI: id existent, altfel null
const ids = new Set(["ghid:a", "calc:salariu-net", city]);
assert.equal(validatePick("ghid:a", ids, "x"), "ghid:a");
assert.equal(validatePick("ghid:inventat", ids, "x"), null);
assert.equal(validatePick(null, ids, "x"), null);
assert.equal(validatePick(city, ids, "Incendiu la Cahul"), null);
assert.equal(validatePick(city, ids, "Spitalul raional Cahul are secție nouă"), city);

// --- scutirea: pushWorthy ȘI urgență / lege majoră (logica din auto-push.ts)
assert.ok(guideExempt({ pushWorthy: true, title: "Cod portocaliu de ploi torențiale", summary: "Meteorologii au emis avertizare" }));
assert.ok(guideExempt({ pushWorthy: true, title: "Parlamentul a adoptat legea: amenzile cresc de la 1 ianuarie", summary: "" }));
// modul „echilibrat” (2026-10-24): alertele meteo și de securitate trec și fără pushWorthy
assert.ok(guideExempt({ pushWorthy: false, title: "Cod portocaliu de ploi torențiale", summary: "" }), "alerta meteo e scutită mereu");
assert.ok(guideExempt({ pushWorthy: false, title: "O dronă cu explozibil s-a prăbușit lângă Telenești", summary: "" }), "drona e scutită");
assert.ok(!guideExempt({ pushWorthy: false, title: "Parlamentul a adoptat legea: amenzile cresc de la 1 ianuarie", summary: "" }), "legea fără pushWorthy nu e scutită");
assert.ok(!guideExempt({ pushWorthy: true, title: "Concert aniversar la Filarmonică", summary: "" }));
assert.ok(!guideExempt({ pushWorthy: true, title: "Guvernul propune un proiect de lege privind taxele", summary: "" }), "proiectul nu e lege adoptată");

// --- decizia, pe moduri
assert.deepEqual(guideDecision("raport", none, false), { publish: true, wouldReject: true });
assert.deepEqual(guideDecision("strict", none, false), { publish: false, wouldReject: true });
assert.deepEqual(guideDecision("strict", none, true), { publish: true, wouldReject: false });
assert.deepEqual(guideDecision("strict", found, false), { publish: true, wouldReject: false });
assert.deepEqual(guideDecision("strict", { ...none, error: true }, false), { publish: true, wouldReject: false }, "eroarea AI nu respinge");

// --- filtru ÎN PLUS: regulile vechi rămân, în aceeași ordine
const cand = (o: Partial<ScoredCandidate["classification"]>, qualityScore: number, manual = false): ScoredCandidate => ({
  group: { representativeTitle: "x", items: [], sourceNames: ["a"], manual, candidateIds: [] },
  classification: { section: "national", topics: [], impact: 50, factualRichness: 50, confidence: 50, reject: false, pushWorthy: false, sensitive: false, ...o },
  qualityScore,
});
// fără ghid și respinsă de regulile vechi: rămâne respinsă, în orice mod, chiar și urgentă
const rejected = cand({ reject: true }, 90);
assert.ok(!passesSelection(rejected));
assert.ok(!finalPublish(passesSelection(rejected), "raport", none, false));
assert.ok(!finalPublish(passesSelection(rejected), "strict", none, true), "scutirea nu salvează o știre respinsă");
const lowScore = cand({ pushWorthy: true }, 30); // sub pragul de 55 al secțiunii
assert.ok(!finalPublish(passesSelection(lowScore), "strict", none, true), "urgentă sub prag: tot respinsă");
// urgentă care trece regulile vechi: trece și fără ghid, și în strict
const urgent = cand({ pushWorthy: true, concreteEffect: true }, 80);
const urgentExempt = guideExempt({ pushWorthy: true, title: "Cod roșu de inundații: evacuări în nordul țării", summary: "" });
assert.ok(passesSelection(urgent) && urgentExempt);
assert.ok(finalPublish(passesSelection(urgent), "strict", none, urgentExempt));
// obișnuită care trece regulile vechi, fără ghid: cade doar în strict
const plain = cand({ concreteEffect: true }, 80);
assert.ok(finalPublish(passesSelection(plain), "raport", none, false));
assert.ok(!finalPublish(passesSelection(plain), "strict", none, false));
assert.ok(finalPublish(passesSelection(plain), "strict", found, false));
// linkurile editorului nu trec prin selecția automată (și nici prin regula ghidului)
assert.ok(!passesSelection(cand({}, 80, true)));
// sensitive nu e o poartă: nu schimbă nimic
assert.equal(passesSelection(cand({ sensitive: true, concreteEffect: true }, 80)), true);
// politica editorială (2026-11-07): ce nu schimbă nimic nu trece, oricât de mare scorul
assert.ok(!passesSelection(cand({}, 95)), "declarație națională, scor mare: nu");
assert.ok(!passesSelection(cand({ section: "international", audience: "grupuri" }, 95)), "Lumea fără efect: nu");
assert.ok(passesSelection(cand({ section: "international", concreteEffect: true }, 40)), "Lumea cu efect asupra Moldovei: da");
assert.ok(passesSelection(cand({ section: "regiuni", locality: "drochia", audience: "local" }, 20)), "accidentul din raion: da");
assert.ok(passesSelection(cand({ section: "regiuni", locality: "chisinau", audience: "pagina" }, 60)), "Chișinău peste prag: da");
assert.ok(!passesSelection(cand({ section: "regiuni", locality: "chisinau", audience: "pagina" }, 30)), "Chișinău sub prag: nu");
assert.ok(passesSelection(cand({ section: "diaspora", country: "italia" }, 50)), "diaspora: da");
assert.ok(!passesSelection(cand({ concreteEffect: true, reject: true }, 90)), "respinsă rămâne respinsă");
// declarațiile: oprite și când clasificatorul le scapă
assert.ok(isDeclaration("Găgăuzia: PSRM spune că oferta de 100 de dolari pentru votul lui Gagauz e un fals (FOTO)"));
assert.ok(isDeclaration("Moldova poate încheia negocierile de aderare la UE în 2028, spune Marta Kos (VIDEO)"));
assert.ok(isDeclaration("Tofan îl acuză pe Costiuc de minciună după intrarea în portul Giurgiulești"));
assert.ok(!isDeclaration("Pensiile mici ar putea fi indexate integral, iar cele mari mai puțin, spune Tofan"), "pensiile: efect concret");
assert.ok(!isDeclaration("ANRE propune scumpirea cu 63% a energiei de la Energocom"), "fără verb de declarație");
assert.ok(!isDeclaration("Accident la Drochia: un mort"));
assert.ok(!passesSelection({ ...cand({ concreteEffect: true, section: "regiuni", locality: "gagauzia" }, 90), group: { representativeTitle: "PSRM spune că oferta e un fals", items: [], sourceNames: ["a"], manual: false, candidateIds: [] } }), "declarația nu trece nici cu efect marcat");

// --- raportul „Ghiduri care lipsesc”
const d = (iso: string) => new Date(iso);
const r = missingGuidesReport(
  [
    { createdAt: d("2026-10-12T08:00:00Z"), title: "A1", tool: null, exempt: null, topic: "Sezonul de încălzire", rejected: false },
    { createdAt: d("2026-10-12T09:00:00Z"), title: "A2", tool: null, exempt: null, topic: "sezonul de incalzire", rejected: true },
    { createdAt: d("2026-10-12T10:00:00Z"), title: "B1", tool: null, exempt: null, topic: NO_PRACTICAL_NEED, rejected: false },
    { createdAt: d("2026-10-12T10:00:00Z"), title: "B2", tool: null, exempt: null, topic: NO_PRACTICAL_NEED, rejected: false },
    { createdAt: d("2026-10-12T10:00:00Z"), title: "B3", tool: null, exempt: null, topic: NO_PRACTICAL_NEED, rejected: false },
    { createdAt: d("2026-10-11T10:00:00Z"), title: "C", tool: null, exempt: "urgenta-lege", topic: "cod galben", rejected: false },
    { createdAt: d("2026-10-11T11:00:00Z"), title: "D", tool: "ghid:x", exempt: null, topic: null, rejected: false },
  ],
  [d("2026-10-12T08:05:00Z"), d("2026-10-11T11:05:00Z")],
);
assert.equal(r.topics.length, 2, "temele grupate fără diacritice/majuscule; scutitele nu intră");
assert.deepEqual(r.topics[0], { topic: "Sezonul de încălzire", count: 2, examples: ["A1", "A2"] });
assert.equal(r.topics[1].topic, NO_PRACTICAL_NEED, "„fără nevoie practică” la final, deși are mai multe știri");
assert.deepEqual(r.days[0], { day: "2026-10-12", published: 1, checked: 5, withoutGuide: 5, rejected: 1 });
assert.deepEqual(r.days[1], { day: "2026-10-11", published: 1, checked: 2, withoutGuide: 0, rejected: 0 });

// --- algoritmul editorului: ce schimbă ceva și știrile locale trec fără prag de scor și fără ghid
assert.ok(passesSelection(cand({ audience: "local" }, 10)), "local, scor mic: trece");
assert.ok(passesSelection(cand({ concreteEffect: true }, 10)), "schimbă ceva, scor mic: trece");
assert.ok(!passesSelection(cand({ audience: "pagina" }, 10)), "pagina, scor mic: nu trece");
assert.ok(!passesSelection(cand({ audience: "pagina" }, 80)), "pagina națională fără efect, scor mare: nu trece");
assert.ok(!passesSelection(cand({ audience: "local", reject: true }, 90)), "respinsă rămâne respinsă");
assert.equal(reviewRank("Accident la Drochia: un mort"), 2);
assert.equal(reviewRank("Prețul la motorină crește mâine"), 1);
assert.equal(reviewRank("Accident la Bălți"), 0);

// --- cardul de rezervă: tema, apoi rubrica; varianta nefolosită recent
const cardPlaces = ["card-justitie", "ilustratie-politia", "card-pieton", "ilustratie-accident-rutier", "card-razboi", "card-auto", "card-bani-card", "card-aeroport", "card-energie", "card-primaria-chisinau", "card-compensatii", "card-drona", "card-diaspora", "card-judo", "card-sport"].map((id) => ({ id, name: id, keywords: [], photos: [1, 2].map((n) => ({ url: `${id}-${n}`, credit: "Imagine simbol", source: "", alt: id })) })) as never;
assert.equal(fallbackCard(["criminal"], "international", cardPlaces, [], "Val de alerte false cu bombă la zboruri din Europa")?.url, "card-aeroport-1", "subiectul (zborurile) bate tema");
assert.equal(fallbackCard(["criminal"], "national", cardPlaces, [], "Furt dintr-un magazin din Ungheni")?.url, "ilustratie-politia-1", "fapta: fără instanță");
assert.equal(fallbackCard(["criminal"], "diaspora", cardPlaces, [], "Moldovean condamnat la Moscova")?.url, "card-justitie-1");
assert.equal(fallbackCard(["coruptie"], "national", cardPlaces, [], "Percheziții CNA la primărie")?.url, "card-justitie-1");
assert.equal(fallbackCard(["criminal"], "national", cardPlaces, [], "Tâlhărie în instanța de judecată")?.url, "card-justitie-1");
assert.equal(fallbackCard(["accidente"], "regiuni", cardPlaces, [], "Pieton mort, lovit de autobuz la Stăuceni")?.url, "card-pieton-1");
assert.equal(fallbackCard(["accidente"], "regiuni", cardPlaces, [], "Două mașini s-au ciocnit la Orhei")?.url, "ilustratie-accident-rutier-1");
assert.equal(fallbackCard([], "international", cardPlaces, [], "Atac rusesc asupra energiei Ucrainei: drone și rachete")?.url, "card-razboi-1");
assert.equal(fallbackCard([], "util", cardPlaces, [], "Seria VIN nu se potrivește cu actele: cum verifici mașina din UE")?.url, "card-auto-1");
assert.equal(fallbackCard([], "util", cardPlaces, [], "Plată pe card pe care n-ai făcut-o: cum o contești la bancă")?.url, "card-bani-card-1");
assert.equal(fallbackCard([], "util", cardPlaces, [], "Datorii la gaz și curent iarna: când poți fi deconectat")?.url, undefined, "factura nu e pană de curent");
assert.equal(fallbackCard([], "national", cardPlaces, [], "Autobuzul nou de la Bălți"), null, "autobuz nu e auto");
assert.equal(fallbackCard([], "national", cardPlaces, [], "Ceban și-a demis șefa de cabinet, care îl acuzase de presiuni")?.url, "card-primaria-chisinau-1");
assert.equal(fallbackCard([], "national", cardPlaces, [], "Ședința de guvern de miercuri"), null, "persoane fără subiect: niciun card de temă");
assert.equal(fallbackCard([], "util", cardPlaces, [], "Compensațiile la energie în sezonul rece: cine le primește")?.url, "card-compensatii-1", "compensațiile bat energia");
assert.equal(fallbackCard([], "national", cardPlaces, [], "Medicamente compensate: reguli noi la farmacie")?.url, undefined, "medicamentele compensate nu sunt compensații");
assert.equal(fallbackCard([], "national", cardPlaces, [], "Fragmente de dronă găsite la Rezina")?.url, "card-drona-1");
assert.equal(fallbackCard([], "regiuni", cardPlaces, [], "Două baloane au survolat neautorizat spațiul aerian")?.url, "card-drona-1");
assert.equal(fallbackCard([], "international", cardPlaces, [], "Atac cu drone asupra Kievului: trei morți")?.url, "card-razboi-1", "atacul rămâne la Război");
assert.equal(fallbackCard([], "diaspora", cardPlaces, ["card-diaspora-1"])?.url, "card-diaspora-2");
assert.equal(fallbackCard([], "national", cardPlaces, []), null, "fără temă: niciun card la nimereală");
assert.equal(fallbackCard(["sport"], "national", cardPlaces, [], "Judocana Alexandra Chiron, bronz")?.url, "card-judo-1");
assert.equal(fallbackCard(["sport"], "national", cardPlaces, [], "Înot: medalie")?.url, "card-sport-1");
assert.equal(fallbackCard([], "national", [], []), null);

console.log("guide-rule: OK");
process.exit(0);
