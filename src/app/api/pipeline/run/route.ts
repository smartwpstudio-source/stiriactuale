import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline/run";

// Rularea poate dura minute (RSS + apeluri LLM secvențiale) — nu e un
// request rapid. Vezi plan-implementare-agregator-stiri-ai.md secțiunea 3.8:
// endpoint apelat de GitHub Actions la fiecare 2h (06:00-22:00).
export const maxDuration = 300;

export async function POST(request: Request) {
  // Întrerupător manual — independent de cron-ul GitHub Actions. Setează
  // PIPELINE_ENABLED=false în Vercel (Environment Variables) + Redeploy ca
  // să blochezi orice rulare, indiferent de sursa cererii (cron, apel
  // manual, orice). Util ca reacție rapidă la o anomalie de cost.
  if (process.env.PIPELINE_ENABLED === "false") {
    return NextResponse.json(
      { ok: false, error: "Pipeline dezactivat manual (PIPELINE_ENABLED=false)" },
      { status: 503 },
    );
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET neconfigurat pe server" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runPipeline();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
