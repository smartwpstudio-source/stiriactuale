import crypto from "node:crypto";
import { revalidateKey } from "@/lib/revalidate";

// Curățarea cache-ului ISR din R2 (bucketul stiriactuale-cache): OpenNext scrie
// paginile sub incremental-cache/<BUILD_ID>/…, iar fiecare publicare adaugă un
// set nou, fără să-l șteargă pe cel vechi (5,3 GB după 3 zile, 2026-10-16).
// Se păstrează doar compilarea care rulează acum; restul se șterge în tranșe de
// câte 1.000. Chemat de cloudflare-deploy.yml după publicare, până la done: true.
const PREFIX = "incremental-cache/";
const BUDGET_MS = 20_000;

type R2List = { objects: { key: string }[]; delimitedPrefixes: string[]; truncated: boolean; cursor?: string };
type R2Bucket = {
  list(o: { prefix?: string; delimiter?: string; cursor?: string; limit?: number }): Promise<R2List>;
  delete(keys: string[]): Promise<void>;
};

function cacheBucket(): R2Bucket | undefined {
  const ctx = (globalThis as Record<symbol, { env?: { NEXT_INC_CACHE_R2_BUCKET?: R2Bucket } } | undefined>)[
    Symbol.for("__cloudflare-context__")
  ];
  return ctx?.env?.NEXT_INC_CACHE_R2_BUCKET;
}

export async function POST(request: Request) {
  const key = revalidateKey();
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${key}`;
  if (!key || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const bucket = cacheBucket();
  const current = process.env.OPEN_NEXT_BUILD_ID;
  // fără compilarea curentă cunoscută nu se șterge nimic (s-ar putea șterge cache-ul activ)
  if (!bucket || !current) return Response.json({ error: "fără bucket sau BUILD_ID" }, { status: 500 });

  const builds: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: PREFIX, delimiter: "/", cursor });
    builds.push(...page.delimitedPrefixes);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const old = builds.filter((p) => p !== `${PREFIX}${current}/`);

  const start = Date.now();
  let deleted = 0;
  for (const prefix of old) {
    // fără cursor: după ștergere, următoarea listare dă următoarele 1.000
    for (;;) {
      if (Date.now() - start > BUDGET_MS) return Response.json({ done: false, deleted, current, oldBuilds: old.length });
      const page = await bucket.list({ prefix, limit: 1000 });
      if (!page.objects.length) break;
      await bucket.delete(page.objects.map((o) => o.key));
      deleted += page.objects.length;
    }
  }
  return Response.json({ done: true, deleted, current, oldBuilds: old.length, builds: builds.length });
}
