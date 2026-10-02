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

// Imaginile din arhiva WordPress au adesea alt gol — primesc titlul
// articolului (accesibilitate, căutarea de imagini) și încărcare lazy.
export function sanitizeBody(html: string, imageAlt?: string): string {
  const clean = filter.process(html);
  if (!imageAlt) return clean;
  const alt = escapeAttrValue(imageAlt);
  return clean.replace(/<img\b([^>]*)>/gi, (_, attrs: string) => {
    let a = attrs.replace(/\salt(="")?(?=[\s/]|$)/i, "");
    if (!/\salt=/i.test(a)) a = ` alt="${alt}"${a}`;
    if (!/\sloading=/i.test(a)) a += ' loading="lazy"';
    return `<img${a}>`;
  });
}

// Împarte corpul după al n-lea paragraf; [tot, ""] dacă după el nu mai rămân
// măcar 2 paragrafe (reclama nu stă lipită de final).
export function splitAfterParagraph(html: string, n: number): [string, string] {
  let idx = -1;
  for (let i = 0; i < n; i++) {
    idx = html.indexOf("</p>", idx + 1);
    if (idx < 0) return [html, ""];
  }
  const cut = idx + 4;
  const rest = html.slice(cut);
  return (rest.match(/<\/p>/g) ?? []).length >= 2 ? [html.slice(0, cut), rest] : [html, ""];
}
