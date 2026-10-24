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
import { passesSelection } from "../../src/lib/pipeline/run";
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
const urgent = cand({ pushWorthy: true }, 80);
const urgentExempt = guideExempt({ pushWorthy: true, title: "Cod roșu de inundații: evacuări în nordul țării", summary: "" });
assert.ok(passesSelection(urgent) && urgentExempt);
assert.ok(finalPublish(passesSelection(urgent), "strict", none, urgentExempt));
// obișnuită care trece regulile vechi, fără ghid: cade doar în strict
const plain = cand({}, 80);
assert.ok(finalPublish(passesSelection(plain), "raport", none, false));
assert.ok(!finalPublish(passesSelection(plain), "strict", none, false));
assert.ok(finalPublish(passesSelection(plain), "strict", found, false));
// linkurile editorului nu trec prin selecția automată (și nici prin regula ghidului)
assert.ok(!passesSelection(cand({}, 80, true)));
// sensitive nu e o poartă: nu schimbă nimic
assert.equal(passesSelection(cand({ sensitive: true }, 80)), true);

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

console.log("guide-rule: OK");
process.exit(0);
