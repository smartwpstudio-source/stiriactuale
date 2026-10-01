import { structured, HAIKU_MODEL } from "./llm";
import type { CandidateGroup, ClassificationResult } from "./types";
import type { Section, Topic } from "@/lib/content/types";
import { COUNTRY_NAMES, RAION_NAMES } from "@/lib/content/geo";

const SECTIONS: Section[] = ["regiuni", "national", "international", "diaspora"];
const TOPICS: Topic[] = [
  "accidente",
  "criminal",
  "coruptie",
  "alerta-112",
  "economic",
  "criza-energetica",
  "sanatate",
  "social",
  "cultura",
  "sport",
];

// locality/country = liste închise: un slug inventat ar crea un articol pe o
// pagină de hub inexistentă (404).
const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer", description: "Numărul grupului (#N) din mesaj." },
          section: { type: "string", enum: SECTIONS },
          locality: { type: "string", enum: Object.keys(RAION_NAMES), description: "DOAR dacă section=regiuni." },
          country: { type: "string", enum: Object.keys(COUNTRY_NAMES), description: "DOAR dacă section=diaspora." },
          topics: { type: "array", items: { type: "string", enum: TOPICS }, description: "0-3 subiecte." },
          impact: { type: "number", description: "0-100, după criteriile editoriale din instrucțiuni." },
          factual_richness: { type: "number", description: "0-100: cifre, nume, locație clară vs. titlu vag." },
          confidence: { type: "number", description: "0-100: știre confirmată vs. speculație/sursă unică nesigură." },
          reject: { type: "boolean", description: "true dacă e în lista de respingere." },
          same_as: {
            type: "integer",
            description: "Id-ul unui grup ANTERIOR (număr mai mic) despre EXACT același eveniment, dacă există.",
          },
        },
        required: ["id", "section", "topics", "impact", "factual_richness", "confidence", "reject"],
      },
    },
  },
  required: ["items"],
};

const SYSTEM_PROMPT = [
  "Ești editorul unui site de știri din Republica Moldova. Cititorii: oameni obișnuiți din raioane, din Chișinău și din diaspora.",
  "Primești grupuri numerotate (#0, #1, ...); fiecare grup = relatări despre același eveniment. Clasifică FIECARE grup, cu id-ul lui.",
  "",
  "Secțiune:",
  "- regiuni: eveniment localizat clar într-un raion/oraș din R. Moldova (inclusiv Găgăuzia, Transnistria). Accidentele, incendiile, crimele și cazurile dintr-o stradă/cartier din Chișinău sunt OBLIGATORIU regiuni + locality=chisinau. Deciziile guvernamentale, Parlamentul, instituțiile centrale NU sunt regiuni.",
  "- diaspora: moldoveni aflați în străinătate — probleme, accidente, drepturi, dar și istorii de succes. Țara în care se află.",
  "- national: R. Moldova la nivel de țară, inclusiv relatat de presa străină.",
  "- international: fără legătură centrală cu R. Moldova.",
  "În caz de dubiu pentru regiuni/diaspora, alege national sau international.",
  "",
  "Impact (0-100) — cât contează pentru un cititor obișnuit. Mare (70-100):",
  "- accidente, crime, corupție, scandaluri, acuzații publice grave, cazuri de rezonanță;",
  "- scumpiri, prețuri, tarife, salarii, pensii, impozite — orice îi atinge buzunarul;",
  "- legi și decizii noi în educație, medicină, economie, care schimbă ceva concret pentru oameni;",
  "- scandaluri politice, demisii, anchete; evenimente din raioane care afectează comunitatea;",
  "- diaspora: pericole, drepturi, reguli noi în țara-gazdă, istorii de succes remarcabile.",
  "Mediu (40-69): politică de rutină cu consecințe, internațional cu efect regional (Ucraina, România, UE, Rusia).",
  "Mic (0-39): declarații fără conținut, protocol, ceremonii, vizite de curtoazie, anunțuri instituționale fără efect.",
  "",
  "same_as: grupuri diferite pot descrie același eveniment formulat altfel (aceeași explozie, același accident) SAU etape diferite ale aceluiași incident (ex. anunțul inițial al unui obiect în spațiul aerian + drona găsită căzută; accidentul + starea victimelor). Marchează-le pe toate — publicăm un singur articol pe incident. Două evenimente distincte cu aceiași actori (două întâlniri diferite ale premierului) NU sunt același eveniment.",
  "",
  "reject=true pentru: horoscop, publicitate/advertorial/promoții, monden și vedete fără interes public, rețete, sfaturi generale, sondaje de opinie online, rezultate sportive fără legătură cu Moldova, știri vechi reluate.",
].join("\n");

// Un singur apel pentru toți candidații rulării — instrucțiunile + schema se
// plătesc o dată, nu per grup.
export async function classifyGroups(groups: CandidateGroup[]): Promise<(ClassificationResult | null)[]> {
  const prompt = groups
    .map(
      (g, i) =>
        `#${i} (${g.sourceNames.length} surse)\n` +
        g.items
          .slice(0, 4)
          .map((it) => `- [${it.sourceName}] ${it.title}\n  ${it.summary.slice(0, 300)}`)
          .join("\n"),
    )
    .join("\n\n");

  const out = await structured<{
    items: {
      id: number;
      section: Section;
      locality?: string;
      country?: string;
      topics?: Topic[];
      impact: number;
      factual_richness: number;
      confidence: number;
      reject: boolean;
      same_as?: number;
    }[];
  }>({ model: HAIKU_MODEL, system: SYSTEM_PROMPT, prompt, schema: SCHEMA, maxBudgetUsd: 0.5 });

  const byId = new Map(out.items.map((it) => [it.id, it]));
  return groups.map((_, i) => {
    const it = byId.get(i);
    if (!it) return null;
    // secțiune fără slug valid -> national (altfel articolul n-ar avea hub)
    const section =
      (it.section === "regiuni" && !it.locality) || (it.section === "diaspora" && !it.country) ? "national" : it.section;
    return {
      section,
      locality: section === "regiuni" ? it.locality : undefined,
      country: section === "diaspora" ? it.country : undefined,
      topics: it.topics ?? [],
      impact: it.impact,
      factualRichness: it.factual_richness,
      confidence: it.confidence,
      reject: it.reject,
      sameAs: it.same_as !== undefined && it.same_as >= 0 && it.same_as < i ? it.same_as : undefined,
    };
  });
}
