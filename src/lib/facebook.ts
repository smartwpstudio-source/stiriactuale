// Postare automată pe pagina de Facebook "Știri Actuale" (Graph API), în
// paralel cu canalul Telegram. FACEBOOK_PAGE_TOKEN = token de pagină fără
// expirare (permisiuni pages_manage_posts + pages_read_engagement), generat
// din aplicația Meta a editorului. Fără variabile -> nu postează (ex. local).
// Erorile nu opresc publicarea: se loghează doar mesajul, niciodată tokenul.
const GRAPH = "https://graph.facebook.com";

// ultima eroare (mesajul Facebook, fără token) — afișată în /admin
export let lastFacebookError = "";

// ghilimelele sau spațiile copiate din răspunsul JSON fac tokenul ilizibil
const env = (name: string) => process.env[name]?.trim().replace(/^["']|["']$/g, "") || "";

async function graph<T>(path: string, method: "POST" | "DELETE", params: Record<string, string>): Promise<T | null> {
  const token = env("FACEBOOK_PAGE_TOKEN");
  if (!token) return null;
  try {
    const res = await fetch(`${GRAPH}/${path}`, {
      method,
      body: new URLSearchParams({ ...params, access_token: token }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json()) as T & { error?: { message?: string } };
    if (!res.ok || data.error) {
      lastFacebookError = data.error?.message ?? `HTTP ${res.status}`;
      console.error(`Facebook: ${lastFacebookError}`);
      return null;
    }
    return data;
  } catch (err) {
    lastFacebookError = err instanceof Error ? err.message : String(err);
    console.error(`Facebook: ${lastFacebookError}`);
    return null;
  }
}

// Previzualizarea (poza, titlul) o generează Facebook din link (og:image).
export async function postToPage(a: { title: string; lead: string; url: string }): Promise<string | null> {
  const pageId = env("FACEBOOK_PAGE_ID");
  if (!pageId || !env("FACEBOOK_PAGE_TOKEN")) {
    lastFacebookError = "FACEBOOK_PAGE_ID sau FACEBOOK_PAGE_TOKEN lipsește (redeploy după adăugare?)";
    return null;
  }
  const r = await graph<{ id: string }>(`${pageId}/feed`, "POST", { message: `${a.title}\n\n${a.lead}`, link: a.url });
  return r?.id ?? null;
}

export async function deleteFromPage(postId: string) {
  await graph(postId, "DELETE", {});
}
