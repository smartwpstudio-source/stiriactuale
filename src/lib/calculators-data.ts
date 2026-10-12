import { readContent } from "./content/store";
import type { CalcParams } from "./calculators";

// Parametrii verificați ai calculatoarelor (vezi calculators.ts). Doar pe server.
// null doar dacă fișierul lipsește; o citire ratată pe Workers aruncă (vezi content/store.ts)
export async function getCalcParams(): Promise<CalcParams | null> {
  return (await readContent<CalcParams>("calculatoare", "parametri")) ?? null;
}
