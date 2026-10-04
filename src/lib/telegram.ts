import { SITE_URL } from "./seo";

// Telegram Bot API — un bot creat cu @BotFather:
//  - TELEGRAM_ADMIN_CHAT_ID: chat-ul privat al editorului — notificare la
//    fiecare articol nou (draft sau publicat);
//  - TELEGRAM_CHANNEL_ID: canalul/grupul public (@nume sau -100…) — botul e
//    admin acolo; postare la publicare, ștergere la retragere.
// Orice eroare Telegram se loghează și atât — nu blochează pipeline-ul/admin-ul.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function call<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!json.ok) throw new Error(json.description);
    return json.result ?? null;
  } catch (err) {
    // niciodată URL-ul în log — conține token-ul
    console.error(`Telegram ${method}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

const HEADS = {
  draft: "📝 Draft — subiect sensibil, așteaptă aprobarea ta",
  "draft-alerta": "📝🔔 Draft — subiect sensibil, așteaptă aprobarea ta (propus și pentru notificare push)",
  publicat: "✅ Publicat",
  "publicat-auto": "✅ Publicat automat — verifică-l când poți",
};

export async function notifyEditor(kind: keyof typeof HEADS, a: { id: number; title: string; lead: string }) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) return;
  const head = HEADS[kind];
  await call("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `${head}\n\n<b>${esc(a.title)}</b>\n\n${esc(a.lead)}\n\n<a href="${SITE_URL}/admin/articol/${a.id}/">Deschide în admin</a>`,
    link_preview_options: { is_disabled: true },
  });
}

// Alertă tehnică pentru editor (pipeline căzut, feed-uri moarte, articole eșuate).
export async function alertEditor(text: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (chatId) await call("sendMessage", { chat_id: chatId, text: `⚠️ Pipeline\n\n${text}`.slice(0, 4000) });
}

// Returnează message_id — se salvează ca retragerea să poată șterge postarea.
export async function postToChannel(a: { title: string; lead: string; url: string }): Promise<number | null> {
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!chatId) return null;
  const msg = await call<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `<b>${esc(a.title)}</b>\n\n${esc(a.lead)}\n\n${a.url}`,
  });
  return msg?.message_id ?? null;
}

export async function deleteFromChannel(messageId: number) {
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (chatId) await call("deleteMessage", { chat_id: chatId, message_id: messageId });
}

// Rezumatul de dimineață / de seară (digest.ts) — fără previzualizare de link:
// mesajul are 5-7 linkuri, iar previzualizarea ar lua doar primul.
export async function postDigestToChannel(html: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!chatId) return false;
  const msg = await call<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: html,
    link_preview_options: { is_disabled: true },
  });
  return msg !== null;
}
