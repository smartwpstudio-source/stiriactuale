import { putMediaExact, MEDIA_ORIGIN } from "../../src/lib/media";

// Test al pozelor generate prin API-ul Gemini (creditul Google de $10, 2026-11-16): aceleași
// subiecte pe modelul Imagen „fast” și pe modelul de imagine Gemini („Nano Banana”), urcate
// în R2 la test-gemini/ ca editorul să compare calitatea. Cheia nu apare în log.
// Rulare: workflow-ul „Test poze Gemini” (GEMINI_API_KEY, CLOUDFLARE_API_TOKEN/ACCOUNT_ID).
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("GEMINI_API_KEY lipsește");
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const headers = { "x-goog-api-key": KEY, "Content-Type": "application/json" };
const STYLE =
  "Realistic editorial news photograph, natural light, Eastern European setting (Republic of Moldova), no text, no logos, no identifiable faces, no famous people.";

const SUBJECTS = (process.env.SUBJECTS || "")
  .split("|")
  .map((s) => s.trim())
  .filter(Boolean);
const subjects = SUBJECTS.length
  ? SUBJECTS
  : [
      "A rural school classroom in a Moldovan village in winter, old wooden desks, a wood stove",
      "A police patrol car stopped on a rural road at dusk, a traffic officer checking a driver",
      "Sunflower husk briquettes stacked in a small workshop in a Moldovan village",
    ];

type Model = { name: string; supportedGenerationMethods?: string[] };
async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(120_000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

const { models = [] } = await api<{ models?: Model[] }>("models?pageSize=1000");
const imageModels = models.map((m) => m.name.replace("models/", "")).filter((n) => /imagen|image/i.test(n));
console.log("Modele de imagine disponibile:", imageModels.join(", ") || "niciunul");

const pick = (re: RegExp) => imageModels.filter((n) => re.test(n)).sort().at(-1);
const imagen = pick(/^imagen.*fast/) ?? pick(/^imagen/);
const gemini = pick(/^gemini.*flash.*image/) ?? pick(/^gemini.*image/);
console.log(`Aleși: Imagen = ${imagen ?? "-"}, Gemini = ${gemini ?? "-"}`);

async function viaImagen(model: string, prompt: string): Promise<Buffer> {
  const r = await api<{ predictions?: { bytesBase64Encoded?: string }[] }>(`models/${model}:predict`, {
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: "16:9" },
  });
  const b64 = r.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("fără imagine în răspuns");
  return Buffer.from(b64, "base64");
}

async function viaGemini(model: string, prompt: string): Promise<Buffer> {
  const r = await api<{ candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] }>(`models/${model}:generateContent`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
  });
  const b64 = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) throw new Error("fără imagine în răspuns");
  return Buffer.from(b64, "base64");
}

const stamp = Date.now().toString(36);
for (const [i, subject] of subjects.entries()) {
  const prompt = `${subject}. ${STYLE}`;
  for (const [label, model, fn] of [
    ["imagen", imagen, viaImagen],
    ["gemini", gemini, viaGemini],
  ] as const) {
    if (!model) continue;
    try {
      const png = await fn(model, prompt);
      const url = await putMediaExact(`test-gemini/${stamp}-${i + 1}-${label}.png`, png, "image/png");
      console.log(`OK ${label} (${model}) #${i + 1}: ${url.startsWith("http") ? url : `${MEDIA_ORIGIN}/${url}`}`);
    } catch (err) {
      console.log(`EȘEC ${label} (${model}) #${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
