import { readFileSync } from "node:fs";
import path from "node:path";
import { HAIKU_MODEL, OPUS_MODEL, structured } from "./llm";
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
const SECTION_CARDS: Record<string, string> = { diaspora: "card-diaspora", international: "card-diplomatie" };
// Ultima plasă, după ce AI-ul n-a ales niciun card (chooseCard) și nici stocul n-a găsit poză: tema
// clasificatorului, apoi rubrica. Fără reguli pe cuvinte (editorul, 2026-11-13: „escrocheria cu banii
// pe mașină” primise „Mașini și acte”, hackerii „Energie” — contează contextul, nu un cuvânt).
export function fallbackCard(topics: string[], section: string, places: Place[], recent: string[], _subject = "") {
  const id = topics.map((t) => TOPIC_CARDS[t]).find(Boolean) ?? SECTION_CARDS[section];
  const photos = places.find((p) => p.id === id)?.photos ?? [];
  const photo = photos.find((p) => !recent.includes(p.url)) ?? photos[0];
  return photo ? { url: photo.url, resourceId: null, credit: photo.credit, alt: photo.alt } : null;
}

// Cardurile noi sunt în repo înainte să fie pe site (până la deploy): fără verificare, articolul
// rămânea fără poză (colegiul din Ungheni, 2026-11-12). Se păstrează doar pozele care răspund.
// Câte 8 verificări deodată și, la eroare sau timeout, poza NU se folosește (2026-11-17: cu ~600 de
// poze noi verificate toate deodată, cele fără răspuns la timp treceau drept publicate și articolul
// de la Drochia a rămas fără poză — biblioteca nouă intră abia la deploy).
export async function onlyLive(places: Place[]): Promise<Place[]> {
  const ok = new Map<string, Promise<boolean>>();
  let running = 0;
  const queue: (() => void)[] = [];
  const slot = () => (running < 8 ? (running++, Promise.resolve()) : new Promise<void>((r) => queue.push(r)));
  const release = () => (queue.length ? queue.shift()!() : running--);
  const head = async (url: string) => {
    await slot();
    try {
      return (await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15_000) })).ok;
    } catch {
      return false;
    } finally {
      release();
    }
  };
  const live = (url: string) => {
    if (!url.startsWith("https://stiriactuale.info/simbol/")) return Promise.resolve(true);
    if (!ok.has(url)) ok.set(url, head(url));
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
  // doar locurile reale și pozele-simbol ale editorului; cardurile și ilustrațiile le alege chooseCard
  const places = all.filter((p) => !isCard(p) && (!p.locality || p.locality === locality));
  if (!places.length) return null;
  try {
    const { match } = await structured<{ match: number }>({
      model: HAIKU_MODEL,
      system:
        "Alegi poza pentru o știre dintr-o arhivă de LOCURI și INSTITUȚII reale (Aeroportul Chișinău, Parlamentul, vama Leușeni, spitalul din Fălești) și de poze-simbol pe teme. Alegi o intrare doar dacă subiectul principal al știrii ESTE acel loc, acea instituție sau acea temă (zborurile de pe aeroport, o decizie a Parlamentului, cozile la vamă); locul unde s-a întâmplat un accident sau un incendiu NU e subiectul. În caz de dubiu: -1.",
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

const isCard = (p: Place) => p.id.startsWith("card-") || p.id.startsWith("ilustratie-");

// Știrile din Diaspora primesc cardul țării (editorul, 2026-11-21: „autocarul cu coletele
// pentru Italia a luat foc” primise cardul desenat „Incendii · Pompierii au intervenit”).
// Țara o dă clasificarea; fără card al țării sau cu pozele folosite recent -> chooseCard.
export function diasporaCard(country: string | undefined, all: Place[], recent: string[]) {
  const photo = country ? pickRotated(all.find((p) => p.id === `card-diaspora-${country}`)?.photos ?? [], recent) : null;
  return photo && { url: photo.url, resourceId: null, credit: photo.credit, alt: photo.alt };
}

// Cardul copertei îl alege AI-ul după SUBIECTUL PRINCIPAL al știrii, nu după un cuvânt din ea
// (editorul, 2026-11-13, după un șir de greșeli ale regulilor pe cuvinte). Întâi spune în câteva
// cuvinte despre ce e știrea, apoi alege; fără card potrivit, nimic (urmează stocul / AI).
export async function chooseCard(subject: string, all: Place[], recent: string[]): Promise<{ url: string; resourceId: null; credit: string; alt?: string } | null> {
  const cards = all.filter(isCard);
  if (!cards.length) return null;
  try {
    const { card } = await structured<{ subiect: string; card: string }>({
      model: OPUS_MODEL,
      system: [
        "Alegi cardul de copertă pentru o știre de pe un site din Republica Moldova. Coperta spune DESPRE CE E ȘTIREA în ansamblu: fapta, evenimentul sau schimbarea principală. Un cuvânt din text nu decide nimic.",
        "Întâi scrie în „subiect”, în 3-8 cuvinte, despre ce e știrea. Apoi alege în „card” id-ul cardului care descrie exact acel subiect, sau \"\" dacă niciunul nu se potrivește clar.",
        "Exemple: escrocii au luat unui om banii strânși pentru o mașină -> escrocherie, NU mașini; hackerii care atacă energia sau băncile -> securitate cibernetică, NU energie; producția de rachete antigrindină -> producție și industrie, NU război și NU agricultură; colegiul agroindustrial primește un laborator -> educație, NU industrie; alertele false cu bombă -> poliție sau urgențe, NU justiție (justiția doar când știrea e despre instanță, proces, sentință); afacerile primarului Chișinăului -> Primăria Chișinău, NU poliție; pietonul lovit -> accident cu pieton; prețurile ANRE la benzină -> carburanți, NU sigla ANRE; campania pentru bașcan în Găgăuzia -> alegeri; accidentul de mașini -> accident rutier, NU mașini și acte; sportivul medaliat -> cardul sportului lui.",
        "Știrile despre moldovenii dintr-o țară (muncă, acte, accidente, consulat, întâmplări) -> cardul diasporei țării (card-diaspora-italia, card-diaspora-germania...), dacă știrea nu are un subiect mai precis (o crimă, un accident rutier: acolo cardul faptei).",
        "Cardurile ilustratie-foto-… sunt fotografii-simbol realiste (2026-11-16): când una descrie exact subiectul, o preferi cardului desenat pe aceeași temă.",
        // 2026-11-21: survolul de la Dondușeni–Briceni și drona de la Crocmaz au primit cardul negru
        // cu sigla Ministerului Apărării, deși biblioteca are fotografii cu drone
        "Dronele (survol, dronă în spațiul aerian, dronă căzută, resturi găsite, alertă aeriană), chiar anunțate de Ministerul Apărării sau de Poliția de Frontieră -> fotografia cu drone care se potrivește (ilustratie-foto-drona-…: căzută / deasupra satelor / deasupra orașelor), altfel card-drona; NICIODATĂ \"\".",
        "Fără card mai degrabă decât un card fals: dacă știrea e despre o persoană, o întâmplare sau un subiect pe care niciun card nu-l spune, card = \"\".",
      ].join("\n"),
      prompt: `Știrea: ${subject}\n\nCarduri (id — despre ce e):\n${cards.map((p) => `${p.id} — ${p.name.replace(/^TEMĂ \([^)]*\):\s*/, "")}`).join("\n")}`,
      schema: { type: "object", properties: { subiect: { type: "string" }, card: { type: "string" } }, required: ["subiect", "card"] },
      // 0,1 $ nu mai ajungea de când biblioteca are ~150 de carduri (2026-11-16): 24 din 38 de
      // alegeri picau cu error_max_budget_usd -> coperta cădea pe sigla instituției (2026-11-23)
      maxBudgetUsd: 0.4,
    });
    const photo = pickRotated(cards.find((p) => p.id === card)?.photos ?? [], recent);
    // în jurnalul rulării: de ce o copertă a ajuns card cu siglă (nimic ales / poze folosite recent)
    console.log(`Copertă: „${subject.slice(0, 70)}” -> ${card || "fără card"}${card && !photo ? " (toate pozele folosite recent)" : ""}`);
    return photo && { url: photo.url, resourceId: null, credit: photo.credit, alt: photo.alt };
  } catch (err) {
    console.error(`Copertă: alegerea cardului a eșuat — ${err instanceof Error ? err.message.slice(0, 200) : err}`);
    return null;
  }
}
