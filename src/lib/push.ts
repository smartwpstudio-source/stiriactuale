import webpush from "web-push";
import { and, count, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { articles, pushSubscriptions } from "@/lib/pipeline/db/schema";

// Notificări Web Push pentru știrile de rezonanță. Reguli anti-spam (decizia
// proprietarului): max 4 pe zi, nimic între 22:00 și 07:00 (ora Chișinăului).
export const MAX_PUSH_PER_DAY = 4;
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
  const dayStart = new Date(Date.now() - 24 * 3600_000);
  const [{ sent }] = await getDb()
    .select({ sent: count() })
    .from(articles)
    .where(and(isNotNull(articles.pushSentAt), gte(articles.pushSentAt, dayStart)));
  return sent >= MAX_PUSH_PER_DAY ? `plafonul de ${MAX_PUSH_PER_DAY} notificări în 24 de ore` : null;
}

export async function sendPush(articleId: number, payload: { title: string; body: string; url: string; image?: string }) {
  webpush.setVapidDetails(
    "mailto:contact@stiriactuale.info",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const db = getDb();
  const subs = await db.select().from(pushSubscriptions);
  const expired: number[] = [];
  let delivered = 0;

  const queue = [...subs];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let s = queue.shift(); s; s = queue.shift()) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 6 * 3600, urgency: "high" }, // o știre de acum 6 ore nu mai e alertă
          );
          delivered++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) expired.push(s.id);
          else console.error(`Push eșuat (${status ?? "?"}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }),
  );

  if (expired.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired));
  await db.update(articles).set({ pushSentAt: new Date() }).where(eq(articles.id, articleId));
  return { delivered, expired: expired.length, total: subs.length };
}
