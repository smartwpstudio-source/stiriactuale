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


// Bucățile corpului între care stau reclamele (cererea proprietarului, 2026-10-17):
// prima după al 2-lea bloc de text (paragraf, listă, tabel, citat), apoi după fiecare
// 4 blocuri, cel mult 4 reclame; după ultima tăietură rămân măcar 2 blocuri.
export function splitForAds(html: string): string[] {
  const ends = [...html.matchAll(/<\/(p|ul|ol|table|blockquote)>/g)].map((m) => m.index! + m[0].length);
  const cuts: number[] = [];
  for (let b = 2; b <= ends.length - 2 && cuts.length < 4; b += 4) cuts.push(ends[b - 1]);
  return [0, ...cuts].map((c, i, a) => html.slice(c, a[i + 1]));
}
