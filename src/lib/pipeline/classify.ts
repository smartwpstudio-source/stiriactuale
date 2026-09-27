import { structured, HAIKU_MODEL } from "./llm";
import type { CandidateGroup, ClassificationResult } from "./types";
import type { Section, Topic } from "@/lib/content/types";

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
          locality: {
            type: "string",
            description:
              "Slug de raion din R. Moldova, minuscule, fără diacritice (ex: drochia, straseni, chisinau). DOAR dacă section=regiuni.",
          },
          country: {
            type: "string",
            description: "Slug de țară, minuscule, fără diacritice (ex: italia, franta). DOAR dacă section=diaspora.",
          },
          topics: { type: "array", items: { type: "string", enum: TOPICS }, description: "0-3 subiecte." },
          factual_richness: { type: "number", description: "0-100: cifre, nume, locație clară vs. titlu vag." },
          confidence: { type: "number", description: "0-100: știre confirmată vs. speculație/sursă unică nesigură." },
        },
        required: ["id", "section", "topics", "factual_richness", "confidence"],
      },
    },
  },
  required: ["items"],
};

// Distincție cerută explicit în plan-implementare-agregator-stiri-ai.md 3.4:
// "știre despre Moldova în presa internațională" (national) vs. "știre
// internațională" propriu-zisă.
const SYSTEM_PROMPT = [
  "Ești un clasificator de știri pentru un site din Republica Moldova.",
  "Primești mai multe grupuri numerotate (#0, #1, ...); fiecare grup = relatări despre același eveniment. Clasifică FIECARE grup, cu id-ul lui.",
  "Reguli de clasificare pe secțiune:",
  "- regiuni: DOAR dacă știrea are o localitate/raion clar din R. Moldova (nu doar Chișinău menționat tangențial).",
  "- diaspora: DOAR dacă e despre moldoveni aflați în mod explicit în străinătate.",
  "- national: știri despre R. Moldova la nivel de țară, INCLUSIV când sunt relatate de presă internațională, dacă subiectul central e Moldova.",
  "- international: știri fără o legătură directă, centrală cu R. Moldova.",
  "În caz de dubiu pentru regiuni/diaspora, alege national sau international.",
].join("\n");

// Un singur apel pentru toți candidații rulării: instrucțiunile + schema
// (~1.700 token-uri) se plătesc o dată, nu de 40 de ori — măsurat, ~76% din
// costul clasificării era overhead repetat.
export async function classifyGroups(
  groups: CandidateGroup[],
): Promise<(ClassificationResult | null)[]> {
  const prompt = groups
    .map(
      (g, i) =>
        `#${i} (${g.sourceNames.length} surse)\n` +
        g.items
          .slice(0, 5)
          .map((it) => `- [${it.sourceName}] ${it.title}\n  ${it.summary}`)
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
      factual_richness: number;
      confidence: number;
    }[];
  }>({ model: HAIKU_MODEL, system: SYSTEM_PROMPT, prompt, schema: SCHEMA, maxBudgetUsd: 0.5 });

  const byId = new Map(out.items.map((it) => [it.id, it]));
  return groups.map((_, i) => {
    const it = byId.get(i);
    if (!it) return null;
    return {
      section: it.section,
      locality: it.locality,
      country: it.country,
      topics: it.topics ?? [],
      factualRichness: it.factual_richness,
      confidence: it.confidence,
    };
  });
}
