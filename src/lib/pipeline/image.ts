import { fal } from "@fal-ai/client";

export interface GeneratedImage {
  url: string;
  altText: string;
}

export type ImageTier = "schnell" | "pro";

// FLUX Schnell implicit pentru toate imaginile; FLUX Pro DOAR pentru articolul
// cu scorul de calitate cel mai mare din fiecare rulare — vezi
// plan-implementare-agregator-stiri-ai.md secțiunea 3.6 și 3.3. Diferența de
// cost per imagine e mică, dar se adună la volum — nu se apelează Pro pentru
// tot din comoditate.
//
// FLUX.1 [pro] clasic e deprecated pe fal.ai; varianta activă curentă e
// flux-pro/v1.1-ultra (verificat în docs fal.ai, nu presupus).
const MODEL_BY_TIER: Record<ImageTier, string> = {
  schnell: "fal-ai/flux/schnell",
  pro: "fal-ai/flux-pro/v1.1-ultra",
};

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const key = process.env.FAL_KEY;
  if (!key) return false;
  // Config explicită (nu auto-config din shell) — recomandarea fal.ai pentru
  // medii serverless/containere (Next.js route handlers).
  fal.config({ credentials: key });
  configured = true;
  return true;
}

interface FalImageResult {
  images?: { url: string }[];
}

const TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}: timeout după ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Fără FAL_KEY, pipeline-ul publică articole fără imagine în loc să eșueze;
// niciodată nu se descarcă imaginea direct de pe site-ul sursă (3.6).
//
// Timeout explicit obligatoriu: fal.subscribe() nu are unul implicit — dacă
// coada fal.ai rămâne blocată (ex. cont fără credit), fără acest timeout
// TOATĂ rularea pipeline-ului rămâne agățată la nesfârșit (confirmat live,
// 2026-08-11: un cont fără credit a blocat un run > 30 min pe un apel Schnell,
// deși Pro a eșuat rapid și curat cu 403).
export async function generateSymbolImage(
  prompt: string,
  tier: ImageTier = "schnell",
): Promise<GeneratedImage | null> {
  if (!ensureConfigured()) return null;

  try {
    const result = await withTimeout(
      fal.subscribe(MODEL_BY_TIER[tier], { input: { prompt } }),
      TIMEOUT_MS,
      `fal.ai (${tier})`,
    );
    const data = result.data as FalImageResult;
    const url = data.images?.[0]?.url;
    return url ? { url, altText: prompt } : null;
  } catch (err) {
    // Niciodată nu se loghează cheia sau payload-ul cererii (care ar conține
    // header-ul de autorizare) — doar mesajul de eroare returnat de fal.ai.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`fal.ai (${tier}): generare imagine eșuată — ${message}`);
    return null;
  }
}
