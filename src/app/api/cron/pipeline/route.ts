import crypto from "node:crypto";
import { dispatchPipeline } from "@/lib/pipeline-dispatch";
import { pipelineEnabled } from "@/lib/pipeline/settings";
import { chisinauHour, isPipelineHour } from "@/lib/schedule";

// Pornește pipeline-ul exact la oră. Orarul propriu al GitHub ("schedule")
// întârzia cu ore — rularea de 22:00 a pornit la 00:30; cron-ul Vercel e
// punctual. Orarul e în vercel.json.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  // cron-ul vine din oră în oră; rulează doar la orele din src/lib/schedule.ts
  if (!isPipelineHour()) return new Response(`nu e ora (${chisinauHour()}:00)`);
  // oprit din admin: nicio rulare programată (butoanele editorului merg direct)
  if (!(await pipelineEnabled())) return new Response("oprit din admin");
  const { ok, status } = await dispatchPipeline();
  // eșecurile apar în logurile Vercel (fără token în mesaj)
  return new Response(ok ? "pornit" : `GitHub: HTTP ${status}`, { status: ok ? 200 : 502 });
}
