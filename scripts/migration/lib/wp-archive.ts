// Cum se transformă un articol WordPress în articol nou. Folosit de
// import-archive.ts și download-images.ts (pozele doar pentru articolele proprii).
import { decodeEntities } from "../../../src/lib/html-entities";
import type { WpContentPost } from "../export-wp-content";

const stripTags = (html: string) =>
  decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/[​-‍﻿]/g, "") // caractere invizibile lipite de editorul WP
    .replace(/\s+/g, " ")
    .trim();

// Promoțiile Telegram și semnătura vechiului site — site-ul nou are propriul bloc Telegram.
export const BOILERPLATE = /Abonează-?\s*te\s*la\s*canalul|^\W*știri actuale info\W*$/i;

// Paragraf cu text de articol: nu gol, nu doar un URL, nu promoție, nu un cuvânt rătăcit ("source").
const isTextParagraph = (t: string) => t.length >= 20 && !/^https?:\/\/\S+$/.test(t) && !BOILERPLATE.test(t);

// Articolele preluate încep cu un paragraf care conține DOAR linkul spre
// sursă (86% din arhivă) — acela e semnalul, nu o listă de domenii.
export function copiedSource(post: WpContentPost): { name: string; url: string } | null {
  const first = post.content.rendered.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "";
  const m = /^\s*<a [^>]*href="(https?:\/\/[^"]+)"[^>]*>[^<]*<\/a>\s*$/.exec(first);
  if (!m) return null;
  try {
    return { name: new URL(m[1]).hostname.replace(/^www\./, ""), url: m[1] };
  } catch {
    return null;
  }
}

// Paragrafele de text, fără paragraful-link de la început și fără cele goale.
function paragraphs(post: WpContentPost): string[] {
  return [...post.content.rendered.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => stripTags(m[1]))
    .filter(isTextParagraph);
}

export function title(post: WpContentPost): string {
  return stripTags(post.title.rendered);
}

// Primul paragraf de text = lead-ul (rezumatul WP e trunchiat, cu "[…] More").
export function firstParagraph(post: WpContentPost): string {
  return paragraphs(post)[0] ?? title(post);
}

// Corpul fără paragraful-link al sursei și fără paragraful folosit ca lead
// (altfel apare de două ori pe pagină).
export function bodyWithoutLead(post: WpContentPost): string {
  let removedLead = false;
  return post.content.rendered.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (m, inner: string) => {
    const text = stripTags(inner);
    if (/^https?:\/\/\S+$/.test(text) || BOILERPLATE.test(text)) return "";
    if (!removedLead && isTextParagraph(text)) {
      removedLead = true;
      return "";
    }
    return m;
  });
}

export function metaDescription(text: string): string {
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}
