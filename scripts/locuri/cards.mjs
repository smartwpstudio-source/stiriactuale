// Cardurile-simbol pe instituții și regiuni (2026-10-26). Rulat din rădăcina proiectului:
// node scripts/locuri/cards.mjs [doar-id]  -> public/simbol/<id>-<n>.png + content/locuri/simbol.json
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(path.join(process.cwd(), "package.json"));
const sharp = require("sharp");

const ICONS = path.join(process.cwd(), "node_modules/@tabler/icons/icons/outline");
const iconPaths = (name) =>
  readFileSync(path.join(ICONS, `${name}.svg`), "utf8")
    .match(/<path[^>]*\/>/g)
    .filter((p) => !p.includes('stroke="none"'))
    .join("");

// [id, titlu, subtitluri (3 variante), pictogramă, [culoare sus, culoare jos], accent, cuvinte-cheie, tema]
const THEMES = [
  ["guvernul", "Guvernul", ["Ședința Guvernului", "Decizii ale Executivului", "Prim-ministrul"], "building-bank", ["#2457C5", "#0D2463"], "#FFFFFF",
    "Guvernul, Executivul, prim-ministrul, premierul, ședința Guvernului, hotărâre de Guvern, ministerele, Cabinetul de miniștri", "Guvernul: decizii, ședințe, prim-ministrul și miniștrii"],
  ["parlamentul", "Parlamentul", ["Ședința plenară", "Legi votate", "Deputații"], "building-arch", ["#9A2445", "#460C1F"], "#FFFFFF",
    "Parlamentul, legislativul, deputații, ședința plenară, proiect de lege, legea votată, fracțiunea, președintele Parlamentului", "Parlamentul: legi, ședințe, deputați"],
  ["presedintia", "Președinția", ["Președintele Republicii Moldova", "Decrete și declarații", "Consiliul Suprem de Securitate"], "flag", ["#2A3A72", "#10173A"], "#E2B84B",
    "Președinția, președintele țării, șefa statului, decret prezidențial, Consiliul Suprem de Securitate, declarația președintelui", "Președinția: președintele țării, decrete, declarații"],
  ["transnistria", "Transnistria", ["Regiunea transnistreană", "Procesul de reglementare", "Malul stâng al Nistrului"], "map-2", ["#2B6670", "#0E2E34"], "#FFFFFF",
    "Transnistria, regiunea transnistreană, Tiraspol, liderul de la Tiraspol, Krasnoselski, malul stâng, reglementarea transnistreană, 5+2, separatist", "Transnistria: regiunea transnistreană, Tiraspolul, liderii și negocierile"],
  ["gagauzia", "Găgăuzia", ["UTA Găgăuzia", "Adunarea Populară de la Comrat", "Alegerile bașcanului"], "map-pin", ["#2F7445", "#123520"], "#FFFFFF",
    "Găgăuzia, UTA Găgăuzia, autonomia găgăuză, Comrat, bașcanul, Adunarea Populară, guvernatorul Găgăuziei", "Găgăuzia: autonomia, Comratul, bașcanul, Adunarea Populară"],
  ["alegeri", "Alegeri", ["Comisia Electorală Centrală", "Ziua votului", "Rezultatele scrutinului"], "checkbox", ["#6141A8", "#2A1957"], "#FFFFFF",
    "alegeri, scrutin, vot, CEC, Comisia Electorală Centrală, candidați, campanie electorală, referendum, secții de votare, rezultate", "Alegeri: CEC, campanie, vot, rezultate"],
  ["uniunea-europeana", "Uniunea Europeană", ["Integrarea europeană", "Negocierile de aderare", "Fonduri și proiecte europene"], "stars-eu", ["#1E44A6", "#0A1E5E"], "#FFD43B",
    "Uniunea Europeană, UE, integrare europeană, aderare, Bruxelles, Comisia Europeană, negocieri de aderare, fonduri europene, Consiliul European", "Uniunea Europeană: integrarea, aderarea, fondurile UE"],
  ["justitie", "Justiție", ["Instanța de judecată", "Procuratura", "Reforma justiției"], "scale", ["#6E4B2C", "#33200E"], "#E9C98A",
    "justiție, instanța, judecătoria, Curtea de Apel, Curtea Supremă, judecători, CSM, procuratura, sentința, dosar în instanță, reforma justiției, vetting", "Justiție: instanțe, judecători, procuratura, sentințe"],
  ["diplomatie", "Diplomație", ["Relații externe", "Vizită oficială", "Ministerul Afacerilor Externe"], "world", ["#1D6F92", "#0A3345"], "#FFFFFF",
    "diplomație, MAEIE, ministrul de Externe, ambasador, ambasada, vizită oficială, relații bilaterale, parteneri externi, întâlnire oficială", "Diplomație: vizite oficiale, ambasade, relații externe"],
  ["primaria-chisinau", "Primăria Chișinău", ["Consiliul Municipal", "Decizii pentru capitală", "Primarul general"], "building-community", ["#B84A2E", "#5A1D10"], "#FFFFFF",
    "Primăria Chișinău, primăria capitalei, Consiliul Municipal Chișinău, CMC, primarul general, Ceban, municipiul Chișinău, decizia primăriei", "Primăria Chișinău: Consiliul Municipal, primarul, decizii pentru capitală"],
  ["banca-nationala", "Banca Națională", ["Rata de bază", "Cursul leului", "Inflația"], "coins", ["#1F6156", "#0A2A25"], "#E2B84B",
    "BNM, Banca Națională a Moldovei, rata de bază, politica monetară, cursul leului, inflația, rezervele valutare", "Banca Națională: rata de bază, cursul leului, inflația"],
  ["aparare", "Apărare și securitate", ["Armata Națională", "Securitatea statului", "Spațiul aerian"], "shield", ["#4E5D2C", "#1F2710"], "#FFFFFF",
    "apărare, Armata Națională, Ministerul Apărării, militari, securitate, SIS, spațiul aerian, exerciții militare, neutralitate", "Apărare și securitate: armata, SIS, spațiul aerian"],
  ["ucraina", "Ucraina", ["Relațiile cu Ucraina", "Vizită la Kiev", "Războiul din Ucraina"], "map-2", ["#1F4E9C", "#0B2352"], "#FFD43B",
    "Ucraina, Kiev, Kyiv, relațiile moldo-ucrainene, Zelenski, războiul din Ucraina, Odesa, vizită în Ucraina", "Ucraina: relațiile cu Moldova, vizite, războiul"],
  ["diaspora", "Diaspora", ["Moldovenii de peste hotare", "Votul din diaspora", "Servicii consulare"], "plane-departure", ["#3B5DA6", "#16264F"], "#FFFFFF",
    "diaspora, moldovenii de peste hotare, cetățenii din străinătate, consulat, servicii consulare, votul din diaspora, emigranți, migrație", "Diaspora: moldovenii de peste hotare, consulate, votul din străinătate"],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const FONT = "Segoe UI, Arial, Helvetica, sans-serif";

function euStars(cx, cy, r, size, color, opacity) {
  let out = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI;
    const x = cx + r * Math.sin(a);
    const y = cy - r * Math.cos(a);
    const pts = Array.from({ length: 10 }, (_, k) => {
      const rr = k % 2 ? size * 0.4 : size;
      const b = (k / 10) * 2 * Math.PI;
      return `${(x + rr * Math.sin(b)).toFixed(1)},${(y - rr * Math.cos(b)).toFixed(1)}`;
    }).join(" ");
    out += `<polygon points="${pts}" fill="${color}" opacity="${opacity}"/>`;
  }
  return out;
}

