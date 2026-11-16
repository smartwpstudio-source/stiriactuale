import { MEDIA_CONFIGURED, putMedia } from "@/lib/media";
import { HAIKU_MODEL, structured } from "./llm";

const API = "https://api.magnific.com/v1"; // doar generarea, până pe 30 noiembrie
const STOCK_RESULTS = 10;
const GENERATION_TIMEOUT_MS = 120_000;

// Prefixul din Blob după care pagina afișează "Imagine generată AI" în loc de
// "Foto ilustrativă" — transparență față de cititor.
export const AI_IMAGE_PREFIX = "articole/ai-";

export interface ArticleImage {
  url: string;
  resourceId: number | null; // null = generată sau poză reală
  credit?: string; // poza reală a unei instituții: „Foto: IGSU”
  source?: string; // adresa originală a pozei comunicatului
  alt?: string; // descrierea pozei scrisă de editor — singura descriere sigură
}

// 1. Stoc gratuit: Pexels, apoi Pixabay (din 2026-11-16; Magnific s-a suspendat, cheia
//    merge până pe 30 noiembrie). Primul nefolosit încă pe site — aceeași poză pe două
//    articole arată a șablon. Id-ul Pixabay se ține negativ, ca să nu se ciocnească cu Pexels.
// 2. Altfel, generare cu Gemini („Nano Banana 2 Lite”, creditul Google din 2026-11-16, ~3 cenți
//    poza; fără limită pe zi — e ultima variantă, după poza reală, carduri și stoc). Fără cheia
//    Gemini, Flux 2 Turbo prin Magnific, cât mai există cheia (până pe 30 noiembrie).
// Fișierul se copiază în R2 (media.stiriactuale.info, src/lib/media.ts): licențele cer
// descărcarea, nu linkul direct. Fără chei sau la eroare -> articol fără imagine, nu eșec.
function magnificHeaders(): Record<string, string> | null {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key || !MEDIA_CONFIGURED()) return null;
  return { "x-magnific-api-key": key, "Content-Type": "application/json" };
}

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} la ${new URL(url).host}`);
  return res.json() as Promise<T>;
}

type Stock = { id: number; preview: string; title: string; full: string };
type PexelsPhoto = { id: number; alt?: string; src: { medium: string; large: string } };
type PixabayHit = { id: number; tags?: string; webformatURL: string; largeImageURL: string };
const pexels = (p: PexelsPhoto): Stock => ({ id: p.id, preview: p.src.medium, title: p.alt ?? "", full: p.src.large });
const pixabay = (h: PixabayHit): Stock => ({ id: -h.id, preview: h.webformatURL, title: h.tags ?? "", full: h.largeImageURL });

async function searchPexels(term: string, limit: number): Promise<Stock[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ query: term, per_page: String(limit), orientation: "landscape" });
  const { photos = [] } = await getJson<{ photos?: PexelsPhoto[] }>(`https://api.pexels.com/v1/search?${params}`, { Authorization: key });
  return photos.map(pexels);
}

async function searchPixabay(term: string, limit: number): Promise<Stock[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ key, q: term.slice(0, 100), image_type: "photo", orientation: "horizontal", safesearch: "true", per_page: String(Math.max(3, limit)) });
  const { hits = [] } = await getJson<{ hits?: PixabayHit[] }>(`https://pixabay.com/api/?${params}`);
  return hits.map(pixabay);
}

// Folosit și de /admin (înlocuire imagine) — `preview` e miniatura publică.
export async function searchStock(term: string, limit: number): Promise<Stock[]> {
  const [a, b] = await Promise.all([searchPexels(term, limit).catch(logEmpty), searchPixabay(term, limit).catch(logEmpty)]);
  return [...a, ...b];
}
const logEmpty = (err: unknown): Stock[] => (logImageError(err), []);

async function stockById(id: number): Promise<string> {
  if (id > 0) {
    const key = process.env.PEXELS_API_KEY;
    if (!key) throw new Error("PEXELS_API_KEY lipsește");
    return pexels(await getJson<PexelsPhoto>(`https://api.pexels.com/v1/photos/${id}`, { Authorization: key })).full;
  }
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error("PIXABAY_API_KEY lipsește");
  const { hits = [] } = await getJson<{ hits?: PixabayHit[] }>(`https://pixabay.com/api/?${new URLSearchParams({ key, id: String(-id) })}`);
  if (!hits[0]) throw new Error(`poza Pixabay ${-id} nu mai există`);
  return pixabay(hits[0]).full;
}

