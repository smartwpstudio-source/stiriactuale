import { put } from "@vercel/blob";

const API = "https://api.magnific.com/v1";

// Foto de stock prin API Magnific: gratuit pe Premium+ (max 100 descărcări/zi;
// noi folosim ~20-30). "Unlimited" din abonament acoperă DOAR aplicația web,
// iar automatizarea ei e interzisă de Acceptable Use Policy — API-ul e canalul
// permis. URL-urile de download sunt semnate și expiră (~1h), așa că fișierul
// se copiază în Vercel Blob (stocare permanentă). Fără chei → articol fără
// imagine, nu eșec. Imaginile generate (rare) le face editorul manual.
export async function findStockImage(searchTerm: string, slug: string): Promise<string | null> {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key || !process.env.BLOB_READ_WRITE_TOKEN) return null;

  const headers = { "x-magnific-api-key": key };
  const signal = () => AbortSignal.timeout(30_000); // lecție fal.ai: niciun apel extern fără timeout

  try {
    const params = new URLSearchParams({
      term: searchTerm,
      limit: "1",
      order: "relevance",
      "filters[content_type][photo]": "1",
      "filters[orientation][landscape]": "1",
    });
    const search = await fetch(`${API}/resources?${params}`, { headers, signal: signal() });
    if (!search.ok) throw new Error(`căutare HTTP ${search.status}`);
    const id = ((await search.json()) as { data?: { id: number }[] }).data?.[0]?.id;
    if (!id) return null;

    const dl = await fetch(`${API}/resources/${id}/download?image_size=small`, { headers, signal: signal() });
    if (!dl.ok) throw new Error(`download HTTP ${dl.status}`);
    const { data } = (await dl.json()) as { data: { url: string; signed_url?: string } };

    const file = await fetch(data.url ?? data.signed_url, { signal: signal() });
    if (!file.ok) throw new Error(`fișier HTTP ${file.status}`);

    const blob = await put(`articole/${slug}.jpg`, Buffer.from(await file.arrayBuffer()), {
      access: "public",
      contentType: file.headers.get("content-type") ?? "image/jpeg",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    // Niciodată cheia sau header-ele în log — doar mesajul.
    console.error(`Magnific: imagine eșuată — ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
