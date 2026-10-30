// Regulile știrilor în rusă și ale push-ului automat: npx tsx scripts/checks/ru-news.ts
import assert from "node:assert/strict";
import { shouldTranslateRu, ruMismatch, numbersOf, type RuCandidate } from "../../src/lib/pipeline/ru-news";
import { shouldAutoPush } from "../../src/lib/pipeline/auto-push";
import { receives, parsePrefs, type PushPrefs } from "../../src/lib/push-segment";
import type { Impact } from "../../src/lib/impact-types";

const impact: Impact = { tip: "bani", cine: "toți", ce: "tariful crește la 15,5 lei", pasi: ["verifică factura"], unelte: [], verificat: "2026-10-11" };
const base: RuCandidate = { section: "national", kind: "stire", archived: false, impact: null, pushWorthy: false, locality: null, country: null, title: "Ședință la primărie", leadText: "Consilierii s-au întrunit.", topics: [] };
const tr = (o: Partial<RuCandidate>) => shouldTranslateRu({ ...base, ...o });

// --- traducerea în rusă: pozitive, câte una pe regulă
assert.ok(tr({ impact }), "(a) bloc de impact");
assert.ok(tr({ pushWorthy: true }), "(b) pushWorthy");
assert.ok(tr({ section: "regiuni", locality: "balti" }), "(c) Bălți");
assert.ok(tr({ section: "regiuni", locality: "gagauzia" }), "(c) Găgăuzia");
assert.ok(tr({ section: "regiuni", locality: "ceadir-lunga" }), "(c) Ceadîr-Lunga");
assert.ok(tr({ section: "regiuni", locality: "taraclia" }), "(c) Taraclia");
assert.ok(tr({ section: "regiuni", locality: "basarabeasca" }), "(c) Basarabeasca");
assert.ok(tr({ title: "Tiraspolul ridică prețul la gaz" }), "(c) Tiraspol în titlu");
assert.ok(tr({ leadText: "Autoritățile din stânga Nistrului au anunțat" }), "(c) stânga Nistrului, cu diacritice");
assert.ok(tr({ title: "Regiunea transnistreană fără apă" }), "(c) transnistreană");
assert.ok(tr({ section: "diaspora", country: "rusia" }), "(d) Rusia");
assert.ok(tr({ section: "diaspora", country: "israel" }), "(d) Israel");
assert.ok(tr({ topics: ["economic"] }), "(e) scumpiri, taxe");
assert.ok(tr({ topics: ["accidente", "criza-energetica"] }), "(e) gaz, curent");
assert.ok(tr({ topics: ["social"] }), "(e) pensii, ajutoare");
assert.ok(tr({ topics: ["sanatate"] }), "(e) medicamente");
assert.ok(tr({ kind: "util" }), "(f) articol propriu Util");
// negative
assert.ok(!tr({}), "știre obișnuită");
assert.ok(!tr({ topics: ["accidente", "criminal"] }), "accident fără temă socială");
assert.ok(!tr({ section: "international", topics: ["economic"] }), "Lumea, chiar economică");
assert.ok(!tr({ section: "regiuni", locality: "orhei" }), "Orhei");
assert.ok(!tr({ section: "diaspora", country: "italia" }), "Italia");
assert.ok(!tr({ section: "international", pushWorthy: true, impact }), "Lumea nu se traduce niciodată");
assert.ok(!tr({ kind: "pe-scurt", impact }), "pe scurt");
assert.ok(!tr({ kind: "analiza", pushWorthy: true }), "analiza");
assert.ok(!tr({ archived: true, impact }), "arhivă");

// --- verificarea traducerii: aceleași cifre și linkuri
assert.deepEqual(numbersOf("1 500 lei, 34,22 și 1.500"), numbersOf("1500 лей, 34.22 и 1 500"));
const ro = { title: "Gazul se scumpește cu 10%", lead: "Din 1 noiembrie, 15,5 lei.", bodyHtml: '<p>Vezi <a href="/ghiduri/x/">ghidul</a>, 2 500 de lei.</p>' };
const ok = { title: "Газ дорожает на 10%", lead: "С 1 ноября — 15,5 лея.", bodyHtml: '<p>См. <a href="/ghiduri/x/">справочник</a>, 2 500 леев.</p>', metaDescription: "" };
assert.equal(ruMismatch(ro, ok), null);
assert.match(ruMismatch(ro, { ...ok, title: "Газ дорожает на 12%" })!, /titlu/);
assert.match(ruMismatch(ro, { ...ok, lead: "С 1 ноября — 16 лей." })!, /text/);
assert.match(ruMismatch(ro, { ...ok, bodyHtml: '<p>См. <a href="/ru/x/">справочник</a>, 2 500 леев.</p>' })!, /linkuri/);
assert.match(ruMismatch({ ...ro, impact }, { ...ok })!, /cifre|impact/);

