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
  ["preturile-la-alimente-si-inflatia-date-bns-bnm", /inflati/],
  ["migratia-si-depopularea-moldovei-cifre-oficiale", /depopular|recensamant|exodul|emigrar\w* in masa/],
];

export function matchDossier(text: string): string | undefined {
  const t = stripDiacritics(text).toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0];
}

export async function getRelatedDossier(title: string, lead: string, topics: string[] = []) {
  // subiectul „criză energetică” fără o regulă mai precisă -> pilonul crizei
  const slug = matchDossier(`${title} ${lead}`) ?? (topics.includes("criza-energetica") ? "criza-energetica-din-moldova-cauze-cronologie-facturi" : undefined);
  return slug ? getGuide(slug) : undefined;
}
