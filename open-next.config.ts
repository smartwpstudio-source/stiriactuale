import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import { purgeCache } from "@opennextjs/cloudflare/overrides/cache-purge/index";

// Cache-ul ISR pe Cloudflare (https://opennext.js.org/cloudflare/caching), configurația
// recomandată pentru „site mare cu revalidare la cerere” (/api/revalidate/ după fiecare
// rulare a pipeline-ului):
// - paginile generate: R2 (NEXT_INC_CACHE_R2_BUCKET), cu un cache regional în fața lui
//   (Cache API, per centru de date). Pe Next 16 cache-ul regional verifică totuși tag
//   cache-ul la fiecare hit, deci revalidatePath are efect imediat și fără purge.
// - revalidatePath / revalidateTag: tag cache pe Durable Objects, pe shard-uri
//   (NEXT_TAG_CACHE_DO_SHARDED) — documentația îl recomandă când revalidările sunt dese;
//   D1 (d1NextTagCache) ar fi alternativa pentru un site mic.
// - regenerarea în fundal (ISR după ceas): coada pe Durable Objects (NEXT_CACHE_DO_QUEUE).
// - purge: prin Durable Object (NEXT_CACHE_DO_PURGE), care adună tag-urile câteva secunde
//   și cheamă API-ul Cloudflare. DEZACTIVAT cât timp lipsesc secretele CACHE_PURGE_ZONE_ID
//   și CACHE_PURGE_API_TOKEN (atunci doar loghează „Skipping cache purge”). Nu e necesar
//   pentru corectitudine (vezi mai sus); doar golește mai repede cache-ul regional.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 12, regionalCache: true, regionalCacheTtlSec: 5 }),
  cachePurge: purgeCache({ type: "durableObject" }),
  enableCacheInterception: true,
});
