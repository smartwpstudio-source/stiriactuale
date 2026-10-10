import { eq } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { pushSubscriptions } from "@/lib/pipeline/db/schema";
import { isValidEndpoint } from "@/lib/push";
import { parsePrefs } from "@/lib/push-segment";

// Abonare / dezabonare la notificări — apelat de butonul din PushOptIn.
// Fără date personale: doar adresa tehnică a browserului și cheile lui, plus
// (opțional, PATCH) raionul / țara alese de cititor. Fără IP, fără geolocalizare.

interface Body {
  endpoint?: unknown;
  scope?: unknown;
  raion?: unknown;
  country?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

const bad = () => new Response("Bad Request", { status: 400 });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const { endpoint } = body;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (typeof endpoint !== "string" || !isValidEndpoint(endpoint)) return bad();
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return bad();

  await getDb()
    .insert(pushSubscriptions)
    .values({ endpoint, p256dh, auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh, auth } });
  return new Response(null, { status: 204 });
}

export async function DELETE(request: Request) {
  const { endpoint } = (await request.json().catch(() => ({}))) as Body;
  if (typeof endpoint !== "string") return bad();
  await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return new Response(null, { status: 204 });
}

// Ce alerte vrea abonatul: toată țara / + raionul lui / diaspora dintr-o țară.
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const prefs = parsePrefs(body);
  if (typeof body.endpoint !== "string" || !isValidEndpoint(body.endpoint) || !prefs) return bad();
  const updated = await getDb()
    .update(pushSubscriptions)
    .set(prefs)
    .where(eq(pushSubscriptions.endpoint, body.endpoint))
    .returning({ id: pushSubscriptions.id });
  return new Response(null, { status: updated.length ? 204 : 404 });
}
