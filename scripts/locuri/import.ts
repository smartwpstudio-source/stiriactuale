// Arhiva de locuri reale: pozele alese pe Wikimedia Commons (content/locuri/surse.json
// + fișierele găsite) -> verificare licență -> Vercel Blob -> content/locuri/locuri.json.
// Rulare: npx tsx --env-file=.env.local scripts/locuri/import.ts <fisiere.json...>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { put } from "@vercel/blob";

const UA = "stiriactuale.info news site (https://stiriactuale.info)";
const FREE = /^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+|CC BY(-SA)?)/i;
const SRC = "content/locuri/surse.json";
const OUT = "content/locuri/locuri.json";

type Photo = { url: string; credit: string; source: string };
type Place = { id: string; name: string; keywords: string; locality?: string; photos: Photo[] };

const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/ +/g, " ").trim();

async function importFile(title: string, slug: string): Promise<Photo | null> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600&format=json`;
  const data = await (await fetch(api, { headers: { "User-Agent": UA } })).json();
  const page = Object.values(data.query?.pages ?? {})[0] as { imageinfo?: { thumburl: string; width: number; height: number; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] };
  const info = page?.imageinfo?.[0];
  if (!info) return console.log(`  lipsă: ${title}`), null;
  const license = plain(info.extmetadata.LicenseShortName?.value ?? "");
  if (!FREE.test(license)) return console.log(`  licență respinsă (${license}): ${title}`), null;
  if (info.width < info.height || info.width < 1000) return console.log(`  format nepotrivit ${info.width}x${info.height}: ${title}`), null;
  const img = await fetch(info.thumburl, { headers: { "User-Agent": UA } });
  if (!img.ok) return console.log(`  descărcare HTTP ${img.status}: ${title}`), null;
  const blob = await put(`locuri/${slug}.jpg`, Buffer.from(await img.arrayBuffer()), { access: "public", contentType: "image/jpeg", addRandomSuffix: true });
  const artist = plain(info.extmetadata.Artist?.value ?? "autor necunoscut").slice(0, 60);
  return { url: blob.url, credit: `${artist} / Wikimedia Commons, ${license}`, source: info.descriptionurl };
}

(async () => {
  const found: Record<string, string[]> = Object.assign({}, ...process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, "utf8"))));
  const prev: Place[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
  const out: Place[] = [];
  for (const p of JSON.parse(readFileSync(SRC, "utf8")) as { id: string; name: string; keywords: string; locality?: string }[]) {
    const old = prev.find((x) => x.id === p.id);
    const photos: Photo[] = old?.photos ?? [];
    for (const [i, title] of (found[p.id] ?? []).entries()) {
      if (photos.some((ph) => ph.source.endsWith(encodeURIComponent(title.replace(/ /g, "_")).replace(/%3A/g, ":")))) continue;
      const ph = await importFile(title, `${p.id}-${i + 1}`).catch((e) => (console.log(`  eroare ${title}: ${e}`), null));
      if (ph) photos.push(ph);
    }
    console.log(`${p.id}: ${photos.length}`);
    if (photos.length) out.push({ id: p.id, name: p.name, keywords: p.keywords, ...(p.locality && { locality: p.locality }), photos });
  }
  writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
  console.log(`locuri cu poze: ${out.length}`);
})();
