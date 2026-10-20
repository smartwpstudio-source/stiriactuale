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
  "push-auto": "🔔 Push automat trimis",
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
// Cu poză (2026-10-20): informația se vede direct în Telegram, nu doar un link;
// fără poză sau dacă Telegram n-o poate lua, mesaj text ca înainte. silent = fără
// sunet la abonați (știrile obișnuite); alertele și știrile mari vin cu sunet.
export async function postToChannel(a: { title: string; lead: string; url: string; tool?: string; image?: string; silent?: boolean }): Promise<number | null> {
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!chatId) return null;
  const tail = `${a.tool ? `\n\n${a.tool}` : ""}\n\n<a href="${a.url}">Citește pe Știri Actuale →</a>`;
  if (a.image) {
    // legenda pozei are cel mult 1024 de caractere
    const lead = a.lead.length > 700 ? `${a.lead.slice(0, 700).replace(/\s+\S*$/, "")}…` : a.lead;
    const photo = await call<{ message_id: number }>("sendPhoto", {
      chat_id: chatId,
      photo: a.image,
      parse_mode: "HTML",
      caption: `<b>${esc(a.title)}</b>\n\n${esc(lead)}${tail}`,
      disable_notification: a.silent ?? false,
    });
    if (photo) return photo.message_id;
  }
  const msg = await call<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `<b>${esc(a.title)}</b>\n\n${esc(a.lead)}${tail}`,
    disable_notification: a.silent ?? false,
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

// Postare programată (scheduled_posts): cu previzualizarea linkului (o
// singură trimitere, spre calculator / articol) și, la nevoie, fixată sus.
export async function postScheduledToChannel(html: string, pin: boolean): Promise<boolean> {
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!chatId) return false;
  const msg = await call<{ message_id: number }>("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: html });
  if (msg && pin) await call("pinChatMessage", { chat_id: chatId, message_id: msg.message_id, disable_notification: true });
  return msg !== null;
}
