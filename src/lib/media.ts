// Imaginile site-ului stau în Cloudflare R2 (bucketul stiriactuale-media),
// servite public de pe media.stiriactuale.info (mutate de pe Vercel Blob,
// 2026-10-16: pe Hobby, Blob se blochează 30 de zile la depășirea limitei).
// Pe Worker (admin) se scrie prin legătura MEDIA; în GitHub Actions (robotul,
// scripturile) prin API-ul REST Cloudflare, cu tokenul de publicare.
import { MEDIA_ORIGIN, MINI_WIDTHS, miniKey } from "./media-url";

export { MEDIA_ORIGIN };
export const MEDIA_BUCKET = "stiriactuale-media";

type R2Put = { put(key: string, value: ArrayBuffer | Uint8Array, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown> };
type ImagesBinding = {
  input(stream: ReadableStream): {
    transform(t: { width: number }): { output(o: { format: string; quality: number }): Promise<{ response(): Response }> };
  };
};
type Env = { MEDIA?: R2Put; IMAGES?: ImagesBinding };

// Contextul pus de worker-ul OpenNext pe globalThis (ca în content/store.ts).
function workerEnv(): Env | undefined {
  return (globalThis as Record<symbol, { env?: Env } | undefined>)[Symbol.for("__cloudflare-context__")]?.env;
}
const mediaBinding = () => workerEnv()?.MEDIA;

// miniatura unei poze (media-url.ts): pe Worker (admin) prin legătura IMAGES; în GitHub Actions cu sharp, care nu intră
// în pachetul Worker-ului (turbopackIgnore)
export async function renderMini(data: ArrayBuffer | Uint8Array, w: number): Promise<Uint8Array> {
  const images = workerEnv()?.IMAGES;
  if (images) {
    const out = await images.input(new Response(data as BodyInit).body!).transform({ width: w }).output({ format: "image/webp", quality: 75 });
    return new Uint8Array(await out.response().arrayBuffer());
  }
  const { default: sharp } = (await import(/* turbopackIgnore: true */ "sharp")) as typeof import("sharp");
  return sharp(data).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
}

// Sufix aleator înainte de extensie (ca addRandomSuffix la Blob): o poză nouă
// pentru același articol nu rămâne ascunsă de cache-ul vechii versiuni.
function withSuffix(path: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return /\.[a-z0-9]+$/i.test(path) ? path.replace(/(\.[a-z0-9]+)$/i, `-${suffix}$1`) : `${path}-${suffix}`;
}

export async function putMediaExact(key: string, body: ArrayBuffer | Uint8Array, contentType: string): Promise<string> {
  const binding = mediaBinding();
  if (binding) {
    await binding.put(key, body, { httpMetadata: { contentType } });
  } else {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!token || !account) throw new Error("CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID lipsesc");
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${MEDIA_BUCKET}/objects/${key.split("/").map(encodeURIComponent).join("/")}`,
      { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType }, body: body as unknown as BodyInit, signal: AbortSignal.timeout(60_000) },
    );
    if (!res.ok) throw new Error(`R2 PUT ${key}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return `${MEDIA_ORIGIN}/${key}`;
}

export async function putMedia(path: string, body: ArrayBuffer | Uint8Array | Blob, contentType: string): Promise<string> {
  const data = body instanceof Blob ? await body.arrayBuffer() : body;
  const key = withSuffix(path);
  // întâi miniaturile: o poză fără ele n-ar apărea pe site, deci eroarea oprește
  // încărcarea (pipeline-ul trece atunci la altă poză, ca la o descărcare eșuată)
  if (contentType.startsWith("image/")) {
    for (const w of MINI_WIDTHS) await putMediaExact(miniKey(key, w), await renderMini(data, w), "image/webp");
  }
  return putMediaExact(key, data, contentType);
}

export const MEDIA_CONFIGURED = () => !!mediaBinding() || !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);
