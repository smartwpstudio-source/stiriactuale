// Worker-ul Cloudflare: împachetează worker-ul generat de OpenNext
// (.open-next/worker.js, creat de `opennextjs-cloudflare build`) și adaugă:
// - cron-urile (handler `scheduled`), echivalentul secțiunii "crons" din vercel.json;
// - blocarea accesului direct la conținutul copiat în assets (/_continut/, vezi
//   src/lib/content/store.ts) — rutat aici prin assets.run_worker_first din wrangler.jsonc.
// Documentație: https://opennext.js.org/cloudflare/howtos/custom-worker
// Nu e verificat de tsc (exclus în tsconfig: importă un fișier generat la build) —
// îl verifică esbuild-ul din wrangler la deploy/preview.

import { default as openNext } from "../.open-next/worker.js";

// Durable Objects folosite de cache (queue ISR, tag cache, purge) — trebuie
// re-exportate din worker-ul principal.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

type Env = Record<string, unknown> & { CRON_SECRET?: string; CRONS_ENABLED?: string };
type Ctx = { waitUntil(p: Promise<unknown>): void; passThroughOnException(): void };
type Controller = { cron: string; scheduledTime: number };
type Handler = { fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> };

// Aceleași orare ca în vercel.json. Cron Triggers rulează în UTC, ca la Vercel —
// rutele de rezumat aleg singure ora Chișinăului (iarnă/vară).
// Cheia = expresia cron exact cum e în wrangler.jsonc ("triggers.crons").
// Din oră în oră; fiecare rută decide singură după ora Chișinăului (src/lib/schedule.ts),
// așa că trecerea iarnă/vară nu mută nimic. Rezumatul de dimineață înaintea știrilor.
const CRONS: Record<string, string[]> = {
  "0 * * * *": [
    "/api/cron/digest/?tip=dimineata",
    "/api/cron/digest/?tip=seara",
    "/api/cron/pipeline/",
    "/api/cron/collect/",
    "/api/cron/scheduled/",
  ],
};

// Cererea internă trece prin handlerul Next (nu prin rețea); gazda e cea reală,
// pentru că OpenNext își fixează originea după prima cerere a izolatului.
const ORIGIN = "https://stiriactuale.info";

const handler = openNext as Handler;

const worker = {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    // www -> adresa fără www (la Vercel o făcea setarea domeniului)
    if (url.hostname === "www.stiriactuale.info") {
      url.hostname = "stiriactuale.info";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith("/_continut/")) {
      return new Response("Not Found", { status: 404, headers: { "x-robots-tag": "noindex" } });
    }
    return handler.fetch(request, env, ctx);
  },

  async scheduled(controller: Controller, env: Env, ctx: Ctx): Promise<void> {
    const paths = CRONS[controller.cron];
    if (!paths) {
      console.error(`cron necunoscut: ${controller.cron}`);
      return;
    }
    // Comutatorul de siguranță: cât timp site-ul live e pe Vercel, cron-urile Vercel
    // rulează și ele — dublate, ar porni pipeline-ul și rezumatele Telegram de două ori.
    // Se pornește la comutare (CRONS_ENABLED=1 în wrangler.jsonc, docs/cloudflare-migrare.md).
    if (env.CRONS_ENABLED !== "1") {
      console.log(`cron ${controller.cron}: oprit (CRONS_ENABLED != 1)`);
      return;
    }
    if (!env.CRON_SECRET) {
      console.error("CRON_SECRET lipsește — cron-urile nu rulează");
      return;
    }
    // pe rând, ca la Vercel fiecare rută e o invocare separată; o eroare nu le oprește pe celelalte
    for (const path of paths) {
      try {
        const res = await handler.fetch(
          new Request(ORIGIN + path, { headers: { authorization: `Bearer ${env.CRON_SECRET}`, "user-agent": "cloudflare-cron" } }),
          env,
          ctx,
        );
        const body = (await res.text()).slice(0, 300);
        (res.ok ? console.log : console.error)(`cron ${path}: ${res.status} ${body}`);
      } catch (e) {
        console.error(`cron ${path}: eroare`, e);
      }
    }
  },
};

export default worker;
