import crypto from "node:crypto";
import { collectCandidates } from "@/lib/pipeline/collect";

// Colectare RSS la 30 de minute (vercel.json) — fără AI, doar fetch + insert.
// Cron-ul mai des decât zilnic cere Vercel Pro. Vercel trimite automat
// "Authorization: Bearer $CRON_SECRET" când variabila există în proiect.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    auth.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await collectCandidates());
}
