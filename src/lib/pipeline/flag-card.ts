import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { putMedia } from "@/lib/media";

// Cardul cu steaguri (2026-10-27): la știrile despre state, politicieni, instituții
// și clădiri cunoscute, poza de stoc (un om oarecare la telefon) sau cea generată
// (o clădire inventată) e un fals. Cardul arată doar ce e sigur: statele implicate
// și subiectul („Convorbire telefonică”, „Moldova — România”). Steagurile: flag-icons (MIT).
const FLAGS = path.join(process.cwd(), "node_modules", "flag-icons", "flags", "4x3");
const FONT = "Liberation Sans, Arial, Helvetica, DejaVu Sans, sans-serif";
const names = new Intl.DisplayNames(["ro"], { type: "region" });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const countryName = (code: string) => (code === "eu" ? "Uniunea Europeană" : code === "md" ? "Republica Moldova" : names.of(code.toUpperCase()) ?? code);
const hasFlag = (code: string) => /^[a-z]{2}$/.test(code) && existsSync(path.join(FLAGS, `${code}.svg`));

export async function renderFlagCard(codes: string[], label: string): Promise<Buffer> {
  const flags = [...new Set(codes.map((c) => c.toLowerCase()))].filter(hasFlag).slice(0, 3);
  if (!flags.length) flags.push("md");
  const W = 1200;
  const H = 675;
  const fw = flags.length === 1 ? 300 : 240;
  const fh = (fw * 3) / 4;
  const gap = 48;
  const x0 = 80;
  const y0 = 110;
  const context = flags.map(countryName).join(" · ");
  const size = Math.min(84, Math.floor(1060 / (label.length * 0.58)));
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22365F"/><stop offset="1" stop-color="#0C1630"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1010" cy="330" r="330" fill="none" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="3"/>
  <circle cx="1010" cy="330" r="380" fill="none" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="2"/>
  ${flags.map((_, i) => `<rect x="${x0 + i * (fw + gap) - 4}" y="${y0 - 4}" width="${fw + 8}" height="${fh + 8}" rx="14" fill="#FFFFFF" fill-opacity="0.9"/>`).join("")}
  <text x="80" y="${y0 + fh + 90}" font-family="${FONT}" font-size="34" fill="#FFFFFF" fill-opacity="0.8">${esc(context)}</text>
  <text x="76" y="${y0 + fh + 100 + size}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#FFFFFF">${esc(label)}</text>
  <rect x="80" y="${y0 + fh + 140 + size}" width="120" height="8" rx="4" fill="#E2B84B"/>
  <text x="${W - 60}" y="${H - 44}" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.55">ȘTIRI ACTUALE</text>
</svg>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${fw}" height="${fh}"><rect width="${fw}" height="${fh}" rx="10"/></svg>`);
  const layers = await Promise.all(
    flags.map(async (code, i) => ({
      input: await sharp(readFileSync(path.join(FLAGS, `${code}.svg`)), { density: 300 })
        .resize(fw, fh, { fit: "fill" })
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer(),
      left: x0 + i * (fw + gap),
      top: y0,
    })),
  );
  return sharp(Buffer.from(bg)).composite(layers).jpeg({ quality: 86 }).toBuffer();
}

export async function flagCardImage(codes: string[], label: string, slug: string) {
  const buf = await renderFlagCard(codes, label);
  const url = await putMedia(`articole/${slug}-card.jpg`, new Uint8Array(buf), "image/jpeg");
  return { url, resourceId: null, credit: "Grafică: Știri Actuale", alt: `${codes.map(countryName).join(", ")}: ${label}` };
}
