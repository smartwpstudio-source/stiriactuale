import { getAnthropicClient, HAIKU_MODEL } from "./anthropic-client";
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

interface ClassifyToolInput {
  section: Section;
  locality?: string;
  country?: string;
  topics: Topic[];
  factual_richness: number;
  confidence: number;
}

const CLASSIFY_TOOL = {
  name: "clasifica_stire",
  description:
    "Clasifică o știre pe secțiune, localitate/țară, subiecte, și scoruri de calitate.",
  input_schema: {
    type: "object" as const,
    properties: {
      section: { type: "string", enum: SECTIONS },
      locality: {
        type: "string",
        description:
          "Slug de raion din R. Moldova, minuscule, fără diacritice (ex: drochia, straseni, chisinau). DOAR dacă section=regiuni.",
      },
      country: {
        type: "string",
        description:
          "Slug de țară, minuscule, fără diacritice (ex: italia, franta, germania). DOAR dacă section=diaspora.",
      },
      topics: {
        type: "array",
        items: { type: "string", enum: TOPICS },
        description: "0-3 subiecte aplicabile din lista fixă. Gol dacă niciunul nu se aplică clar.",
      },
      factual_richness: {
        type: "number",
        description:
          "0-100: cât de bogată e informația factuală (cifre, nume, locație clară) vs. titlu vag/speculativ.",
      },
      confidence: {
        type: "number",
        description: "0-100: încrederea că e o știre confirmată, nu speculație/sursă unică nesigură.",
      },
    },
    required: ["section", "topics", "factual_richness", "confidence"],
  },
};

// Distincție cerută explicit în plan-implementare-agregator-stiri-ai.md 3.4:
// un LLM face diferența, nu doar cuvinte cheie, între "știre despre Moldova
// în presa internațională" (national) și "știre internațională" propriu-zisă.
const SYSTEM_PROMPT = [
  "Ești un clasificator de știri pentru un site din Republica Moldova.",
  "Reguli de clasificare pe secțiune:",
  "- regiuni: DOAR dacă știrea are o localitate/raion clar din R. Moldova (nu doar Chișinău menționat tangențial).",
  "- diaspora: DOAR dacă e despre moldoveni aflați în mod explicit în străinătate.",
  "- national: știri despre R. Moldova la nivel de țară (politică, economie, societate), INCLUSIV când sunt relatate de presă internațională, dacă subiectul central e Moldova.",
  "- international: știri fără o legătură directă, centrală cu R. Moldova.",
  "Nu forța o clasificare pe regiuni/diaspora dacă localitatea/țara nu e clară — alege national sau international în caz de dubiu.",
].join("\n");

export async function classifyGroup(group: CandidateGroup): Promise<ClassificationResult> {
  const client = getAnthropicClient();
  const digest = group.items
    .slice(0, 5)
    .map((i) => `- [${i.sourceName}] ${i.title}\n  ${i.summary}`)
    .join("\n");

  const message = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Clasifică acest grup de relatări despre același eveniment (${group.sourceNames.length} surse: ${group.sourceNames.join(", ")}):\n\n${digest}`,
      },
    ],
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "clasifica_stire" },
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Clasificarea nu a returnat un tool_use valid.");
  }

  const input = toolUse.input as ClassifyToolInput;
  return {
    section: input.section,
    locality: input.locality,
    country: input.country,
    topics: input.topics ?? [],
    factualRichness: input.factual_richness,
    confidence: input.confidence,
  };
}
