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

// Temele cardului (2026-10-28): culoare și formă diferite pe ramuri, ca două carduri
// alăturate să nu se confunde. light = card alb cu ramă și steagurile centrate (ca la MAE).
export const CARD_THEMES = {
  diplomatie: { light: true, c1: "#FFFFFF", c2: "#FFFFFF", ink: "#0B3C8C", accent: "#0B4BB3" },
  ue: { light: false, c1: "#1E44A6", c2: "#0A1E5E", ink: "#FFFFFF", accent: "#FFD43B" },
  razboi: { light: false, c1: "#3A3F47", c2: "#15181D", ink: "#FFFFFF", accent: "#D9473F" },
  economie: { light: false, c1: "#1F6156", c2: "#0A2A25", ink: "#FFFFFF", accent: "#E2B84B" },
  politica: { light: false, c1: "#8E2343", c2: "#420B1D", ink: "#FFFFFF", accent: "#FFFFFF" },
  justitie: { light: false, c1: "#6E4B2C", c2: "#33200E", ink: "#FFFFFF", accent: "#E9C98A" },
  social: { light: true, c1: "#FFFFFF", c2: "#FFFFFF", ink: "#1F5F57", accent: "#1F7A6E" },
} as const;
export type CardTheme = keyof typeof CARD_THEMES;

// Sigla instituției care dă anunțul (2026-10-28): legea, decizia, comunicatul unei
// instituții din Moldova primesc sigla ei în locul steagurilor; relațiile dintre
// state rămân cu steaguri. Siglele: de pe site-urile oficiale (content/sigle/);
// Președinția și ministerele folosesc stema de stat. Denumirile: gov.md/ro/ministere.
const SIGLE = path.join(process.cwd(), "content", "sigle");
export const INSTITUTIONS: Record<string, [name: string, logo: string]> = {
  guvernul: ["Guvernul Republicii Moldova", "guvernul"],
  parlamentul: ["Parlamentul Republicii Moldova", "parlamentul"],
  presedintia: ["Președinția Republicii Moldova", "stema"],
  cec: ["Comisia Electorală Centrală", "cec"],
  anre: ["Agenția Națională pentru Reglementare în Energetică", "anre"],
  ansa: ["Agenția Națională pentru Siguranța Alimentelor", "ansa"],
  anta: ["Agenția Națională Transport Auto", "stema"],
  bnm: ["Banca Națională a Moldovei", "bnm"],
  cna: ["Centrul Național Anticorupție", "cna"],
  cnam: ["Compania Națională de Asigurări în Medicină", "cnam"],
  procuratura: ["Procuratura Generală", "procuratura"],
  politia: ["Inspectoratul General al Poliției", "politia"],
  frontiera: ["Inspectoratul General al Poliției de Frontieră", "frontiera"],
  igsu: ["Inspectoratul General pentru Situații de Urgență", "igsu"],
  mae: ["Ministerul Afacerilor Externe", "stema"],
  mai: ["Ministerul Afacerilor Interne", "stema"],
  agricultura: ["Ministerul Agriculturii și Industriei Alimentare", "stema"],
  aparare: ["Ministerul Apărării", "stema"],
  cultura: ["Ministerul Culturii", "stema"],
  economie: ["Ministerul Dezvoltării Economice și Digitalizării", "stema"],
  educatie: ["Ministerul Educației și Cercetării", "stema"],
  energie: ["Ministerul Energiei", "stema"],
  finante: ["Ministerul Finanțelor", "stema"],
  infrastructura: ["Ministerul Infrastructurii și Dezvoltării Regionale", "stema"],
  justitie: ["Ministerul Justiției", "stema"],
  mediu: ["Ministerul Mediului", "stema"],
  munca: ["Ministerul Muncii și Protecției Sociale", "stema"],
  sanatate: ["Ministerul Sănătății", "stema"],
};

