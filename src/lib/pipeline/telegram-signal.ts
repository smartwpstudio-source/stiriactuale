import { and, eq, gte } from "drizzle-orm";
import { getDb } from "./db/client";
import { candidates } from "./db/schema";
import { FEEDS } from "./sources";

// Interesul public pentru o știre, măsurat pe canalul Telegram al redacției:
// vizualizări și reacții la postarea cu linkul articolului, raportate la media
// canalului (fiecare canal are alt public — 2.000 de vizualizări înseamnă mult
// pentru unul, puțin pentru altul). Pagina publică t.me/s/<canal> arată
// ultimele ~20 de postări, fără cont și fără API.
// ponytail: postările mai noi de 45 de minute nu au încă vizualizări relevante
// și sunt ignorate până la colectarea următoare (o dată la 30 min).
const MIN_AGE_MIN = 45;

function count(s: string): number {
  const m = s.trim().match(/^([\d.,]+)\s*([KM]?)$/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(",", "."));
  return Math.round(n * (m[2].toUpperCase() === "K" ? 1e3 : m[2].toUpperCase() === "M" ? 1e6 : 1));
}

// aceeași știre poate apărea cu/fără www, cu parametri UTM sau slash final
export function urlKey(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export interface ChannelPost {
  keys: string[];
  views: number;
  reactions: number;
  ageMin: number;
}

export function parseChannel(html: string, now = Date.now()): ChannelPost[] {
  return html
    .split('class="tgme_widget_message_wrap')
    .slice(1)
    .map((m) => {
      const time = m.match(/<time datetime="([^"]+)"/)?.[1];
      const views = count(m.match(/tgme_widget_message_views">([^<]*)</)?.[1] ?? "");
      const reactions = [...m.matchAll(/class="tgme_reaction"[\s\S]*?<\/i>([\d.,]+[KM]?)<\/span>/g)].reduce(
        (sum, r) => sum + count(r[1]),
        0,
      );
      const keys = [...new Set([...m.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((l) => urlKey(l[1])))];
      return { keys, views, reactions, ageMin: time ? (now - Date.parse(time)) / 60_000 : 0 };
    })
    .filter((p) => p.views > 0 && p.ageMin >= MIN_AGE_MIN);
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

// Actualizează candidații din ultimele 24h cu semnalul Telegram. Erorile unui
// canal nu opresc colectarea — semnalul lipsă înseamnă scor neutru.
export async function updateTelegramSignals(): Promise<{ channel: string; matched: number }[]> {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 3600_000);
  return Promise.all(
    FEEDS.filter((f) => f.telegram).map(async (feed) => {
      try {
        const res = await fetch(`https://t.me/s/${feed.telegram}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36" },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) return { channel: feed.telegram!, matched: 0 };
        const posts = parseChannel(await res.text());
        const med = median(posts.map((p) => p.views));
        if (!med) return { channel: feed.telegram!, matched: 0 };

        const rows = await db
          .select({ id: candidates.id, url: candidates.url })
          .from(candidates)
          .where(and(eq(candidates.feedId, feed.id), gte(candidates.publishedAt, since)));
        const byKey = new Map(rows.map((r) => [urlKey(r.url), r.id]));

        let matched = 0;
        for (const p of posts) {
          const id = p.keys.map((k) => byKey.get(k)).find(Boolean);
          if (!id) continue;
          await db
            .update(candidates)
            .set({ tgViews: p.views, tgReactions: p.reactions, tgInterest: Math.round((p.views / med) * 100) / 100 })
            .where(eq(candidates.id, id));
          matched++;
        }
        return { channel: feed.telegram!, matched };
      } catch {
        return { channel: feed.telegram!, matched: 0 };
      }
    }),
  );
}
