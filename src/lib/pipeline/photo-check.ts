import sharp from "sharp";
import { HAIKU_MODEL, structured } from "./llm";

// Pozele din corpul surselor intră în articol doar dacă arată subiectul știrii
// (2026-10-31: Radio Chișinău și TV8 aduceau miniaturi „alte știri”, Newsmaker un
// banner de premii, TV8 portretele prezentatorilor). Haiku vede fiecare poză micșorată
// la 512 px; la orice eroare, nicio poză — mai bine fără decât cu una străină.
export async function photosMatch(images: Uint8Array[], subject: string): Promise<boolean[]> {
  if (!images.length) return [];
  const previews = await Promise.all(images.map(async (d) => (await sharp(d).resize({ width: 512, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer()).toString("base64")));
  const { keep } = await structured<{ keep: boolean[] }>({
    model: HAIKU_MODEL,
    system: "Verifici pozele pentru un articol de știri. Răspunzi doar cu câmpurile cerute.",
    prompt: `Știrea: ${subject}\n\nPentru fiecare dintre cele ${images.length} poze, în ordine: true doar dacă e o fotografie reală care arată subiectul acestei știri (locul, oamenii, obiectele, documentul despre care e vorba). false pentru: bannere, reclame, afișe de evenimente sau premii, portretul unui prezentator / autor, sigle, capturi cu titlul altei știri, poze despre alt subiect.`,
    schema: { type: "object", properties: { keep: { type: "array", items: { type: "boolean" } } }, required: ["keep"] },
    maxBudgetUsd: 0.1,
    images: previews,
  }).catch((err) => (console.error(`Verificarea pozelor: ${err instanceof Error ? err.message : err}`), { keep: [] as boolean[] }));
  return images.map((_, i) => keep[i] === true);
}
