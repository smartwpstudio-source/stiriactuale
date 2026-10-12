import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles, pushSubscriptions } from "@/lib/pipeline/db/schema";
import { receives, type PushPrefs } from "@/lib/push-segment";
import { deliverPush } from "@/lib/push-deliver";

// Notificări Web Push: manual din /admin (butonul rămâne) și, din 2026-10-11,
// automat din pipeline, dar DOAR după reguli stricte (src/lib/pipeline/auto-push.ts:
// pushWorthy + lege/modificare/decizie/tarif adoptat sau urgență, calamitate,
// vreme periculoasă, alertă 112/IGSU; fără Lumea, pe scurt, analize). Fără plafon
// zilnic; un singur push per articol (pushSentAt). Rămân orele de liniște:
// nimic între 22:00 și 07:00 (ora Chișinăului). Din 2026-10-11 pe segmente:
// știrile locale / din diaspora merg doar la cine a ales acel raion / țară
// (src/lib/push-segment.ts).
const QUIET_FROM = 22;
const QUIET_TO = 7;
const CONCURRENCY = 20;

// Doar serviciile push ale browserelor — altfel endpoint-ul ar fi un URL
// arbitrar spre care serverul nostru face POST (abuz).
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|push\.apple\.com)$/;

export function isValidEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}

function chisinauHour(d = new Date()): number {
  return Number(d.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Chisinau" }));
}

// De ce NU se trimite acum (null = se poate trimite).
export async function pushBlockedReason(): Promise<string | null> {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "cheile VAPID lipsesc";
  const h = chisinauHour();
  if (h >= QUIET_FROM || h < QUIET_TO) return `ore de liniște (${QUIET_FROM}:00–0${QUIET_TO}:00)`;
  return null;
}

type Target = Parameters<typeof receives>[1];

// Preferințele tuturor abonaților, fără chei — pentru contoarele din /admin.
export async function pushAudience(): Promise<PushPrefs[]> {
  const rows = await getDb()
    .select({ scope: pushSubscriptions.scope, raion: pushSubscriptions.raion, country: pushSubscriptions.country })
    .from(pushSubscriptions);
  return rows as PushPrefs[];
}

export async function sendPush(
  articleId: number,
  target: Target,
  payload: { title: string; body: string; url: string; image?: string },
) {
  webpush.setVapidDetails(
    "mailto:contact@stiriactuale.info",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const db = getDb();
  const subs = (await db.select().from(pushSubscriptions)).filter((s) => receives(s as PushPrefs, target));
  if (!subs.length) return { delivered: 0, expired: 0, total: 0 }; // nimeni în segment: nu se marchează trimisă
  const expired: number[] = [];
  let delivered = 0;

  const queue = [...subs];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let s = queue.shift(); s; s = queue.shift()) {
        try {
          const status = await deliverPush(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          );
          if (status >= 200 && status < 300) delivered++;
          else if (status === 404 || status === 410) expired.push(s.id);
          else console.error(`Push eșuat (${status})`);
        } catch (err) {
          console.error(`Push eșuat (?): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }),
  );

  if (expired.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired));
  await db.update(articles).set({ pushSentAt: new Date() }).where(eq(articles.id, articleId));
  return { delivered, expired: expired.length, total: subs.length };
}
