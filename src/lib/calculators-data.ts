import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CalcParams } from "./calculators";

// Parametrii verificați ai calculatoarelor (vezi calculators.ts). Doar pe server.
export async function getCalcParams(): Promise<CalcParams | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "content", "calculatoare", "parametri.json"), "utf8"));
  } catch {
    return null;
  }
}
