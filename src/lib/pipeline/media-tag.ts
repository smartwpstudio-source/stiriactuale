import { miniUrl } from "@/lib/media-url";

// Titlul știrii cu video primește „(VIDEO)”, cea cu poze în corpul articolului
// „(FOTO)” — la sfârșit (cererea proprietarului, 2026-10-04; din 2026-10-29 doar
// pozele din text contează, nu poza de titlu). O singură dată.
export function mediaTag(title: string, video: boolean, photo: boolean): string {
  const tag = video ? "(VIDEO)" : photo ? "(FOTO)" : "";
  if (!tag || /[(](VIDEO|FOTO)[)]/i.test(title)) return title;
  return `${title.replace(/[ .]+$/, "")} ${tag}`;
}

// fără poze în text, „(FOTO)” iese din titlu
export const dropPhotoTag = (title: string) => title.replace(/\s*[(]FOTO[)]\s*$/i, "");

export type BodyPhoto = { url: string; credit: string | null };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// pozele din corpul articolului: la sfârșitul textului, una sub alta, cu sursa sub fiecare;
// din R2 se servește miniatura de 828 px (lib/media-url.ts)
export const photoFigures = (photos: BodyPhoto[], alt: string) =>
  photos
    .map(
      (p) =>
        `<figure><img src="${esc(miniUrl(p.url, 828) ?? p.url)}" alt="${esc(alt)}" loading="lazy">${p.credit ? `<figcaption>${esc(p.credit)}</figcaption>` : ""}</figure>`,
    )
    .join("");

export const hasBodyPhotos = (html: string) => /<figure\b[^>]*>\s*<img\b/i.test(html);