export async function stockToBlob(id: number, slug: string, full?: string): Promise<string> {
  if (!MEDIA_CONFIGURED()) throw new Error("cheia R2 (CLOUDFLARE_API_TOKEN) lipsește");
  return copyToBlob(full ?? (await stockById(id)), `articole/${slug}.jpg`);
}

// Pozele care trădează altă țară sau alt context (2026-10-26: „alegeri” cu steaguri
// SUA la Găgăuzia, tineri dintr-un grup tipic altor regiuni la Anenii Noi): ies înainte de alegere.
const FOREIGN = /\b(americans?|usa|u\.s\.?|united states|us (election|flag|vote|capitol)|uk|british|african|afro|black (man|woman|men|women|people|person|girl|boy|family|student)|diverse|diversity|multi-?(ethnic|racial|cultural)|asian|indian|latin[oa]?|hispanic|mexican|chinese|japanese|korean|arab|arabic|muslim|hijab|thanksgiving|halloween|trump|putin|zelensk\w*|biden|harris|macron|merz|scholz|erdogan|orban|netanyahu|xi jinping|kim jong|lukashenk\w*|president|politician|celebrity)\b/i;

// Haiku alege, după titlurile pozelor, pe cea care arată subiectul principal
// al știrii (drona, nu câmpul). Niciuna potrivită -> poza generată.
async function pickStock<T extends { id: number; title: string }>(subject: string, results: T[]): Promise<T[]> {
  results = results.filter((r) => !FOREIGN.test(r.title));
  if (!results.length) return [];
  try {
    const { best } = await structured<{ best: number[] }>({
      model: HAIKU_MODEL,
      system:
        "Alegi fotografia ilustrativă pentru o știre din Republica Moldova. Potrivită = arată SUBIECTUL PRINCIPAL al știrii (obiectul, evenimentul), nu doar decorul sau o temă vagă. Respingi orice poză care trădează altă țară: steaguri, simboluri, uniforme, inscripții sau sărbători străine (alegeri americane, poliție americană). Oamenii din poză trebuie să poată fi din Moldova (Europa de Est). Răspunzi cu numerele pozelor potrivite, cea mai bună prima; listă goală dacă niciuna nu arată subiectul.",
      prompt: `Știrea: ${subject}\n\nPoze:\n${results.map((r, i) => `${i}. ${r.title}`).join("\n")}`,
      schema: { type: "object", properties: { best: { type: "array", items: { type: "integer" } } }, required: ["best"] },
      maxBudgetUsd: 0.05,
    });
    return best.map((i) => results[i]).filter(Boolean);
  } catch (err) {
    logImageError(err);
    return results.slice(0, 3); // fără verdict: primele, ca înainte
  }
}

// Poza de stoc nu are voie să inducă în eroare despre locul știrii (2026-11-02, regula
// proprietarului: la maternitatea din Criuleni, un cadru medical dintr-un stoc străin, care
// nu poate fi luat drept personalul spitalului). Titlul pozei nu ajunge („Caucasian couple…”
// avea în imagine și altă persoană), așa că Haiku vede pozele. Fără verdict, nicio poză.
const PEOPLE_CHECK = 5;
async function fitsPlace<T extends { id: number; preview: string; data?: string }>(photos: T[], subject: string): Promise<T[]> {
  const got = (
    await Promise.all(
      photos.slice(0, PEOPLE_CHECK).map(async (p) => {
        if (p.data) return { p, data: p.data }; // poza generată, deja în memorie
        const res = await fetch(p.preview, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok || res.headers.get("content-type") !== "image/jpeg") return null;
        return { p, data: Buffer.from(await res.arrayBuffer()).toString("base64") };
      }).map((x) => x.catch(() => null)),
    )
  ).filter((x) => x !== null);
  if (!got.length) return [];
  try {
    const { clean } = await structured<{ clean: boolean[] }>({
      model: HAIKU_MODEL,
      system: "Verifici fotografii de stoc. Răspunzi doar cu câmpurile cerute.",
      prompt: `Știrea: ${subject}

Pentru fiecare dintre cele ${got.length} poze, în ordine: true dacă poza poate fi luată drept fotografie făcută la locul știrii, fără să inducă în eroare. La o știre din Republica Moldova: fără oameni în poză, sau toți oamenii au aspect european, ca populația locală, iar decorul și inscripțiile pot fi din Europa de Est. La o știre din altă țară: oamenii și decorul se potrivesc acelei țări. La orice dubiu: false.`,
      schema: { type: "object", properties: { clean: { type: "array", items: { type: "boolean" } } }, required: ["clean"] },
      maxBudgetUsd: 0.1,
      images: got.map((x) => x.data),
    });
    return got.filter((_, i) => clean[i] === true).map((x) => x.p);
  } catch (err) {
    logImageError(err);
    return [];
  }
}

