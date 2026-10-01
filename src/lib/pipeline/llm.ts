import os from "node:os";
import { query } from "@anthropic-ai/claude-agent-sdk";

// Apelurile către Claude trec prin Agent SDK, autentificat cu abonamentul Max
// (CLAUDE_CODE_OAUTH_TOKEN, generat cu `claude setup-token`) — consumă din
// limitele abonamentului, nu facturare API (creditul separat Agent SDK e
// suspendat de Anthropic, 2026-10). Cu usage credits OFF, la limită cererile
// se opresc — nu se facturează nimic în plus.
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";
export const OPUS_MODEL = "claude-opus-5-5";

// ANTHROPIC_API_KEY are prioritate față de token-ul de abonament în Claude
// Code — dacă ar fi prezentă în mediu, s-ar factura API-ul. O scoatem explicit.
// Citit la FIECARE apel, nu la încărcarea modulului: scripturile încarcă
// .env.local după importuri, iar o copie făcută devreme n-ar avea token-ul.
function claudeEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  if (!env.CLAUDE_CODE_OAUTH_TOKEN) throw new Error("CLAUDE_CODE_OAUTH_TOKEN lipsește");
  return env;
}

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
      env: claudeEnv(),
      maxBudgetUsd: opts.maxBudgetUsd,
      outputFormat: { type: "json_schema", schema: opts.schema },
    },
  })) {
    if (m.type !== "result") continue;
    totalCostUsd += m.total_cost_usd;
    if (m.subtype !== "success" || m.is_error) throw new Error(`Claude: ${m.subtype} — ${"result" in m ? m.result : ""}`);
    if (m.structured_output !== undefined) return m.structured_output as T;
    // Uneori modelul răspunde cu JSON-ul ca text, fără unealta StructuredOutput
    // (observat la Haiku) — SDK-ul raportează "success" cu structured_output gol.
    try {
      return JSON.parse(m.result.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
    } catch {
      throw new Error(`Claude: răspuns fără JSON — ${m.result.slice(0, 200)}`);
    }
  }
  throw new Error("Claude: niciun rezultat");
}
