import crypto from "node:crypto";
import { eveningDigest, morningDigest } from "@/lib/digest";
import { postDigestToChannel } from "@/lib/telegram";

// Rezumatele din Telegram, la 08:00 și 22:00 ora Chișinăului. Cron-ul Vercel
// e în UTC, iar Moldova schimbă ora iarna/vara: vercel.json cheamă ruta la
// ambele ore UTC posibile, aici trece doar cea care e chiar 08 / 22 local.
// Merg și cu pipeline-ul oprit (rezumă ce e publicat).
const HOURS = { dimineata: 8, seara: 22 } as const;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const tip = new URL(request.url).searchParams.get("tip");
  if (tip !== "dimineata" && tip !== "seara") return new Response("tip invalid", { status: 400 });
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Chisinau" }));
  if (hour !== HOURS[tip]) return new Response(`nu e ora (${hour}:00)`);
  const text = tip === "dimineata" ? await morningDigest() : await eveningDigest();
  if (!text) return new Response("nimic de rezumat");
  return new Response((await postDigestToChannel(text)) ? "trimis" : "eroare Telegram");
}