// Poza reală (a unei instituții) copiată în Blob, cu semnătura ei.
export async function sourcePhoto(photo: { url: string; credit: string }, slug: string): Promise<ArticleImage | null> {
  try {
    return { url: await copyToBlob(photo.url, `articole/${slug}.jpg`), resourceId: null, credit: photo.credit, source: photo.url };
  } catch (err) {
    logImageError(err);
    return null;
  }
}

export async function findArticleImage(
  stockQuery: string,
  imagePrompt: string,
  slug: string,
  usedIds: Set<number>,
  subject: string,
): Promise<ArticleImage | null> {
  if (!MEDIA_CONFIGURED()) return null;
  // Fiecare pas are propriul try: o poză anume poate da eroare la descărcare —
  // trecem la următoarea, apoi la generare.
  try {
    const fresh = (await searchStock(stockQuery, STOCK_RESULTS)).filter((r) => !usedIds.has(r.id));
    for (const { id, full } of await fitsPlace(await pickStock(subject, fresh), subject)) {
      usedIds.add(id); // înainte de primul await — rulările paralele văd rezervarea
      try {
        return { url: await stockToBlob(id, slug, full), resourceId: id };
      } catch (err) {
        logImageError(err);
      }
    }
  } catch (err) {
    logImageError(err);
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      // aceeași verificare și pentru poza generată: dacă nu trece, se trece la cardul temei
      const jpeg = await generateGemini(imagePrompt);
      if (!(await fitsPlace([{ id: 0, preview: "", data: jpeg.toString("base64") }], subject)).length) return null;
      return { url: await putMedia(`${AI_IMAGE_PREFIX}${slug}.jpg`, jpeg, "image/jpeg"), resourceId: null };
    } catch (err) {
      logImageError(err);
      return null;
    }
  }
  const headers = magnificHeaders();
  if (!headers) return null;
  try {
    const generated = await generate(imagePrompt, headers);
    if (!(await fitsPlace([{ id: 0, preview: generated }], subject)).length) return null;
    return { url: await copyToBlob(generated, `${AI_IMAGE_PREFIX}${slug}.jpg`), resourceId: null };
  } catch (err) {
    logImageError(err);
    return null;
  }
}

// Niciodată cheia sau header-ele în log — doar mesajul.
function logImageError(err: unknown) {
  console.error(`Poză: eșuată — ${err instanceof Error ? err.message : String(err)}`);
}

const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-lite-image";
const NO_TEXT =
  "Realistic editorial news photograph, natural light. Absolutely no text, letters, numbers, signs, posters with writing or logos anywhere in the image. No identifiable faces, no real or famous people, no politicians.";

async function generateGemini(prompt: string): Promise<Buffer> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}. ${NO_TEXT}` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const r = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
  const b64 = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) throw new Error("Gemini: fără imagine în răspuns");
  return Buffer.from(b64, "base64");
}

async function generate(prompt: string, headers: Record<string, string>): Promise<string> {
  const endpoint = `${API}/ai/text-to-image/flux-2-turbo`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      prompt: `${prompt}. Realistic editorial news photograph, natural light, no text, no logos, no identifiable faces, no real or famous people, no politicians.`,
      image_size: { width: 1280, height: 720 },
      enable_safety_checker: true,
      output_format: "jpeg",
    }),
  });
  if (!res.ok) throw new Error(`generare HTTP ${res.status}`);
  const { data } = (await res.json()) as { data: { task_id: string } };

  const deadline = Date.now() + GENERATION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await fetch(`${endpoint}/${data.task_id}`, { headers, signal: AbortSignal.timeout(30_000) });
    if (!poll.ok) throw new Error(`status generare HTTP ${poll.status}`);
    const task = ((await poll.json()) as { data: { status: string; generated?: string[] } }).data;
    if (task.status === "COMPLETED" && task.generated?.[0]) return task.generated[0];
    if (task.status === "FAILED") throw new Error("generare eșuată");
  }
  throw new Error("generare: timeout");
}

export async function copyToBlob(sourceUrl: string, path: string): Promise<string> {
  const file = await fetch(sourceUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!file.ok) throw new Error(`fișier HTTP ${file.status}`);
  return putMedia(path, new Uint8Array(await file.arrayBuffer()), file.headers.get("content-type") ?? "image/jpeg");
}
