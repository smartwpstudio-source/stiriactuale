import { FilterXSS, escapeAttrValue } from "xss";

// Corpul articolelor vine din trei surse (Opus, editorul în /admin, arhiva
// WordPress) și se randează cu dangerouslySetInnerHTML — o singură listă albă
// la randare le acoperă pe toate. iframe doar YouTube / Facebook (video
// încorporate în articolele vechi). (xss, nu sanitize-html: acesta trage
// postcss, pe care Turbopack nu-l poate lega pe discul local non-NTFS.)
const IFRAME_HOSTS = /^https:\/\/(www\.youtube\.com|www\.youtube-nocookie\.com|www\.facebook\.com)\//;
const cell = ["colspan", "rowspan"];

const filter: FilterXSS = new FilterXSS({
  whiteList: {
    p: [], br: [], h2: [], h3: [], h4: [], strong: [], b: [], em: [], i: [], u: [], s: [],
    ul: [], ol: [], li: [], blockquote: [], figure: [], figcaption: [], hr: [],
    table: [], thead: [], tbody: [], tr: [], th: cell, td: cell,
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
    video: ["src", "controls", "width", "height", "poster", "preload"], // clipurile din arhivă, mutate în Blob
    source: ["src", "type"],
  },
  stripIgnoreTag: true, // tag-urile nepermise dispar, textul rămâne
  stripIgnoreTagBody: ["script", "style"],
  onTagAttr(tag, name, value): string | void {
    if (tag === "iframe" && name === "src") return IFRAME_HOSTS.test(value) ? `src="${escapeAttrValue(value)}"` : "";
    if (tag === "a" && name === "rel") return 'rel="noopener nofollow"';
  },
});

export function sanitizeBody(html: string): string {
  return filter.process(html);
}
