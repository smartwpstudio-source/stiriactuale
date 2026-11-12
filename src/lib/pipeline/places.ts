import { readFileSync } from "node:fs";
import path from "node:path";
import { HAIKU_MODEL, structured } from "./llm";
import { stripDiacritics } from "./text-normalize";
import { and, desc, ilike, isNotNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { articles } from "./db/schema";

// Arhiva de locuri reale din Moldova (Aeroportul Chișinău, vama Leușeni,
// Parlamentul, Nistrul…): poze Wikimedia Commons cu licență liberă, semnate cu
// autorul (scripts/locuri/import.ts). Când știrea e despre un loc din arhivă,
// poza reală a locului bate orice poză de stoc.
export interface Place {
  id: string;
  name: string;
  keywords: string;
  locality?: string; // clădirile din raioane: doar la știrile din acel raion
  photos: { url: string; credit: string; source: string; alt?: string }[];
}

const readPlaces = (file: string): Place[] => {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "content", "locuri", file), "utf8"));
  } catch {
    return [];
  }
};

// + ilustrațiile-simbol desenate pe teme (public/simbol/, 2026-10-14): 3 variante
// pe temă, rotite ca pozele locurilor; înaintea stocului și a AI-ului
export function loadPlaces(): Place[] {
  return [...readPlaces("locuri.json"), ...readPlaces("simbol.json")];
}

