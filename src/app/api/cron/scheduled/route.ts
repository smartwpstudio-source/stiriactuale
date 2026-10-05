import crypto from "node:crypto";
import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/pipeline/db/client";
import { scheduledPosts } from "@/lib/pipeline/db/schema";
import { postScheduledToChannel } from "@/lib/telegram";

// Trimite postările programate ajunse la termen (scheduled_posts), câte una
// pe rulare — să nu plece mai multe deodată dacă s-au adunat.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = getDb();
  const [due] = await db
    .select()
    .from(scheduledPosts)
    .where(and(isNull(scheduledPosts.sentAt), lte(scheduledPosts.runAt, new Date())))
    .orderBy(asc(scheduledPosts.runAt))
    .limit(1);
  if (!due) return new Response("nimic programat");
  // marcată înainte de trimitere: o eroare nu duce la postări duble
  await db.update(scheduledPosts).set({ sentAt: new Date() }).where(eq(scheduledPosts.id, due.id));
  return new Response((await postScheduledToChannel(due.text, due.pin)) ? `trimis ${due.id}` : "eroare Telegram");
}
