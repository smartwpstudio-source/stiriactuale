import crypto from "node:crypto";
import { SITE_URL } from "@/lib/seo";

// Paginile se refac la cerere, nu după ceas (cost Vercel, 2026-10-09): după o
// rulare a pipeline-ului sau o ștergere, scriptul din GitHub Actions cheamă
// /api/revalidate/. Cheia e derivată din TELEGRAM_BOT_TOKEN, prezent și în
// Actions, și pe Vercel — fără un secret nou de configurat.
export function revalidateKey(): string | null {
  const base = process.env.TELEGRAM_BOT_TOKEN;
  return base ? crypto.createHash("sha256").update(`revalidate:${base}`).digest("hex") : null;
}

// Din GitHub Actions: `since` = începutul rulării (articolele publicate sau
// actualizate de atunci), `all` = tot site-ul (ștergere de urgență).
export async function requestRevalidate(body: { since?: string; all?: boolean }): Promise<boolean> {
  const key = revalidateKey();
  if (!key) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ok = await fetch(`${SITE_URL}/api/revalidate/`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
      .then((r) => r.ok)
      .catch(() => false);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 5_000));
  }
  return false;
}