// Pozele marcate „Imagine simbol” (regula proprietarului, 2026-10-07; extinsă
// 2026-10-13): oricine le-a pus — la adăugarea linkului, din pagina articolului
// în admin sau refolosite de pipeline — intră în arhivă ca teme ilustrative și
// se refolosesc la alte știri pe același subiect, ÎNAINTE de stoc / AI.
// Pozele pe aceeași temă (aceeași descriere a editorului, sau foarte apropiată)
// formează un singur loc cu mai multe poze, ca pickRotated să le rotească.
// ponytail: ultimele 300; o arhivă separată pe teme dacă devin sute.
// Cardul-simbol după temă, când nu rămâne nicio poză: fără imagine rămăseseră moldoveanul
// condamnat la Moscova și minorii pe ATV (2026-11-03). Varianta nefolosită recent. Fără temă
// potrivită, null: un card luat „la nimereală” e fals (actele de identitate la judocana
// Alexandra Chiron, Guvernul la orice știre).
const TOPIC_CARDS: Record<string, string> = {
  criminal: "ilustratie-politia",
  coruptie: "ilustratie-politia",
  accidente: "ilustratie-accident-rutier",
  "alerta-112": "ilustratie-urgenta-112",
  sanatate: "ilustratie-spital-sanatate",
  "criza-energetica": "ilustratie-factura-curent",
  economic: "ilustratie-preturi-scumpiri",
  social: "ilustratie-pensii-salarii",
  sport: "card-sport",
};
const SPORT_CARDS: [RegExp, string][] = [
  [/judo|judocan/i, "card-judo"],
  [/lupte|luptator|luptatoare/i, "card-lupte"],
  [/\bbox\b|boxer/i, "card-box"],
  [/fotbal/i, "card-fotbal"],
  [/atletism|atlet/i, "card-atletism"],
  [/haltere|halterofil/i, "card-haltere"],
];
// subiectul spune tema și când clasificatorul n-a dat-o (Util n-are teme deloc)
const SUBJECT_CARDS: [RegExp, string][] = [
  [/compensati|compensar|despagubir/i, "card-compensatii"], // nu „medicamente compensate”
  [/primar\w* (general|chisinaului|capitalei)|primari\w* (municipiului )?chisinau|\bceban\b|consiliul municipal/i, "card-primaria-chisinau"],
  // școala, colegiul, universitatea: educație, nu „industrie” sau „agricultură” (colegiul agroindustrial
  // din Ungheni, 2026-11-12); lângă o tragedie (elev lovit, copil dispărut) nu se pune
  [/^(?!.*(a murit|au murit|deced\w*|mortal\w*|lovit\w*|accident\w*|agres\w*|violat\w*|ucis\w*|disparut\w*|spitaliz\w*|intoxica\w*|inec\w*|batut\w*|bataie))(?=.*(\bscoal|\bliceu|gimnazi|gradinit|\bcolegiu|\bcolegiile|\bcolegiilor|universit|\belev|\bstudent|\bprofesor|invatamant|educati|bacalaureat|ministerul educatiei|an\w* de studii))/i, "card-educatie"],
  // producția, fabricile, industria: economie (editorul, 2026-11-12: producția de rachete
  // antigrindină primise „Război”, apoi „Agricultură”)
  [/antigrindin|produc\w* (de )?rachet|\bfabric(a|i|ii|ile|ilor)\b|\buzin\w*|\bindustri\w*|parc\w* industrial|zon\w* economic\w* liber|linie de productie|capacitat\w* de productie/i, "card-industrie"],
  // producția de rachete e economie, nu război
  [/^(?!.*(produc|fabric)\w* (de )?rachet)(?=.*(razboi|bombard|rachet|atac (rusesc|aerian|cu drone)))/i, "card-razboi"],
  // drona căzută, survolul: cardul dronei; atacul cu drone rămâne la Război (regula de deasupra)
  [/\bdron|aerostat|\bbalo(n|ane)\b|spatiul aerian|survol/i, "card-drona"],
  [/violent\w* (in|din) familie|violenta domestica|ordin\w* de protectie|agresor/i, "card-violenta-familie"],
  [/plat\w* (cu|pe) card|card\w* bancar|cont\w* bancar|bancomat|tranzacti/i, "card-bani-card"],
  // apa oprită nu e „pensii și salarii” (Hulboaca, 2026-11-10)
  [/fara apa|apa potabil|apa-canal|apeduct|canalizar|furnizar\w* (a )?apei|sistar\w* (a )?apei|retel\w* de apa/i, "card-apa"],
  [/carburant|benzin|motorin|\bgpl\b|la pompa/i, "card-carburanti"],
  [/masin|\bauto\b|permis\w* de conducere|inmatricul|\bvin\b|\brca\b/i, "card-auto"],
  [/aeroport|\bzbor|avion|pasageri/i, "card-aeroport"],
  [/locuri de munca|\bjobur|angajator|somaj|anofm/i, "card-munca"],
  [/pan\w* de curent|fara curent|energetic|energie|electricitat/i, "card-energie"],
];
const SECTION_CARDS: Record<string, string> = { diaspora: "card-diaspora", international: "card-diplomatie" };
// Crima e fapta, justiția e consecința (editorul, 2026-11-05: alertele false cu bombă primiseră
// „Instanța de judecată”): cardul Justiție doar când știrea chiar vorbește despre asta.
const COURT = /instant[ae]|judecat|\bproces(ul|e)?\b|procuror|procuratur|sentint|condamn|arest|\bcna\b|dosar penal/i;
export function fallbackCard(topics: string[], section: string, places: Place[], recent: string[], subject = "") {
  const plain = stripDiacritics(subject);
  const sport = topics.includes("sport") ? SPORT_CARDS.find(([re]) => re.test(plain))?.[1] : undefined;
  // pietonul lovit nu e „două mașini ciocnite” (Stăuceni, 2026-11-05)
  const pedestrian = topics.includes("accidente") && /pieton/i.test(plain) ? "card-pieton" : undefined;
  const court = (topics.includes("criminal") || topics.includes("coruptie")) && COURT.test(plain) ? "card-justitie" : undefined;
  // mașinile ciocnite rămân la ilustrația accidentului, nu la „Mașini și acte auto”
  const bySubject = SUBJECT_CARDS.find(([re, id]) => re.test(plain) && !(id === "card-auto" && topics.includes("accidente")))?.[1];
  const id = sport ?? pedestrian ?? court ?? bySubject ?? topics.map((t) => TOPIC_CARDS[t]).find(Boolean) ?? SECTION_CARDS[section];
  const photos = places.find((p) => p.id === id)?.photos ?? [];
  const photo = photos.find((p) => !recent.includes(p.url)) ?? photos[0];
  return photo ? { url: photo.url, resourceId: null, credit: photo.credit, alt: photo.alt } : null;
}

// Doar cardul spus de subiect (carburanți, compensații, drone...): bate sigla instituției, pentru că
// coperta spune despre ce e știrea (editorul, 2026-11-12: prețurile ANRE la benzină primiseră
// „ANRE: Anunț oficial” în loc de panoul cu prețuri)
export function subjectCard(places: Place[], recent: string[], subject: string) {
  const plain = stripDiacritics(subject);
  const id = SUBJECT_CARDS.find(([re, id]) => re.test(plain) && id !== "card-auto")?.[1];
  const photos = places.find((p) => p.id === id)?.photos ?? [];
  const photo = photos.find((p) => !recent.includes(p.url)) ?? photos[0];
  return photo ? { url: photo.url, resourceId: null, credit: photo.credit, alt: photo.alt } : null;
}