export async function renderFlagCard(codes: string[], label: string, theme: string = "diplomatie", institution?: string): Promise<Buffer> {
  const t = CARD_THEMES[theme as CardTheme] ?? CARD_THEMES.diplomatie;
  const inst = institution ? INSTITUTIONS[institution] : undefined;
  const flags = inst ? [] : [...new Set(codes.map((c) => c.toLowerCase()))].filter(hasFlag).slice(0, 3);
  if (!inst && !flags.length) flags.push("md");
  const W = 1200;
  const H = 675;
  // sigla: cel mult 210 înălțime, 480 lățime; siglele mici de pe site-uri
  // (CEC, ANSA ~100 px) nu se măresc peste 2,2x — altfel ies încețoșate
  const logo = inst && (await sharp(path.join(SIGLE, `${inst[1]}.png`)).metadata());
  const k = logo ? Math.min(210 / logo.height!, 480 / logo.width!, 2.2) : 0;
  const lw = logo ? Math.round(logo.width! * k) : 0;
  const lh = logo ? Math.round(logo.height! * k) : 0;
  const fw = inst ? lw + 48 : flags.length === 1 ? 280 : 220;
  const fh = inst ? 210 + 32 : (fw * 3) / 4;
  const gap = 40;
  const n = inst ? 1 : flags.length;
  const rowW = n * fw + (n - 1) * gap;
  const x0 = t.light ? (W - rowW) / 2 : 80;
  const y0 = 110;
  const context = inst ? inst[0] : flags.map(countryName).join(" · ");
  const size = Math.min(t.light ? 70 : 84, Math.floor((t.light ? 940 : 1060) / (label.length * 0.58)));
  const frames = inst
    ? `<rect x="${x0}" y="${y0}" width="${fw}" height="${fh}" rx="18" fill="#FFFFFF"${t.light ? ` stroke="#9AA9C2" stroke-opacity="0.6" stroke-width="3"` : ""}/>`
    : flags
        .map((_, i) => `<rect x="${x0 + i * (fw + gap) - 4}" y="${y0 - 4}" width="${fw + 8}" height="${fh + 8}" rx="14" fill="${t.light ? "#9AA9C2" : "#FFFFFF"}" fill-opacity="${t.light ? 0.6 : 0.9}"/>`)
        .join("");
  const ty = y0 + fh;
  const body = t.light
    ? `<rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${t.ink}" stroke-width="3"/>
  ${frames}
  <rect x="${(W - Math.min(1040, label.length * size * 0.62 + 120)) / 2}" y="${ty + 56}" width="${Math.min(1040, label.length * size * 0.62 + 120)}" height="${size + 52}" rx="8" fill="${t.accent}"/>
  <text x="${W / 2}" y="${ty + 56 + size + 12}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#FFFFFF">${esc(label)}</text>
  <text x="${W / 2}" y="${ty + 56 + size + 52 + 56}" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="700" fill="${t.ink}">${esc(context)}</text>
  <text x="${W / 2}" y="${H - 52}" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="700" letter-spacing="3" fill="${t.ink}" fill-opacity="0.6">ȘTIRI ACTUALE</text>`
    : `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.c1}"/><stop offset="1" stop-color="${t.c2}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1010" cy="330" r="330" fill="none" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="3"/>
  <circle cx="1010" cy="330" r="380" fill="none" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="2"/>
  ${frames}
  <text x="80" y="${ty + 90}" font-family="${FONT}" font-size="34" fill="${t.ink}" fill-opacity="0.8">${esc(context)}</text>
  <text x="76" y="${ty + 100 + size}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${t.ink}">${esc(label)}</text>
  <rect x="80" y="${ty + 140 + size}" width="120" height="8" rx="4" fill="${t.accent}"/>
  <text x="${W - 60}" y="${H - 44}" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.55">ȘTIRI ACTUALE</text>`;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${fw}" height="${fh}"><rect width="${fw}" height="${fh}" rx="10"/></svg>`);
  const layers = inst
    ? [{ input: await sharp(path.join(SIGLE, `${inst[1]}.png`)).resize(lw, lh).png().toBuffer(), left: Math.round(x0 + (fw - lw) / 2), top: Math.round(y0 + (fh - lh) / 2) }]
    : await Promise.all(
    flags.map(async (code, i) => ({
      input: await sharp(readFileSync(path.join(FLAGS, `${code}.svg`)), { density: 300 })
        .resize(fw, fh, { fit: "fill" })
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer(),
      left: Math.round(x0 + i * (fw + gap)),
      top: y0,
    })),
  );
  return sharp(Buffer.from(bg)).composite(layers).jpeg({ quality: 86 }).toBuffer();
}

export async function flagCardImage(codes: string[], label: string, slug: string, theme?: string, institution?: string) {
  const buf = await renderFlagCard(codes, label, theme, institution);
  const url = await putMedia(`articole/${slug}-card.jpg`, new Uint8Array(buf), "image/jpeg");
  const who = institution && INSTITUTIONS[institution] ? INSTITUTIONS[institution][0] : codes.map(countryName).join(", ");
  return { url, resourceId: null, credit: "Grafică: Știri Actuale", alt: `${who}: ${label}` };
}
