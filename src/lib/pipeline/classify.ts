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
          push_alert: { type: "boolean", description: "true DOAR pentru știrile care merită o notificare pe telefon (criteriile din instrucțiuni)." },
          sensitive: { type: "boolean", description: "true dacă subiectul are impact emoțional puternic sau risc juridic (criteriile din instrucțiuni)." },
          same_as: {
            type: "integer",
            description: "Id-ul unui grup ANTERIOR (număr mai mic) despre EXACT același eveniment, dacă există.",
          },
          update_of: {
            type: "integer",
            description: "Numărul N al unei știri pe scurt deja publicate [PN] despre EXACT același eveniment, dacă există.",
          },
        },
        required: ["id", "section", "topics", "impact", "factual_richness", "confidence", "reject", "push_alert", "sensitive"],
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
  "Interesul public: unele grupuri au „interes Telegram ×N” — de câte ori mai multe vizualizări are postarea redacției față de media canalului ei. ×2 sau mai mult înseamnă că subiectul preocupă clar publicul: crește impactul. ×1 sau lipsa semnalului nu scade nimic.",
  "Mic (0-39): declarații fără conținut, protocol, ceremonii, vizite de curtoazie, anunțuri instituționale fără efect.",
  "",
  "same_as: grupuri diferite pot descrie același eveniment formulat altfel (aceeași explozie, același accident) SAU etape diferite ale aceluiași incident (ex. anunțul inițial al unui obiect în spațiul aerian + drona găsită căzută; accidentul + starea victimelor). Marchează-le pe toate — publicăm un singur articol pe incident. Două evenimente distincte cu aceiași actori (două întâlniri diferite ale premierului) NU sunt același eveniment.",
  "",
  "sensitive=true — articolul așteaptă aprobarea editorului înainte de publicare. Pune true pentru: morți, crime, violență, victime, răniți grav, tragedii, sinucideri, abuzuri, minori implicați, boli grave ale unor persoane, ȘI pentru acuzații de infracțiuni sau corupție la adresa unor persoane numite (risc de defăimare). Pune false pentru: prețuri, tarife, legi, decizii, economie, politică de rutină, vreme, evenimente culturale/sportive, accidente fără victime grave. În caz de dubiu: true.",
  "",
  "push_alert=true — notificare pe telefonul cititorilor, prag FOARTE sus (maxim câteva pe zi din zeci de știri): DOAR știri de interes național sau internațional pentru oamenii din Moldova — cazuri de rezonanță, scumpiri și tarife noi, legi și reguli noi care îi afectează pe toți, scandaluri politice mari, accidente sau tragedii mari (morți multiple, catastrofe), cazuri sociale care au mișcat țara. NU: știri locale obișnuite, accidente cu un rănit, declarații politice de rutină, internațional fără efect asupra Moldovei. În caz de dubiu: false.",
  "",
  "Secțiunea international (Lumea) — DOAR: geopolitică și politica marilor puteri, războaie și conflicte, crize economice și energetice cu efect regional, alegeri și scandaluri politice majore (SUA, UE, Rusia, Ucraina, România, Germania, Israel, Iran, China), incidente majore cu rezonanță mondială (catastrofe aviatice, atentate, dezastre), orice implică moldoveni sau români, orice afectează Moldova (prețuri, zboruri din/spre Chișinău, diaspora).",
  "reject=true pentru internațional fără miză: crime, accidente, procese și fapte diverse locale din alte țări, fără moldoveni/români implicați și fără rezonanță internațională (ex. o crimă într-un oraș din Anglia).",
  "update_of: dacă în lista „Știri pe scurt deja publicate” e o știre despre EXACT același eveniment, dă numărul ei — grupul o completează cu detalii noi, nu e o știre nouă.",
  "reject=true pentru: horoscop, publicitate/advertorial/promoții, monden și vedete fără interes public, rețete, sfaturi generale, sondaje de opinie online, rezultate sportive fără legătură cu Moldova, știri vechi reluate.",
].join("\n");

// "interes Telegram ×2.4, 5.370 vizualizări" — semnal real de la public, nu doar al nostru
function interestLine(g: CandidateGroup): string {
  const best = g.items.reduce<CandidateGroup["items"][number] | null>(
    (b, i) => ((i.tgInterest ?? 0) > (b?.tgInterest ?? 0) ? i : b),
    null,
  );
  return best?.tgInterest ? `, interes Telegram ×${best.tgInterest} față de media canalului, ${best.tgViews} vizualizări` : "";
}

// Un singur apel pentru toți candidații rulării — instrucțiunile + schema se
// plătesc o dată, nu per grup.
export async function classifyGroups(
  groups: CandidateGroup[],
  briefs: { id: number; title: string }[] = [],
): Promise<(ClassificationResult | null)[]> {
  const briefList = briefs.length
    ? `Știri pe scurt deja publicate (pot fi completate):\n${briefs.map((b, n) => `[P${n}] ${b.title}`).join("\n")}\n\n`
    : "";
  const prompt =
    briefList +
    groups
    .map(
      (g, i) =>
        `#${i} (${g.sourceNames.length} surse${interestLine(g)})\n` +
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
      push_alert?: boolean;
      sensitive?: boolean;
      same_as?: number;
      update_of?: number;
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
      pushWorthy: it.push_alert === true,
      sensitive: it.sensitive !== false, // lipsă = sensibil (prudență)
      sameAs: it.same_as !== undefined && it.same_as >= 0 && it.same_as < i ? it.same_as : undefined,
      updateOf: it.update_of !== undefined ? briefs[it.update_of]?.id : undefined,
    };
  });
}
