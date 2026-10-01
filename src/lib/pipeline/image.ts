import { put } from "@vercel/blob";

const API = "https://api.magnific.com/v1";
const STOCK_RESULTS = 5;
const GENERATION_TIMEOUT_MS = 120_000;

// Prefixul din Blob după care pagina afișează "Imagine generată AI" în loc de
// "Foto ilustrativă" — transparență față de cititor.
export const AI_IMAGE_PREFIX = "articole/ai-";

export interface ArticleImage {
  url: string;
  resourceId: number | null; // null = generată
}

// 1. Stock Magnific: gratuit pe Premium+ (max 100/zi), primul din top 5
//    nefolosit încă pe site — aceeași poză pe două articole arată a șablon.
// 2. Altfel, generare Flux 2 Turbo prin API. Consumă credite din abonament:
//    "Unlimited" (Nano Banana) e doar în aplicația web, iar Nano Banana nu
//    există deloc în API-ul Magnific (verificat 2026-10-01).
// URL-urile Magnific sunt semnate și expiră, așa că fișierul se copiază în
// Vercel Blob. Fără chei sau la eroare -> articol fără imagine, nu eșec.
function magnificHeaders(): Record<string, string> | null {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key || !process.env.BLOB_READ_WRITE_TOKEN) return null;
  return { "x-magnific-api-key": key, "Content-Type": "application/json" };
}

async function getJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} la ${url.replace(API, "").split("?")[0]}`);
  return res.json() as Promise<T>;
}

// Folosit și de /admin (înlocuire imagine) — `preview` e miniatura publică.
export async function searchStock(term: string, limit: number): Promise<{ id: number; preview: string }[]> {
  const headers = magnificHeaders();
  if (!headers) return [];
  const params = new URLSearchParams({
    term,
    limit: String(limit),
    order: "relevance",
    "filters[content_type][photo]": "1",
    "filters[orientation][landscape]": "1",
  });
  const { data = [] } = await getJson<{ data?: { id: number; image?: { source?: { url?: string } } }[] }>(
    `${API}/resources?${params}`,
    headers,
  );
  return data.map((r) => ({ id: r.id, preview: r.image?.source?.url ?? "" }));
}

export async function stockToBlob(id: number, slug: string): Promise<string> {
  const headers = magnificHeaders();
  if (!headers) throw new Error("MAGNIFIC_API_KEY / BLOB_READ_WRITE_TOKEN lipsesc");
  const { data } = await getJson<{ data: { url?: string; signed_url?: string } }>(
    `${API}/resources/${id}/download?image_size=small`,
    headers,
  );
  return copyToBlob(data.url ?? data.signed_url!, `articole/${slug}.jpg`);
}

export async function findArticleImage(
  stockQuery: string,
  imagePrompt: string,
  slug: string,
  usedIds: Set<number>,
): Promise<ArticleImage | null> {
  const headers = magnificHeaders();
  if (!headers) return null;
  // Fiecare pas are propriul try: Magnific dă uneori HTTP 500 la descărcarea
  // unei poze anume — trecem la următoarea, apoi la generare.
  try {
    for (const { id } of (await searchStock(stockQuery, STOCK_RESULTS)).filter((r) => !usedIds.has(r.id))) {
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
      prompt: `${prompt}. Realistic editorial news photograph, natural light, no text, no logos, no identifiable faces.`,
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

async function copyToBlob(sourceUrl: string, path: string): Promise<string> {
  const file = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
  if (!file.ok) throw new Error(`fișier HTTP ${file.status}`);
  const blob = await put(path, Buffer.from(await file.arrayBuffer()), {
    access: "public",
    contentType: file.headers.get("content-type") ?? "image/jpeg",
    addRandomSuffix: true,
  });
  return blob.url;
}
