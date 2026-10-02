// Postare automată pe pagina de Facebook "Știri Actuale" (Graph API), în
// paralel cu canalul Telegram. FACEBOOK_PAGE_TOKEN = token de pagină fără
// expirare (permisiuni pages_manage_posts + pages_read_engagement), generat
// din aplicația Meta a editorului. Fără variabile -> nu postează (ex. local).
// Erorile nu opresc publicarea: se loghează doar mesajul, niciodată tokenul.
const GRAPH = "https://graph.facebook.com";

async function graph<T>(path: string, method: "POST" | "DELETE", params: Record<string, string>): Promise<T | null> {
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${GRAPH}/${path}`, {
      method,
      body: new URLSearchParams({ ...params, access_token: token }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json()) as T & { error?: { message?: string } };
    if (!res.ok || data.error) {
      console.error(`Facebook: ${data.error?.message ?? `HTTP ${res.status}`}`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Facebook: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// Previzualizarea (poza, titlul) o generează Facebook din link (og:image).
export async function postToPage(a: { title: string; lead: string; url: string }): Promise<string | null> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!pageId) return null;
  const r = await graph<{ id: string }>(`${pageId}/feed`, "POST", { message: `${a.title}\n\n${a.lead}`, link: a.url });
  return r?.id ?? null;
}

export async function deleteFromPage(postId: string) {
  await graph(postId, "DELETE", {});
}
