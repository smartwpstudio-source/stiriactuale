import { MEDIA_CONFIGURED, putMedia } from "@/lib/media";
import { HAIKU_MODEL, structured } from "./llm";

const API = "https://api.magnific.com/v1";
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

// 1. Stock Magnific: gratuit pe Premium+ (max 100/zi), primul din top 5
//    nefolosit încă pe site — aceeași poză pe două articole arată a șablon.
// 2. Altfel, generare Flux 2 Turbo prin API. Consumă credite din abonament:
//    "Unlimited" (Nano Banana) e doar în aplicația web, iar Nano Banana nu
//    există deloc în API-ul Magnific (verificat 2026-10-01).
// URL-urile Magnific sunt semnate și expiră, așa că fișierul se copiază în
// R2 (media.stiriactuale.info, src/lib/media.ts). Fără chei sau la eroare -> articol fără imagine, nu eșec.
function magnificHeaders(): Record<string, string> | null {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key || !MEDIA_CONFIGURED()) return null;
  return { "x-magnific-api-key": key, "Content-Type": "application/json" };
}

async function getJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} la ${url.replace(API, "").split("?")[0]}`);
  return res.json() as Promise<T>;
}

// Folosit și de /admin (înlocuire imagine) — `preview` e miniatura publică.
export async function searchStock(term: string, limit: number): Promise<{ id: number; preview: string; title: string }[]> {
  const headers = magnificHeaders();
  if (!headers) return [];
  const params = new URLSearchParams({
    term,
    limit: String(limit),
    order: "relevance",
    "filters[content_type][photo]": "1",
    "filters[orientation][landscape]": "1",
  });
  const { data = [] } = await getJson<{ data?: { id: number; title?: string; image?: { source?: { url?: string } } }[] }>(
    `${API}/resources?${params}`,
    headers,
  );
  return data.map((r) => ({ id: r.id, preview: r.image?.source?.url ?? "", title: r.title ?? "" }));
}

export async function stockToBlob(id: number, slug: string): Promise<string> {
  const headers = magnificHeaders();
  if (!headers) throw new Error("MAGNIFIC_API_KEY / cheia R2 (CLOUDFLARE_API_TOKEN) lipsesc");
  const { data } = await getJson<{ data: { url?: string; signed_url?: string } }>(
    `${API}/resources/${id}/download?image_size=small`,
    headers,
  );
  return copyToBlob(data.url ?? data.signed_url!, `articole/${slug}.jpg`);
}

// Pozele care trădează altă țară sau alt context (2026-10-26: „alegeri” cu steaguri
// SUA la Găgăuzia, tineri dintr-un grup tipic altor regiuni la Anenii Noi): ies înainte de alegere.
const FOREIGN = /\b(americans?|usa|u\.s\.?|united states|us (election|flag|vote|capitol)|uk|british|african|afro|black (man|woman|men|women|people|person|girl|boy|family|student)|diverse|diversity|multi-?(ethnic|racial|cultural)|asian|indian|latin[oa]?|hispanic|mexican|chinese|japanese|korean|arab|arabic|muslim|hijab|thanksgiving|halloween|trump|putin|zelensk\w*|biden|harris|macron|merz|scholz|erdogan|orban|netanyahu|xi jinping|kim jong|lukashenk\w*|president|politician|celebrity)\b/i;

// Haiku alege, după titlurile pozelor, pe cea care arată subiectul principal
// al știrii (drona, nu câmpul). Niciuna potrivită -> poza generată.
async function pickStock(subject: string, results: { id: number; title: string }[]): Promise<{ id: number; title: string }[]> {
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
  const headers = magnificHeaders();
  if (!headers) return null;
  // Fiecare pas are propriul try: Magnific dă uneori HTTP 500 la descărcarea
  // unei poze anume — trecem la următoarea, apoi la generare.
  try {
    const fresh = (await searchStock(stockQuery, STOCK_RESULTS)).filter((r) => !usedIds.has(r.id));
    for (const { id } of await pickStock(subject, fresh)) {
      usedIds.add(id); // înainte de primul await — rulările paralele văd rezervarea
      try {
        return { url: await stockToBlob(id, slug), resourceId: id };
      } catch (err) {
        logImageError(err);
      }
    }
  } catch (err) {
    logImageError(err);
  }
  try {
    return { url: await copyToBlob(await generate(imagePrompt, headers), `${AI_IMAGE_PREFIX}${slug}.jpg`), resourceId: null };
  } catch (err) {
    logImageError(err);
    return null;
  }
}

// Niciodată cheia sau header-ele în log — doar mesajul.
function logImageError(err: unknown) {
  console.error(`Magnific: imagine eșuată — ${err instanceof Error ? err.message : String(err)}`);
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