function icon(name, x, y, size, color, width, opacity) {
  if (name === "stars-eu") return euStars(x + size / 2, y + size / 2, size * 0.36, size * 0.075, color, opacity);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${iconPaths(name)}</svg>`;
}

function card([id, title, subs, ic, [c1, c2], accent], v) {
  const sub = subs[v];
  const titleSize = Math.min(104, Math.floor(1180 / (title.length * 0.6)));
  // trei variante: watermark în dreapta / jos-dreapta / dreapta-sus, gradient diferit
  const wm = [
    [640, 70, 560],
    [700, 190, 520],
    [660, -30, 540],
  ][v];
  const angle = [["0", "0", "1", "1"], ["0", "1", "1", "0"], ["0", "0", "0", "1"]][v];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs><linearGradient id="g" x1="${angle[0]}" y1="${angle[1]}" x2="${angle[2]}" y2="${angle[3]}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <circle cx="${wm[0] + wm[2] / 2}" cy="${wm[1] + wm[2] / 2}" r="${wm[2] * 0.62}" fill="none" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="3"/>
  <circle cx="${wm[0] + wm[2] / 2}" cy="${wm[1] + wm[2] / 2}" r="${wm[2] * 0.7}" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="2"/>
  ${icon(ic, wm[0], wm[1], wm[2], "#FFFFFF", 1.1, 0.1)}
  <circle cx="132" cy="140" r="52" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2"/>
  ${icon(ic, 100, 108, 64, accent, 1.6, 1)}
  <text x="206" y="132" font-family="${FONT}" font-size="22" font-weight="600" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.85">ȘTIRI ACTUALE</text>
  <text x="206" y="162" font-family="${FONT}" font-size="20" fill="#FFFFFF" fill-opacity="0.6">Imagine simbol</text>
  <text x="80" y="330" font-family="${FONT}" font-size="42" fill="#FFFFFF" fill-opacity="0.92">${esc(sub)}</text>
  <text x="76" y="${330 + titleSize + 10}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="#FFFFFF">${esc(title)}</text>
  <rect x="80" y="${330 + titleSize + 52}" width="120" height="8" rx="4" fill="${accent}"/>
</svg>`;
}

const only = process.argv[2];
const out = [];
for (const t of THEMES) {
  if (only && t[0] !== only) continue;
  const photos = [];
  for (let v = 0; v < 3; v++) {
    const file = `${t[0]}-${v + 1}.png`;
    await sharp(Buffer.from(card(t, v))).png({ compressionLevel: 9 }).toFile(path.join("public/simbol", file));
    photos.push({ url: `https://stiriactuale.info/simbol/${file}`, credit: "Imagine simbol", source: "", alt: `Card: ${t[1]} — ${t[2][v]}` });
  }
  out.push({ id: `card-${t[0]}`, name: `TEMĂ (card instituție/regiune): ${t[7]}`, keywords: t[6], photos });
}
if (!only) {
  const file = "content/locuri/simbol.json";
  const all = JSON.parse(readFileSync(file, "utf8")).filter((p) => !p.id.startsWith("card-"));
  writeFileSync(file, `${JSON.stringify([...all, ...out], null, 2)}\n`);
}
console.log(`carduri: ${out.length * 3}`);
