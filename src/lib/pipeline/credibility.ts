// Filtru de credibilitate, conform clasamentului CJI Media Radar — vezi
// plan-implementare-agregator-stiri-ai.md secțiunea 3.1/3.3. Pondere în scor,
// nu listă on/off: o sursă de evitat scade scorul, nu exclude automat
// candidatul (poate fi confirmat și de alte surse credibile în același grup).

import { stripDiacritics } from "./text-normalize";

const HIGH_CREDIBILITY_ALIASES: string[] = [
  "nokta",
  "agora",
  "moldova1",
  "moldova 1",
  "teleradio-moldova",
  "trm",
  "zdg",
  "ziarul de garda",
  "newsmaker",
  "ipn",
];

const LOW_CREDIBILITY_ALIASES: string[] = [
  "paranteze",
  "breakingnews",
  "breaking news",
  "kp.md",
  "komsomolskaya",
];

function normalize(name: string): string {
  return stripDiacritics(name).toLowerCase();
}

export type CredibilityTier = "high" | "neutral" | "low";

export function credibilityTierForSource(sourceName: string): CredibilityTier {
  const normalized = normalize(sourceName);
  if (HIGH_CREDIBILITY_ALIASES.some((alias) => normalized.includes(alias))) return "high";
  if (LOW_CREDIBILITY_ALIASES.some((alias) => normalized.includes(alias))) return "low";
  return "neutral";
}

// Cel mai bun tier găsit într-un grup de surse — un singur raportator credibil
// e suficient ca să ridice scorul, chiar dacă restul grupului e neutru.
export function bestCredibilityTier(sourceNames: string[]): CredibilityTier {
  const tiers = sourceNames.map(credibilityTierForSource);
  if (tiers.includes("high")) return "high";
  if (tiers.every((t) => t === "low")) return "low";
  return "neutral";
}
