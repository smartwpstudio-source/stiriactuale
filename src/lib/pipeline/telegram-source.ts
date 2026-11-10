import { decodeEntities } from "@/lib/html-entities";
import type { RawCandidate } from "./types";

// Canale Telegram ca surse de știri (decizia editorului, 2026-11-10: Poliția RM). Pagina publică
// t.me/s/<canal> arată ultimele ~20 de postări, fără cont și fără API. Postarea devine candidat
// ca un articol RSS: titlul = prima frază, textul = postarea; scrierea o tratează ca pe linkurile
// t.me ale editorului (fără descărcarea paginii, cu pozele postării).
export const TELEGRAM_FEEDS = [{ id: "politia-tg", name: "Poliția Republicii Moldova", channel: "Politia_Republicii_Moldova" }];

const MIN_TEXT = 80; // anunțurile de o linie (felicitări, „urmăriți live”) nu sunt știri

export function parseChannelPosts(html: string, channel: string, feedId: string, sourceName: string): RawCandidate[] {
  return html
    .split('class="tgme_widget_message_wrap')
    .slice(1)
    .flatMap((m) => {
      const post = m.match(/data-post="([^"]+\/(\d+))"/);
      const time = m.match(/<time datetime="([^"]+)"/)?.[1];
      // doar textul postării, nu citatul la care răspunde (js-message_reply_text)
      const body = m.match(/class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/)?.[1];
      if (!post || !time || !body) return [];
      const text = decodeEntities(body.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (text.length < MIN_TEXT) return [];
      const first = text.split("\n").find((l) => l.trim().length > 20) ?? text;
      const title = (first.match(/^.{20,180}?[.!?](?=\s|$)/)?.[0] ?? first.slice(0, 160)).trim();
      return [{ title, summary: text.slice(0, 3000), sourceName, sourceUrl: `https://t.me/${channel}/${post[2]}`, publishedAt: new Date(time), feedId }];
    });
}

export async function fetchTelegramChannel(channel: string, feedId: string, sourceName: string): Promise<RawCandidate[]> {
  const res = await fetch(`https://t.me/s/${channel}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`t.me/s/${channel}: ${res.status}`);
  return parseChannelPosts(await res.text(), channel, feedId, sourceName);
}
