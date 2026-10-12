import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Citirea fișierelor din content/ pe ambele platforme:
// - Node (Vercel, `next build`, `next dev`, scripturi): direct de pe disc, ca înainte.
// - Cloudflare Workers: nu există sistem de fișiere — scripts/cloudflare/content-assets.ts
//   copiază content/ în Workers Static Assets sub CONTENT_ASSETS_PREFIX, plus un index
//   (slug-urile pe director) și câte un fișier-pachet pentru listele mari (ghiduri,
//   rețete, analize), citite prin binding-ul ASSETS. Prefixul nu e public: cloudflare/
//   worker.ts răspunde 404 la cereri directe (wrangler.jsonc: assets.run_worker_first).
//
// Pe Workers o citire ratată ARUNCĂ eroarea (pagina dă 500 și se vede în loguri) în loc
// să întoarcă o listă goală — altfel un deploy fără conținut ar publica în tăcere
// cuprinsuri goale și ar da 404 pe sute de ghiduri.

export const CONTENT_ASSETS_PREFIX = "/_continut/";
export const CONTENT_INDEX = "_index.json";
// pachetul unui director: lista tuturor fișierelor JSON, în ordinea numelor
export const bundleName = (dir: string) => `${dir.replaceAll("/", "__")}.all.json`;

type AssetsFetcher = { fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> };

// Contextul pus de worker-ul OpenNext pe globalThis (vezi @opennextjs/cloudflare,
// getCloudflareContext) — citit direct, ca acest modul să nu depindă de adaptor pe Node.
function assetsBinding(): AssetsFetcher | undefined {
  const ctx = (globalThis as Record<symbol, { env?: { ASSETS?: AssetsFetcher } } | undefined>)[
    Symbol.for("__cloudflare-context__")
  ];
  return ctx?.env?.ASSETS;
}

export const onWorkers = () => assetsBinding() !== undefined;

const ROOT = () => path.join(process.cwd(), "content");
const isMissing = (e: unknown) => (e as NodeJS.ErrnoException)?.code === "ENOENT";

async function fetchAsset(rel: string): Promise<Response> {
  const assets = assetsBinding()!;
  const res = await assets.fetch(new URL(CONTENT_ASSETS_PREFIX + rel, "https://assets.local"));
  if (!res.ok) throw new Error(`content: ${CONTENT_ASSETS_PREFIX}${rel} -> HTTP ${res.status}`);
  return res;
}

// Indexul (o dată pe izolat): { "ghiduri": ["slug", ...], "locuri/raioane": [...], ... }
let indexCache: Promise<Record<string, string[]>> | undefined;
function workersIndex(): Promise<Record<string, string[]>> {
  return (indexCache ??= fetchAsset(CONTENT_INDEX)
    .then((r) => r.json() as Promise<Record<string, string[]>>)
    .catch((e) => ((indexCache = undefined), Promise.reject(e))));
}

/** Slug-urile (numele fără .json) dintr-un director din content/, sortate. */
export async function listContent(dir: string): Promise<string[]> {
  if (onWorkers()) {
    const slugs = (await workersIndex())[dir];
    if (!slugs) throw new Error(`content: directorul „${dir}” lipsește din index`);
    return slugs;
  }
  try {
    return (await readdir(path.join(ROOT(), dir)))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5))
      .sort();
  } catch (e) {
    if (isMissing(e)) return [];
    throw e;
  }
}

/**
 * Un fișier din content/ (`dir/slug.json`). `undefined` doar dacă fișierul nu există;
 * orice altă eroare (JSON stricat, asset lipsă deși e în index) aruncă.
 */
export async function readContent<T>(dir: string, slug: string): Promise<T | undefined> {
  if (!/^[a-z0-9-]+$/.test(slug)) return undefined;
  if (onWorkers()) {
    if (!(await listContent(dir)).includes(slug)) return undefined;
    return (await (await fetchAsset(`${dir}/${slug}.json`)).json()) as T;
  }
  try {
    return JSON.parse(await readFile(path.join(ROOT(), dir, `${slug}.json`), "utf8")) as T;
  } catch (e) {
    if (isMissing(e)) return undefined;
    throw e;
  }
}

/**
 * Toate fișierele unui director. Pe Node se citesc pe rând (sute de fișiere deschise în
 * paralel depășeau limita de fișiere deschise pe Vercel — EMFILE, 2026-10-09); pe Workers
 * un singur asset-pachet (o cerere în loc de sute).
 */
export async function readAllContent<T>(dir: string): Promise<T[]> {
  if (onWorkers()) return (await (await fetchAsset(bundleName(dir))).json()) as T[];
  const out: T[] = [];
  for (const slug of await listContent(dir)) out.push((await readContent<T>(dir, slug))!);
  return out;
}

/** Directoarele care primesc fișier-pachet pe Workers (listele citite integral). */
export const BUNDLED_DIRS = ["ghiduri", "ghiduri-ru", "retete", "retete-ru", "analize"];

/** Directoarele din content/ folosite de site (copiate în assets la build-ul Cloudflare). */
export const SITE_CONTENT_DIRS = [
  ...BUNDLED_DIRS,
  "locuri/raioane",
  "locuri/tari",
  "locuri-ru/raioane",
  "locuri-ru/tari",
  "calculatoare",
  "calendar/sfinti",
  "istorie",
];