// --- push automat
const p = (title: string, o: Partial<RuCandidate> = {}) => shouldAutoPush({ ...base, pushWorthy: true, title, leadText: "", ...o });
// pozitive
assert.ok(p("Cod portocaliu de ger în toată țara"));
assert.ok(p("Cutremur resimțit în Chișinău"));
assert.ok(p("Legea nouă intră în vigoare de mâine: amenzi mai mari"));
assert.ok(p("ANRE a aprobat un tarif nou la gaz"));
assert.ok(p("Alertă 112: mesaj de avertizare pentru locuitorii din nord"));
assert.ok(p("Parlamentul a modificat Codul fiscal: scutirea crește de la 1 ianuarie"));
assert.ok(p("Inundații în sudul țării: oamenii, evacuați"));
assert.ok(p("Guvernul a aprobat majorarea pensiilor de la 1 aprilie"));
assert.ok(p("Accident grav pe traseul Chișinău–Hîncești: trei morți"));
// negative
assert.ok(!p("Președintele a declarat că opoziția minte"), "declarație politică");
assert.ok(!p("Accident la Orhei: un rănit"), "accident cu un rănit");
assert.ok(!p("Cod roșu de ger în România", { section: "international" }), "internațional");
assert.ok(!p("Prețul pâinii a crescut cu 2% în magazine"), "creștere de preț fără decizie");
assert.ok(!p("Deputații au discutat un proiect de modificare a legii"), "doar discuție / proiect");
assert.ok(!p("Guvernul a aprobat proiectul de lege privind pensiile"), "proiect, încă neadoptat");
assert.ok(!p("Cod portocaliu de ger în toată țara", { pushWorthy: false }), "fără pushWorthy");
assert.ok(!p("Cod portocaliu de ger în toată țara", { kind: "pe-scurt" }), "pe scurt");
assert.ok(!p("Ședință de guvern", { impact }), "impact singur nu ajunge");

assert.ok(p("Cod portocaliu de ger la Orhei", { section: "regiuni", locality: "orhei" }), "regional: trece, dar doar la segmentul lui");

// --- segmentarea push-ului: cine primește
const all: PushPrefs = { scope: "all", raion: null, country: null };
const orhei: PushPrefs = { scope: "raion", raion: "orhei", country: null };
const italia: PushPrefs = { scope: "tara", raion: null, country: "italia" };
type T = { section: string; locality: string | null; country: string | null };
const nat: T = { section: "national", locality: null, country: null };
const reg = { section: "regiuni", locality: "orhei", country: null };
const dia = { section: "diaspora", locality: null, country: "italia" };
const who = (a: T) => [all, orhei, italia].map((s) => receives(s, a));
assert.deepEqual(who(nat), [true, true, true], "național → toți");
assert.deepEqual(who(reg), [false, true, false], "Orhei → doar abonații din Orhei");
assert.deepEqual(who({ ...reg, locality: "cahul" }), [false, false, false], "Cahul fără abonați → nimeni");
assert.deepEqual(who(dia), [false, false, true], "diaspora Italia → doar Italia");
assert.deepEqual(who({ ...dia, country: "spania" }), [false, false, false], "Spania → nimeni");
assert.deepEqual(who({ section: "regiuni", locality: null, country: null }), [true, true, true], "regiuni fără raion → toți");
// validarea preferințelor din browser
assert.deepEqual(parsePrefs({ scope: "raion", raion: "orhei", country: "italia" }), orhei);
assert.deepEqual(parsePrefs({ scope: "all", raion: "orhei" }), all);
assert.equal(parsePrefs({ scope: "raion", raion: "atlantida" }), null);
assert.equal(parsePrefs({ scope: "raion", raion: "toString" }), null);
assert.equal(parsePrefs({ scope: "tara" }), null);
assert.equal(parsePrefs({ scope: "admin" }), null);

console.log("ru-news + auto-push + segmente push: OK");
