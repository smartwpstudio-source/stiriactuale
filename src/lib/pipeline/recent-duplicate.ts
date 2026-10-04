import { HAIKU_MODEL, structured } from "./llm";
import { stripDiacritics } from "./text-normalize";
import type { CandidateGroup } from "./types";

// A doua verificare de dubluri, după clasificator: în lotul mare (40 de grupuri
// x 80 de articole) Haiku ratează uneori că știrea a fost deja publicată altfel
// formulată (2026-10-04: „cod roșu în Spania” de două ori). Aici, per grup, se
// aleg articolele din ultimele 48h cu cuvinte-cheie comune și se întreabă AI-ul
// doar despre ele.
export interface RecentArticle {
  id: number;
  title: string;
  lead: string;
}

const STOP = new Set("pentru care este sunt fost dupa despre intre catre pana cand unde cine acest aceasta acum doar spune anul astazi moldova republica republicii chisinau poate trebuie foarte multe noua noul".split(" "));
const MIN_SHARED = 3;

function stems(text: string): Set<string> {
  return new Set(
    stripDiacritics(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
      .map((w) => w.slice(0, 6)),
  );
}

export function similarRecent(group: CandidateGroup, recent: RecentArticle[], max = 3): RecentArticle[] {
  const g = stems(group.items.slice(0, 3).map((i) => `${i.title} ${i.summary.slice(0, 300)}`).join(" "));
  return recent
    .map((r) => ({ r, n: [...stems(`${r.title} ${r.lead}`)].filter((s) => g.has(s)).length }))
    .filter((x) => x.n >= MIN_SHARED)
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((x) => x.r);
}

export type RecentVerdict = { duplicateOf?: number; continuesId?: number };

export async function checkRecent(group: CandidateGroup, recent: RecentArticle[]): Promise<RecentVerdict> {
  const similar = similarRecent(group, recent);
  if (!similar.length) return {};
  try {
    const { verdict, index } = await structured<{ verdict: "dublura" | "continuare" | "diferit"; index: number }>({
      model: HAIKU_MODEL,
      system:
        "Compari o știre nouă cu articole deja publicate pe site. dublura = același fapt, fără nimic nou important (altă formulare, altă sursă, alte detalii mărunte). continuare = același subiect, dar cu informații noi importante (reacții oficiale, cifre noi, decizii, consecințe). diferit = alt eveniment. index = numărul articolului publicat la care se referă verdictul (-1 la diferit).",
      prompt: `Știrea nouă:\n${group.items.slice(0, 3).map((i) => `- ${i.title}: ${i.summary.slice(0, 400)}`).join("\n")}\n\nArticole publicate:\n${similar.map((r, i) => `${i}. ${r.title} — ${r.lead}`).join("\n")}`,
      schema: {
        type: "object",
        properties: { verdict: { type: "string", enum: ["dublura", "continuare", "diferit"] }, index: { type: "integer" } },
        required: ["verdict", "index"],
      },
      maxBudgetUsd: 0.05,
    });
    const hit = similar[index];
    if (!hit) return {};
    return verdict === "dublura" ? { duplicateOf: hit.id } : verdict === "continuare" ? { continuesId: hit.id } : {};
  } catch {
    return {}; // fără verdict: rămâne decizia clasificatorului
  }
}
