import { decodeEntities } from "./html-entities";
import { toEmbedUrl } from "./video";

// Știre pornită direct de la un link video (admin → „Adaugă și publică acum”).
// YouTube: titlul și canalul din oEmbed (public, fără cheie), descrierea din
// pagina video-ului (câmpul shortDescription). Facebook nu permite citirea
// automată — titlul îl scrie editorul în admin.
export interface VideoSource {
  embed: string;
  title: string;
  channel: string;
  description: string;
  hasVideo: boolean; // postarea Telegram poate fi doar text + poze: atunci e știre obișnuită
  hasPhoto?: boolean; // postarea Telegram fără video, dar cu poze: titlul primește (FOTO)
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

// Valoarea unui câmp text JSON din HTML ("cheie":"...") fără regex: se caută
// ghilimeaua de închidere neprecedată de backslash, apoi JSON.parse decodează.
export function jsonStringField(html: string, key: string): string | null {
  const start = html.indexOf(`"${key}":"`);
  if (start < 0) return null;
  const from = start + key.length + 4;
  for (let i = from; i < html.length; i++) {
    if (html.charCodeAt(i) === 92) {
      i++;
      continue;
    }
    if (html[i] === '"') {
      try {
        return JSON.parse(html.slice(from - 1, i + 1)) as string;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function readVideoSource(url: string): Promise<VideoSource | null> {
  const embed = toEmbedUrl(url);
  if (!embed) return null;
  if (embed.startsWith("https://t.me/")) return readTelegramPost(embed);
  if (!embed.includes("youtube")) return { embed, title: "", channel: "Facebook", description: "", hasVideo: true };
  const id = embed.split("/embed/")[1];
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const [meta, html] = await Promise.all([
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`, { signal: AbortSignal.timeout(10_000) })
      .then((r) => (r.ok ? (r.json() as Promise<{ title?: string; author_name?: string }>) : null))
      .catch(() => null),
    fetch(watch, { headers: { "User-Agent": UA, "Accept-Language": "ro" }, signal: AbortSignal.timeout(15_000) })
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => ""),
  ]);
  return {
    embed,
    title: meta?.title ?? "",
    channel: meta?.author_name ?? "YouTube",
    description: (jsonStringField(html, "shortDescription") ?? "").trim(),
    hasVideo: true,
  };
}

// Postarea Telegram: pagina de încorporare (?embed=1) e publică — textul
// postării și numele canalului. Telegram nu are titlu: prima frază, scurtată.
async function readTelegramPost(embed: string): Promise<VideoSource | null> {
  const html = await fetch(embed, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");
  const plain = (s: string) => decodeEntities(s.replace(/<br[ /]*>/gi, " ").replace(/<[^>]+>/g, "")).replace(/ +/g, " ").trim();
  // textul postării, nu citatul la care răspunde („js-message_reply_text” vine
  // primul în pagină — o știre veche ajungea drept cea nouă, 2026-10-09)
  const description = plain(html.match(/<div class="tgme_widget_message_text[^"]*\bjs-message_text\b[^"]*"[^>]*>([^]*?)<[/]div>/)?.[1] ?? "");
  const channel = plain(html.match(/tgme_widget_message_owner_name"[^>]*><span[^>]*>([^<]*)/)?.[1] ?? "") || "Telegram";
  if (!description) return null;
  const first = description.split(/(?<=[.!?])[ ]/)[0].replace(/^[^\p{L}\p{N}„"«]+/u, "");
  const hasVideo = /tgme_widget_message_(video|roundvideo)|<video/.test(html);
  const hasPhoto = /tgme_widget_message_photo/.test(html);
  return { embed, title: first.length > 110 ? `${first.slice(0, 107)}…` : first, channel, description, hasVideo, hasPhoto };
}
