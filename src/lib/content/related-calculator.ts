import { availableCalculators, CALCULATORS, type CalculatorSlug } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { stripDiacritics } from "@/lib/pipeline/text-normalize";

// „Calculator util” sub știre: când știrea e despre salarii, concedii, taxa de
// drum sau curs valutar, cititorul își face calculul pe loc. Potrivire pe
// expresii precise (fără diacritice), nu pe cuvinte izolate — „euro” singur
// apare și la fonduri europene, nu doar la curs.
const RULES: [slug: (typeof CALCULATORS)[number]["slug"], re: RegExp][] = [
  ["taxa-drum", /taxa (pentru folosirea )?drumurilor|taxa de drum|taxele rutiere/],
  ["vamuire-auto", /vamuir|acciz(a|ele) (la|pentru) (auto|masini)|import(ul)? (de )?(automobile|autoturisme|masini)/],
  ["impozit-imobil", /impozit(ul)? pe (bunuri(le)? imobiliare|imobil|casa|locuint)/],
  ["indemnizatie-nastere", /indemnizati\w* unic\w*|indemnizati\w* (la|pentru) nastere/],
  ["indemnizatie-crestere-copil", /cresterea copilului|ingrijirea copilului/],
  ["indemnizatie-somaj", /somaj|someri/],
  ["concediu-odihna", /concedi(u|ul|ile) de odihna|concediul anual/],
  ["zile-lucratoare", /zile(le)? libere|\bzi(le|lei|lelor)? lucratoare|transfer\w* (zilei|zilelor|unei zile|unor zile)|\bzi(le|lelor)? de odihna|sarbatori(le)? (legale|nelucratoare)/],
  ["concediu-maternitate", /maternitat/],
  // „sarcina” singură e și „sarcină de serviciu” / „sarcina fiscală” — doar expresii de sarcină
  ["sarcina", /\bgravid|\binsarcinat|(timpul|parcursul|monitorizarea|intreruperea|durata) sarcinii|saptamani\w* de sarcina|trimestrul \w+ de sarcina|data (probabila a )?nasterii copilului/],
  ["concediu-medical", /concedi(u|ul|i) medical|certificat(ul)? (de concediu )?medical|incapacitat(e|ii) temporar/],
  ["ore-suplimentare", /ore(le)? suplimentare|munc\w* suplimentar|munc\w* (de|pe timp de|in timpul) (noapte|noptii)|munc\w* (in|din) zile(le)? de (sarbatoare|repaus|odihna)/],
  ["salariu-net", /salari(u|ul|ile|ului|ilor) (net|brut|minim|mediu)|salariul in mana|impozitul pe venit|salarii(le)? (cresc|se majoreaza)|majorarea salari/],
  ["convertor-valutar", /curs(ul)? (valutar|oficial|bnm)|schimb(ul)? valutar|leul (se )?(depreciaz|apreciaz|scade|creste)/],
  ["factura-gaz", /factur\w* (la|de|pentru) gaz|(tarif|pret)\w* (reglementat\w* )?(la |pentru )?gaz/],
  ["factura-curent", /factur\w* (la|de|pentru) (curent|lumina|energi\w* electric)|(tarif|pret)\w* (reglementat\w* )?(la |pentru )?(curent|energi\w* electric)/],
  ["cost-incalzire", /\bgcal\b|sezon\w* de incalzire|(cost|factur)\w* (la |pentru )?(incalzir|caldur)|termoficar|energi\w* termic/],
  ["imc", /\bimc\b|indicele (de )?mas(a|ei) corporal|\bobez|supraponderal/],
  ["calorii", /\bcalorii\b|\bdiet(a|e|ei|ele)\b/],
  ["dobanda-depozit", /dobanz\w* (la|pentru|aferente) depozit|depozit\w* (bancar|la termen)|\bfgdsb\b/],
  ["lemne-peleti", /lemn\w* de foc|\bpelet/],
  ["putere-calorifere", /central\w* termic|calorifer/],
  ["cost-calatorie", /carburant|\bbenzin|\bmotorin/],
];

export function matchCalculator(text: string) {
  const t = stripDiacritics(text).toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0];
}

