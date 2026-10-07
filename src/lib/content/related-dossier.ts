import { getGuide } from "./guides";
import { stripDiacritics } from "@/lib/pipeline/text-normalize";

// Dosarul-pilon al subiectului („Context”), sus în știre: o știre despre UE
// trimite mereu la dosarul aderării, una despre Tiraspol la Transnistria etc.
// Expresii precise (fără diacritice), în ordinea priorității — Transnistria și
// sancțiunile înaintea UE, care apare în multe știri.
const RULES: [slug: string, re: RegExp][] = [
  ["aderarea-moldovei-la-ue-etape-si-calendar", /aderar\w* (la ue|la uniune|moldovei|europeana)|negocier\w* de aderare|integrar\w* europe|acquis|planul de crestere/],
  ["transnistria-situatia-regiunii-si-impactul", /transnistri|tiraspol|stanga nistrului|krasnoselski/],
  ["ue-rusia-sanctiuni-dosar", /sanctiun\w* (ue |ale ue |europene )?(impotriva |pentru )?(rusi|moscov)|pachet\w* de sanctiuni/],
  ["razboiul-din-ucraina-dosar", /razboi\w* din ucraina|invazi\w* rus|frontul? din ucraina|zelenski/],
  // „UE” singură apare și în știri străine (Letonia, ciuma): doar împreună cu Moldova
  ["aderarea-moldovei-la-ue-etape-si-calendar", /^(?=.*(\bue\b|uniun\w* europe))(?=.*(moldov|chisinau))/],
  // pilonul crizei: când știrea e despre criză în ansamblu, nu doar despre tarif / datorii
  ["criza-energetica-din-moldova-cauze-cronologie-facturi", /criz\w* energetic|criza gazelor|stare\w* de urgenta (in|pe|din) energetic|mgres|cuciurgan|sistar\w* (a )?livrar\w* de gaz/],
  ["moldovagaz-si-datoriile-la-gaz", /moldovagaz|gazprom/],
  ["pretul-gazului-in-moldova-tarif-si-schimbari", /pretul (la )?gaz|tarif\w* (la|pentru) gaz|gazul (se )?scump|metrul cub de gaz/],
  ["independenta-energetica-gaz-si-curent-moldova", /energocom|independent\w* energetic|interconect|linia (electrica|de inalta tensiune)|vulcanesti|securitat\w* energetic/],
  ["reforma-justitiei-vetting-judecatori-procurori", /vetting|evaluar\w* (externa )?a judecator|consiliul superior al magistraturii|reforma justitiei/],
  ["furtul-miliardului-cronologia-dosarului", /furtul miliardului|frauda bancara/],
  ["aeroportul-international-chisinau-concesionare-procese", /aeroport\w* (international )?(din )?chisinau|avia invest/],
  ["reforma-administrativ-teritoriala-raioane-primarii", /reforma administrativ|comasar\w* (a )?primarii|lichidar\w* raioan|amalgamar/],
  ["pensii-si-salarii-indexari-si-calcul", /indexar\w* (a )?pensii|pensiile (se )?indexeaza/],
  // pilonul pensiilor („pensiune” = casă de oaspeți, nu intră)
  ["pensiile-in-moldova-tot-ce-trebuie-sa-stii", /\bpensi(a|e|i|ii|ile|ilor|onar\w*)\b|varsta de pensionare|stagiu\w* de cotizare/],
  ["preturile-la-alimente-si-inflatia-date-bns-bnm", /inflati/],
  ["migratia-si-depopularea-moldovei-cifre-oficiale", /depopular|recensamant|exodul|emigrar\w* in masa/],
  // ghidurile-pilon pentru șoferi și amenzi (după dosare: o știre despre UE rămâne la UE)
  ["alcoolul-la-volan-limite-si-sanctiuni", /(beat|baut|ebrietate|alcool\w*|alcoolemi\w*) (la volan|in trafic)|sub influenta alcoolului|alcooltest/],
  ["cum-obtii-permisul-de-conducere-in-moldova-pas-cu-pas", /scoal\w* auto|examen\w* (auto|de conducere|teoretic|practic)|obtiner\w* (a )?permisului|permis\w* de conducere (nou|pentru tineri)/],
  ["reguli-de-circulatie-incalcate-des-si-amenzile", /regulament\w* (circulatiei|de circulatie)|reguli\w* de circulatie|puncte de penalizare|telefonul la volan|centur\w* de siguranta|depasir\w* (neregulamentar|pe linia continua)|exces de viteza|limita de viteza|\bradar\w*/],
  ["amenzile-in-moldova-cine-te-poate-amenda-si-cum-contesti", /\bamend\w*|\bamenz\w*|proces\w*-verbal\w* (de contraventie)?|contraventi\w*/],
];

export function matchDossier(text: string): string | undefined {
  const t = stripDiacritics(text).toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0];
}

// ghidurile cu reguli și amenzi din Moldova: nu la știrile din străinătate
// („Germania: amenda pentru parcare” nu ține de Codul contravențional)
const MOLDOVA_ONLY = new Set([
  "alcoolul-la-volan-limite-si-sanctiuni",
  "cum-obtii-permisul-de-conducere-in-moldova-pas-cu-pas",
  "reguli-de-circulatie-incalcate-des-si-amenzile",
  "amenzile-in-moldova-cine-te-poate-amenda-si-cum-contesti",
]);

export async function getRelatedDossier(title: string, lead: string, topics: string[] = [], section?: string) {
  // subiectul „criză energetică” fără o regulă mai precisă -> pilonul crizei
  let slug = matchDossier(`${title} ${lead}`) ?? (topics.includes("criza-energetica") ? "criza-energetica-din-moldova-cauze-cronologie-facturi" : undefined);
  if (slug && MOLDOVA_ONLY.has(slug) && (section === "diaspora" || section === "international")) slug = undefined;
  return slug ? getGuide(slug) : undefined;
}
