// Miniaturile ilustrațiilor-simbol (public/simbol/*.png, 1200x630, ~130 KB) în
// public/simbol/mini/<384|828>/<nume>.webp, ca pozele din R2 (lib/media-url.ts): site-ul
// le servește ca fișiere statice, fără /_next/image — acolo fiecare afișare pornea
// Worker-ul (~3.600 pe zi, 2026-10-31). Rulat și la sfârșitul cards.mjs; reface doar
// miniaturile mai vechi decât poza.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = "public/simbol";
let made = 0;
for (const w of [384, 828]) {
  mkdirSync(path.join(DIR, "mini", String(w)), { recursive: true });
  for (const f of readdirSync(DIR).filter((x) => /\.(png|jpe?g|webp)$/i.test(x))) {
    const src = path.join(DIR, f);
    const out = path.join(DIR, "mini", String(w), f.replace(/\.\w+$/, ".webp"));
    try {
      if (statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
    } catch {}
    await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 75 }).toFile(out);
    made++;
  }
}
console.log(`miniaturi simbol: ${made}`);