// Alegerile primesc urna de vot oriunde ar fi (editorul, 2026-11-12): bașcanul Găgăuziei, localele
// din raioane, parlamentarele. Bate și cardul regiunii, și locul; „votarea unei legi” nu e alegeri.
const ELECTIONS = /alegeri|scrutin|referendum|sectii\w* de votare|buletin\w* de vot|campani\w* electoral|comisi\w* electoral|\bcec\b|prezent\w* la vot|turul (i|ii|1|2|doi|unu|al doilea)\b|candidat\w* (la|pentru) (functia|postul|fotoliul) de (primar|bascan|presedinte|deputat)/i;
export function electionCard(places: Place[], recent: string[], subject: string) {
  if (!ELECTIONS.test(stripDiacritics(subject))) return null;
  const photos = places.find((p) => p.id === "card-alegeri")?.photos ?? [];
  const photo = photos.find((p) => !recent.includes(p.url)) ?? photos[0];
  return photo ? { url: photo.url, resourceId: null, credit: photo.credit, alt: photo.alt } : null;
}

// Cardurile noi sunt în repo înainte să fie pe site (până la deploy): fără verificare, articolul
// rămânea fără poză (colegiul din Ungheni, 2026-11-12). Se păstrează doar pozele care răspund.
export async function onlyLive(places: Place[]): Promise<Place[]> {
  const ok = new Map<string, Promise<boolean>>();
  const live = (url: string) => {
    if (!url.startsWith("https://stiriactuale.info/simbol/")) return Promise.resolve(true);
    if (!ok.has(url)) ok.set(url, fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10_000) }).then((r) => r.ok).catch(() => true));
    return ok.get(url)!;
  };
  const checked = await Promise.all(
    places.map(async (p) => ({ ...p, photos: (await Promise.all(p.photos.map(async (ph) => ((await live(ph.url)) ? ph : null)))).filter((ph) => ph !== null) })),
  );
  return checked.filter((p) => p.photos.length);
}

export interface SymbolRow {
  id: number;
  title: string;
  alt: string | null;
  url: string | null;
}

const words = (s: string) =>
  new Set(
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3)
      .map((w) => w.slice(0, 5)),
  );

// aceeași temă: descrieri cu cel puțin jumătate din cuvinte comune (rădăcini de 5 litere)
export function sameTheme(a: string, b: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return false;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.min(wa.size, wb.size) >= 0.5 && common / Math.max(wa.size, wb.size) >= 0.34;
}

export function groupSymbolPhotos(rows: SymbolRow[]): Place[] {
  const seen = new Set<string>();
  const groups: { theme: string; ids: number[]; titles: string[]; photos: Place["photos"] }[] = [];
  for (const r of rows) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    // fără descriere, tema e titlul articolului (rămâne de obicei singură)
    const theme = r.alt?.trim() || r.title;
    const g = r.alt?.trim() ? groups.find((x) => sameTheme(x.theme, theme)) : undefined;
    const photo = { url: r.url, credit: "Imagine simbol", source: "", alt: r.alt ?? undefined };
    if (g) {
      g.photos.push(photo);
      g.ids.push(r.id);
      if (g.titles.length < 3) g.titles.push(r.title);
    } else groups.push({ theme, ids: [r.id], titles: [r.title], photos: [photo] });
  }
  return groups.map((g) => ({
    id: `simbol-${g.ids[0]}`,
    name: `TEMĂ (poză simbol): ${g.theme}`,
    keywords: g.titles.join(" / "),
    photos: g.photos,
  }));
}

export async function loadSymbolPhotos(): Promise<Place[]> {
  const rows = await getDb()
    .select({ id: articles.id, title: articles.title, alt: articles.imageAltText, url: articles.imageUrl })
    .from(articles)
    .where(and(ilike(articles.imageCredit, "%simbol%"), isNotNull(articles.imageUrl)))
    .orderBy(desc(articles.publishedAt))
    .limit(300);
  return groupSymbolPhotos(rows);
}

// Rotație: `recent` = pozele ultimelor articole, cele mai noi primele. Se
// alege poza locului folosită cel mai demult (sau niciodată); dacă toate au
// apărut în ultimele NEIGHBOURS articole, nu se folosește locul — altfel două
// știri diferite stau alăturate cu aceeași poză (2026-10-04). Lista se
// actualizează pe loc, ca rulările paralele să nu aleagă aceeași poză.
const NEIGHBOURS = 12;

