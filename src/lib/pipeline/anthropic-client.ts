import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY lipsește — adaugă-l în .env.local.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// clasificare (volum mare, task simplu) vs. generare (calitate scris) —
// vezi plan-implementare-agregator-stiri-ai.md secțiunea 5.
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";
export const SONNET_MODEL = "claude-sonnet-5";
