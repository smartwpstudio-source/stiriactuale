import os from "node:os";
import { query } from "@anthropic-ai/claude-agent-sdk";

// Apelurile către Claude trec prin Agent SDK, autentificat cu abonamentul Max
// (CLAUDE_CODE_OAUTH_TOKEN, generat cu `claude setup-token`) — consumă din
// creditul lunar Agent SDK al abonamentului (100$ pe Max 5x), nu facturare API.
// Când creditul se termină, cererile se opresc: plafon natural de cheltuieli.
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";
export const OPUS_MODEL = "claude-opus-5-5";

// ANTHROPIC_API_KEY are prioritate față de token-ul de abonament în Claude
// Code — dacă ar fi prezentă în mediu, s-ar factura API-ul. O scoatem explicit.
const env: Record<string, string | undefined> = { ...process.env };
delete env.ANTHROPIC_API_KEY;

let totalCostUsd = 0;
export const spentUsd = () => totalCostUsd;

export async function structured<T>(opts: {
  model: string;
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxBudgetUsd: number;
}): Promise<T> {
  for await (const m of query({
    prompt: opts.prompt,
    options: {
      model: opts.model,
      systemPrompt: opts.system,
      tools: [],
      settingSources: [],
      persistSession: false,
      cwd: os.tmpdir(), // fără CLAUDE.md-ul proiectului în context
      env,
      maxBudgetUsd: opts.maxBudgetUsd,
      outputFormat: { type: "json_schema", schema: opts.schema },
    },
  })) {
    if (m.type !== "result") continue;
    totalCostUsd += m.total_cost_usd;
    if (m.subtype !== "success" || m.structured_output === undefined) {
      throw new Error(`Claude: ${m.subtype}`);
    }
    return m.structured_output as T;
  }
  throw new Error("Claude: niciun rezultat");
}
