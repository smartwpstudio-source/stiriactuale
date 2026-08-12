import { getAnthropicClient, SONNET_MODEL } from "./anthropic-client";
import type { CandidateGroup, ClassificationResult, GeneratedArticle } from "./types";

const GENERATE_TOOL = {
  name: "genereaza_articol",
  description: "Generează un articol de știri complet rescris, structurat, gata de publicare.",
  input_schema: {
    type: "object" as const,
    properties: {
      titlu: {
        type: "string",
        description: "Max 60 caractere, cuvântul cheie principal la început.",
      },
      slug: {
        type: "string",
        description: "Slug URL curat, minuscule, fără diacritice, cuvinte separate prin cratimă, fără stopwords inutile.",
      },
      meta_description: { type: "string", description: "150-160 caractere." },
      lead: { type: "string", description: "2-3 propoziții, rezumă esențialul." },
      corp_html: {
        type: "string",
        description:
          "HTML cu subtitluri <h2>/<h3> și paragrafe <p>. Fără <h1> (titlul e separat). Include un paragraf de context și o concluzie.",
      },
      tag_uri: { type: "array", items: { type: "string" }, description: "2-5 etichete relevante." },
      alt_text_imagine: {
        type: "string",
        description: "Text alt descriptiv pentru imaginea simbol a articolului.",
      },
    },
    required: [
      "titlu",
      "slug",
      "meta_description",
      "lead",
      "corp_html",
      "tag_uri",
      "alt_text_imagine",
    ],
  },
};

// Reguli obligatorii din plan-implementare-agregator-stiri-ai.md secțiunea 3.5,
// plus regula de atribuire adăugată pentru sursele descoperite prin yam.md
// (secțiunea 3.1): yam.md e doar canal de descoperire, nu sursă faptică.
const SYSTEM_PROMPT = [
  "Ești un jurnalist care rescrie știri pentru stiriactuale.info, un site din Republica Moldova.",
  "Reguli obligatorii:",
  "1. Rescrie complet — nicio propoziție nu trebuie să semene structural cu sursele primite.",
  "2. Structură: titlu (max 60 car., cuvânt cheie la început), lead de 2-3 propoziții, corp cu subtitluri H2/H3, un paragraf de context, o concluzie.",
  "3. Fără citate directe lungi din sursă — parafrazează, nu copia formulările.",
  '4. Menționează sursa faptică generic ("potrivit autorităților", "conform presei locale") sau nominal dacă sursa originală e cunoscută (ex. "potrivit ZdG", "potrivit IPN"). NICIODATĂ nu atribui informația unui agregator ca "yam.md" — numele sursei primite e cea care a raportat efectiv știrea, chiar dacă a fost descoperită printr-un agregator.',
  "5. Ton neutru, factual, fără senzaționalism — mai ales pe subiecte sensibile (accidente, crime, victime).",
  "Scrie exclusiv în limba română.",
].join("\n");

export async function generateArticle(
  group: CandidateGroup,
  classification: ClassificationResult,
): Promise<GeneratedArticle> {
  const client = getAnthropicClient();
  const digest = group.items
    .slice(0, 6)
    .map((i) => `- [${i.sourceName}] ${i.title}\n  ${i.summary}`)
    .join("\n");

  const message = await client.messages.create({
    model: SONNET_MODEL,
    max_tokens: 1600,
    // Prompt caching — vezi nota din classify.ts. Aici contează și mai mult:
    // Sonnet e modelul scump din pipeline (2-15x prețul Haiku pe input).
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Subiecte identificate: ${classification.topics.join(", ") || "niciunul specific"}.\n\nScrie un articol pe baza acestor relatări despre același eveniment:\n\n${digest}`,
      },
    ],
    tools: [GENERATE_TOOL],
    tool_choice: { type: "tool", name: "genereaza_articol" },
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Generarea nu a returnat un tool_use valid.");
  }

  return toolUse.input as GeneratedArticle;
}
