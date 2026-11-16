// Cardurile diasporei pe țări (editorul, 2026-11-16): fotografia unui simbol al țării (făcută în
// Google Flow) + steagul țării și al Moldovei (flag-icons, exacte — AI-ul strică stema) + eticheta.
// Rulare: node scripts/locuri/diaspora-cards.mjs <dosar-cu-poze> <harta.json>
//   harta.json: { "<slug țară>": ["<început nume fișier>", ...] }
// Scrie public/simbol/diaspora-<slug>-N.jpg și intrările card-diaspora-<slug> în content/locuri/simbol.json.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [dir, mapFile] = process.argv.slice(2);
const map = JSON.parse(readFileSync(mapFile, "utf8"));
const FLAGS = path.join("node_modules", "flag-icons", "flags", "4x3");
const FONT = "Liberation Sans, Arial, Helvetica, DejaVu Sans, sans-serif";
const COUNTRIES = {
  italia: ["it", "Italia", "din Italia"], franta: ["fr", "Franța", "din Franța"], germania: ["de", "Germania", "din Germania"],
  "regatul-unit": ["gb", "Regatul Unit", "din Regatul Unit"], spania: ["es", "Spania", "din Spania"], romania: ["ro", "România", "din România"],
  portugalia: ["pt", "Portugalia", "din Portugalia"], irlanda: ["ie", "Irlanda", "din Irlanda"], belgia: ["be", "Belgia", "din Belgia"],
  olanda: ["nl", "Olanda", "din Olanda"], cehia: ["cz", "Cehia", "din Cehia"], polonia: ["pl", "Polonia", "din Polonia"],
  israel: ["il", "Israel", "din Israel"], rusia: ["ru", "Rusia", "din Rusia"], sua: ["us", "SUA", "din SUA"], canada: ["ca", "Canada", "din Canada"],
};
const W = 1200, H = 675, FW = 168, FH = 126;

async function flag(code) {
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}"><rect width="${FW}" height="${FH}" rx="10"/></svg>`);
  return sharp(readFileSync(path.join(FLAGS, `${code}.svg`)), { density: 300 }).resize(FW, FH, { fit: "fill" }).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

const files = readdirSync(dir);
const lib = JSON.parse(readFileSync("content/locuri/simbol.json", "utf8"));
for (const [slug, stems] of Object.entries(map)) {
  const [code, name, din] = COUNTRIES[slug];
  const photos = [];
  for (const [i, stem] of stems.entries()) {
    const f = files.find((x) => x.startsWith(stem));
    if (!f) throw new Error(`lipsă ${stem}`);
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#06122B" stop-opacity="0.88"/><stop offset="0.55" stop-color="#06122B" stop-opacity="0.35"/><stop offset="1" stop-color="#06122B" stop-opacity="0"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="60" y="86" width="${FW + 8}" height="${FH + 8}" rx="13" fill="#FFFFFF" fill-opacity="0.92"/>
  <rect x="${60 + FW + 32}" y="86" width="${FW + 8}" height="${FH + 8}" rx="13" fill="#FFFFFF" fill-opacity="0.92"/>
  <text x="64" y="${86 + FH + 92}" font-family="${FONT}" font-size="30" font-weight="700" letter-spacing="4" fill="#FFD43B">DIASPORA</text>
  <text x="60" y="${86 + FH + 172}" font-family="${FONT}" font-size="${name.length > 10 ? 72 : 88}" font-weight="700" fill="#FFFFFF">${name}</text>
  <text x="64" y="${86 + FH + 226}" font-family="${FONT}" font-size="32" fill="#FFFFFF" fill-opacity="0.9">Moldovenii ${din}</text>
  <text x="${W - 50}" y="${H - 36}" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.7">ȘTIRI ACTUALE</text>
</svg>`;
    const out = `diaspora-${slug}-${i + 1}.jpg`;
    await sharp(path.join(dir, f))
      .resize(W, H, { fit: "cover" })
      .composite([
        { input: Buffer.from(overlay) },
        { input: await flag(code), left: 64, top: 90 },
        { input: await flag("md"), left: 64 + FW + 32, top: 90 },
      ])
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(path.join("public", "simbol", out));
    photos.push({ url: `https://stiriactuale.info/simbol/${out}`, credit: "Grafică: Știri Actuale (fotografie generată AI)", source: "", alt: `Card: Diaspora — moldovenii ${din}` });
  }
  const id = `card-diaspora-${slug}`;
  const e = {
    id,
    name: `TEMĂ (card instituție/regiune): Diaspora în ${name}: moldovenii ${din}, muncă, acte, consulat, întâmplări`,
    keywords: `diaspora, ${name}, moldovenii ${din}, moldoveni in ${name}, conationali, emigranti, munca in ${name}, consulat, ambasada`,
    photos,
  };
  const k = lib.findIndex((x) => x.id === id);
  if (k >= 0) lib[k] = e;
  else lib.push(e);
}
writeFileSync("content/locuri/simbol.json", JSON.stringify(lib, null, 2) + "\n");
console.log(`carduri diaspora: ${Object.keys(map).length} țări`);
