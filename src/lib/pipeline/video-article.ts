import { toEmbedUrl } from "@/lib/video";
import type { CandidateGroup, GeneratedArticle } from "./types";

// Știre video scurtă, fără AI: pentru linkurile video ale editorului a căror
// descriere e prea scurtă pentru un articol. Titlu, 1–2 fraze din descriere
// (citate, cu sursa) și playerul. Fără nimic inventat.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function shortVideoArticle(group: CandidateGroup): GeneratedArticle | null {
  const item = group.items.find((i) => toEmbedUrl(i.sourceUrl));
  if (!item) return null;
  // descrierea fără linkuri, hashtag-uri și rânduri goale
  const text = item.summary
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^#|https?:\/\//.test(l))
    .join(" ")
    .trim();
  // ultima soluție, fără AI: citatul rămâne în limba sursei — doar dacă e română
  if (/[а-яёіїєґ]/i.test(text + item.title)) return null;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) ?? (text ? [text] : [])).map((x) => x.trim());
  const lead = (sentences.slice(0, 2).join(" ").trim() || `Video publicat de ${item.sourceName}.`).slice(0, 300);
  const quote = sentences.slice(0, 3).join(" ").trim().slice(0, 600);
  const title = item.title.trim();
  return {
    titlu: `Video: ${title}`.slice(0, 120),
    slug: slugify(title) || `video-${Date.now()}`,
    meta_description: lead.slice(0, 160),
    lead,
    corp_html: quote
      ? `<p>Descrierea video-ului, publicat de <strong>${esc(item.sourceName)}</strong>: „${esc(quote)}”</p><p>Detaliile sunt în video-ul de mai sus.</p>`
      : `<p>Video publicat de <strong>${esc(item.sourceName)}</strong>. Detaliile sunt în video-ul de mai sus.</p>`,
    tag_uri: [],
    alt_text_imagine: title,
    stock_query: "",
    image_prompt: "",
    video_url: toEmbedUrl(item.sourceUrl) ?? undefined,
  };
}
