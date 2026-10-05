import { availableCalculators, CALCULATORS } from "@/lib/calculators";
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
  ["indemnizatie-crestere-copil", /cresterea copilului|ingrijirea copilului|indemnizati(a|ile) (unica )?(la|pentru) nasterea/],
  ["indemnizatie-somaj", /somaj|someri/],
  ["concediu-odihna", /concedi(u|ul|ile) de odihna|concediul anual/],
  ["concediu-maternitate", /maternitat/],
  ["concediu-medical", /concedi(u|ul|i) medical|certificat(ul)? (de concediu )?medical|incapacitat(e|ii) temporar/],
  ["salariu-net", /salari(u|ul|ile|ului|ilor) (net|brut|minim|mediu)|salariul in mana|impozitul pe venit|salarii(le)? (cresc|se majoreaza)|majorarea salari/],
  ["convertor-valutar", /curs(ul)? (valutar|oficial|bnm)|schimb(ul)? valutar|leul (se )?(depreciaz|apreciaz|scade|creste)/],
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
