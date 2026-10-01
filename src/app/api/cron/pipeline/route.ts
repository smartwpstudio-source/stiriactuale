import crypto from "node:crypto";

// Pornește pipeline-ul din GitHub Actions (workflow_dispatch) exact la oră.
// Orarul propriu al GitHub ("schedule") întârzie cu ore — rularea de 22:00 a
// pornit la 00:30; cron-ul Vercel e punctual. Orarul e în vercel.json.
// GITHUB_DISPATCH_TOKEN: token fine-grained doar pentru acest repo, cu
// permisiunea "Actions: Read and write".
const WORKFLOW = "https://api.github.com/repos/smartwpstudio-source/stiriactuale/actions/workflows/pipeline.yml/dispatches";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return new Response("GITHUB_DISPATCH_TOKEN lipsește", { status: 500 });

  const res = await fetch(WORKFLOW, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "master" }),
    signal: AbortSignal.timeout(15_000),
  });
  // 204 = pornit; orice altceva apare în logurile Vercel (fără token în mesaj)
  return new Response(res.status === 204 ? "pornit" : `GitHub: HTTP ${res.status}`, { status: res.status === 204 ? 200 : 502 });
}
