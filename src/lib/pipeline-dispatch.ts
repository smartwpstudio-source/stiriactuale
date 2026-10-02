// Pornește pipeline-ul din GitHub Actions (workflow_dispatch) — folosit de
// cron-ul Vercel și de butonul "Publică acum" din /admin. Dacă o rulare e deja
// în curs, GitHub o pune pe a doua la coadă (concurrency: pipeline).
// GITHUB_DISPATCH_TOKEN: token fine-grained doar pentru acest repo, cu
// permisiunea "Actions: Read and write".
const WORKFLOW = "https://api.github.com/repos/smartwpstudio-source/stiriactuale/actions/workflows/pipeline.yml/dispatches";

export async function dispatchPipeline(): Promise<{ ok: boolean; status: number }> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return { ok: false, status: 0 };
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
  return { ok: res.status === 204, status: res.status }; // 204 = pornit
}