export async function getRelatedCalculator(title: string, lead: string) {
  const slug = matchCalculator(`${title} ${lead}`);
  if (!slug) return undefined;
  return availableCalculators(await getCalcParams()).find((c) => c.slug === slug);
}

// Calculatoarele care merg cu un ghid, afișate sus pe pagina ghidului.
// Listă explicită pentru ghidurile unde legătura e sigură; restul — după
// aceleași expresii ca la știri (titlu + descriere).
const GUIDE_CALCULATORS: Record<string, CalculatorSlug[]> = {
  "trimiterea-banilor-acasa-in-moldova": ["convertor-valutar"],
  "roaming-si-bani-in-calatorie": ["convertor-valutar"],
  "comisioanele-bancare-card-transferuri-valuta": ["convertor-valutar"],
  "salariul-minim-si-impozitul-pe-venit-cat-ramane-in-mana": ["salariu-net"],
  "contractul-individual-de-munca-ce-trebuie-sa-contina": ["salariu-net"],
  "declaratia-pe-venit-persoane-fizice-cine-depune-si-pana-cand": ["salariu-net"],
  "declaratia-pe-venit-2027-termen-cine-depune-online": ["salariu-net"],
  "servicii-fiscale-online-e-factura-msign-mpass-sfs": ["salariu-net", "impozit-imobil"],
  "concediul-medical-cine-plateste-si-cum-se-calculeaza": ["concediu-medical"],
  "concediul-de-maternitate-si-paternal-durata-plata-acte": ["concediu-maternitate", "sarcina"],
  "concediul-anual-de-odihna-cate-zile-si-cum-se-plateste": ["concediu-odihna"],
  "somaj-inregistrare-anofm-si-ajutor-de-somaj": ["indemnizatie-somaj"],
  "concedierea-preaviz-indemnizatii-si-cum-o-contesti": ["indemnizatie-somaj"],
  "indemnizatia-lunara-pentru-ingrijirea-copilului-calcul": ["indemnizatie-crestere-copil"],
  "indemnizatia-unica-la-nasterea-copilului-suma-acte-termen": ["indemnizatie-nastere", "indemnizatie-crestere-copil"],
  "masina-adusa-din-strainatate-vamuire-si-inmatriculare-in-moldova": ["vamuire-auto"],
  "inmatricularea-masinii-in-moldova": ["taxa-drum"],
  "taxa-pentru-folosirea-drumurilor-cat-platesti-si-cand": ["taxa-drum"],
  "impozitul-pe-bunurile-imobiliare-cine-plateste-cat-si-pana-cand": ["impozit-imobil"],
  "depozitul-bancar-ce-garanteaza-statul-fgdsb": ["dobanda-depozit"],
  "sarbatorile-legale-in-moldova-in-2027-zile-libere": ["zile-lucratoare", "ore-suplimentare"],
  "calendarul-sarbatorilor-de-iarna-zile-libere": ["zile-lucratoare"],
  "plangere-la-inspectoratul-de-stat-al-muncii-cand-si-cum": ["ore-suplimentare"],
  "economia-la-benzina-si-motorina-pret-si-consum": ["cost-calatorie"],
  "condusul-economic-cum-reduci-consumul-de-carburant": ["cost-calatorie"],
  "pregatirea-gospodariei-de-iarna-beci-conserve-pomi": ["lemne-peleti"],
  "cum-reduci-factura-la-incalzire-sfaturi-practice": ["cost-incalzire", "putere-calorifere", "lemne-peleti"],
  // potriviri false ale expresiilor („certificat medical”, șomajul din Israel)
  "certificat-medical-pentru-permisul-de-conducere": [],
  "lucratorii-moldoveni-din-israel-drepturi-cand-activitatea-se-opreste": [],
};

export async function getGuideCalculators(slug: string, title: string, description: string) {
  const fallback = matchCalculator(`${title} ${description}`);
  const slugs = GUIDE_CALCULATORS[slug] ?? (fallback ? [fallback] : []);
  const available = availableCalculators(await getCalcParams());
  return slugs.flatMap((s) => available.filter((c) => c.slug === s));
}
