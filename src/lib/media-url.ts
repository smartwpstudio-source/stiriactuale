// Adresele pozelor din R2, fără cod de server (le folosește și fluxul de știri din browser).
export const MEDIA_ORIGIN = "https://media.stiriactuale.info";

// Miniaturile (384/828 px, WebP) în mini/<lățime>/<cheie>.webp, făcute o singură dată
// la încărcare (putMedia din media.ts): site-ul le servește direct (article-thumb.tsx),
// fără transformări Cloudflare Images — acestea se numără din nou în fiecare lună pentru
// fiecare (poză, lățime) afișată, iar cele 5.000 incluse s-au terminat pe 28 octombrie.
// Ilustrațiile-simbol (public/simbol/) au miniaturile în public/simbol/mini/<lățime>/
// (scripts/locuri/simbol-mini.mjs) — fișiere statice, fără Worker.
export const MINI_WIDTHS = [384, 828] as const;
export const miniKey = (key: string, w: number) => `mini/${w}/${key.replace(/\.[a-z0-9]+$/i, "")}.webp`;
const SIMBOL = /^(?:https:\/\/stiriactuale\.info)?\/simbol\/([^/]+)\.(?:png|jpe?g|webp)$/i;
export const miniUrl = (url: string, w: number) => {
  const s = url.match(SIMBOL);
  if (s) return `/simbol/mini/${w}/${s[1]}.webp`;
  return url.startsWith(`${MEDIA_ORIGIN}/`) && !url.startsWith(`${MEDIA_ORIGIN}/mini/`) ? `${MEDIA_ORIGIN}/${miniKey(url.slice(MEDIA_ORIGIN.length + 1), w)}` : null;
};
