import webpush from "web-push";

// Criptarea (aes128gcm) și semnătura VAPID le face web-push; trimiterea, prin fetch:
// sendNotification din web-push folosește https.request din Node, care nu merge pe
// Cloudflare Workers — fetch merge la fel pe Node și pe Workers.
export async function deliverPush(sub: webpush.PushSubscription, body: string): Promise<number> {
  const d = webpush.generateRequestDetails(sub, body, { TTL: 6 * 3600, urgency: "high" }); // o știre de acum 6 ore nu mai e alertă
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.headers)) if (k.toLowerCase() !== "content-length") headers[k] = String(v);
  const res = await fetch(d.endpoint, {
    method: d.method,
    headers,
    body: d.body ? new Uint8Array(d.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  await res.body?.cancel();
  return res.status;
}