export function pickRotated<P extends { url: string }>(photos: P[], recent: string[]): P | null {
  const age = (url: string) => {
    const i = recent.indexOf(url);
    return i < 0 ? Infinity : i;
  };
  const best = [...photos].sort((a, b) => age(b.url) - age(a.url))[0];
  if (!best || age(best.url) < NEIGHBOURS) return null;
  recent.unshift(best.url);
  return best;
}

export async function matchPlacePhoto(
  subject: string,
  all: Place[],
  locality: string | undefined,
  recent: string[],
): Promise<{ url: string; credit: string; alt?: string } | null> {
  const places = all.filter((p) => !p.locality || p.locality === locality);
  if (!places.length) return null;
  try {
    const { match } = await structured<{ match: number }>({
      model: HAIKU_MODEL,
      system:
        "Alegi poza pentru o știre; poza trebuie să arate SUBIECTUL PRINCIPAL. Lista are două feluri de intrări. (1) LOCURI și INSTITUȚII reale (Aeroportul Chișinău, Parlamentul, vama Leușeni, spitalul din Fălești): le alegi doar dacă subiectul principal ESTE acel loc sau acea instituție (zborurile de pe aeroport, o decizie a Parlamentului, cozile la vamă); locul unde s-a întâmplat un accident sau un incendiu NU e subiectul. (2) TEME ilustrative (accident rutier, incendiu, pompieri, poliție, ambulanță, vreme, bani, prețuri, vot, grafice de avertizare, escrocherie): le alegi când știrea e despre acel tip de întâmplare (orice accident rutier -> accident rutier, dar pieton lovit de mașină, autobuz sau camion -> Accident cu pieton; ninsoarea -> ninsoare). Graficele de avertizare (cod galben/portocaliu/roșu) doar dacă știrea E acea avertizare, cu același cod și fenomen. (3) CARDURI de instituție sau regiune (Guvernul, Parlamentul, Președinția, Transnistria, Găgăuzia, Alegeri, Uniunea Europeană, Justiție, Diplomație, Primăria Chișinău, Banca Națională, Apărare, Ucraina, Diaspora): le alegi când CONTEXTUL PRINCIPAL al știrii e acea instituție sau regiune — declarațiile, cererile, deciziile, vizitele liderilor ei. Contextul bate obiectul: liderul de la Tiraspol cere gaz -> Transnistria, nu factura la gaz; Guvernul aprobă o lege -> Guvernul; candidații la bașcan -> Alegeri; premierul în vizită la Kiev -> Ucraina sau Diplomație. Accidentele, crimele, vremea și prețurile rămân la temele lor din (2), chiar dacă s-au întâmplat în Găgăuzia sau Transnistria. Atacurile, bombardamentele, dronele și rachetele de luptă -> Război (nu Ucraina, care e pentru relațiile cu Ucraina); producția (de rachete antigrindină sau altceva), fabricile, uzinele și industria -> Producție și industrie. Pana de curent, aprovizionarea cu energie -> Energie (facturile rămân la ilustrațiile cu factura). Plățile cu cardul, conturile, tranzacțiile -> Bani și carduri (escrocheriile rămân la escrocherii). Mașinile, actele auto, permisul -> Mașini și acte auto. Violența în familie -> Violență în familie. Joburile, angajatorii, șomajul -> Locuri de muncă. Zborurile, aeroporturile, pasagerii avioanelor -> Aeroport și zboruri. Pietonul lovit -> Accident cu pieton. Compensațiile (la gaz, curent, încălzire, zboruri, plăți compensatorii) -> Compensații. Dronele și baloanele din spațiul aerian al Moldovei, dronele căzute sau găsite -> Drone (atacurile cu drone asupra altor țări rămân la Război). Prețurile la benzină, motorină, GPL, benzinăriile -> Carburanți. Apa oprită, rețelele de apă și canalizare -> Apă și canalizare. (4) SPORT (Lupte, Judo, Box, Fotbal, Atletism, Haltere, Sport): orice știre despre sportivi, medalii, meciuri, campionate primește cardul sportului ei (lupte libere sau greco-romane -> Lupte); alt sport decât cele din listă -> Sport. Drona, racheta, obiectele care nu sunt în listă: -1 (se caută altă poză). În caz de dubiu: -1.",
      prompt: `Știrea: ${subject}\n\nLocuri:\n${places.map((p, i) => `${i}. ${p.name} (${p.keywords})`).join("\n")}`,
      schema: { type: "object", properties: { match: { type: "integer" } }, required: ["match"] },
      maxBudgetUsd: 0.05,
    });
    const p = pickRotated(places[match]?.photos ?? [], recent);
    return p && { url: p.url, credit: p.credit, alt: p.alt };
  } catch {
    return null;
  }
}
