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
  // urna de vot (editorul, 2026-11-12): orice alegeri, oricare regiune — naționale, locale, Găgăuzia
  ["alegeri", "Alegeri", ["Ziua votului", "Campania electorală", "Rezultatele votului"], "checkbox", ["#4B3A9E", "#1E1650"], "#FFD43B",
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
  // sport (2026-10-28): subtitlul doar „Sport” — unul anume („Lupte greco-romane”,
  // „Super Liga”) ar fi fals la jumătate din știri. Pictogramele olimpice din domeniul public (Wikimedia Commons,
  // scripts/locuri/sport/); o sportivă nu primește steaguri și nici doi bărbați din stoc
  ["lupte", "Lupte", ["Sport", "Sport", "Sport"], "pic:lupte", ["#8A2B2B", "#3D0F0F"], "#FFD43B",
    "lupte, lupte libere, lupte greco-romane, luptător, luptătoare, wrestling, campionatul mondial de lupte, campionatul european de lupte", "Sport, lupte: lupte libere și greco-romane, luptătorii moldoveni, medalii"],
  ["judo", "Judo", ["Sport", "Sport", "Sport"], "pic:judo", ["#2C4A8A", "#101F42"], "#FFFFFF",
    "judo, judocan, judocană, tatami, Grand Slam, Grand Prix de judo", "Sport, judo: turnee, judocanii moldoveni, medalii"],
  ["box", "Box", ["Sport", "Sport", "Sport"], "pic:box", ["#6B1F4F", "#2E0A21"], "#FFFFFF",
    "box, boxer, pugilist, pugilistă, ring, meci de box, gală de box, kickboxing", "Sport, box: meciuri, gale, pugiliștii moldoveni"],
  ["fotbal", "Fotbal", ["Sport", "Sport", "Sport"], "pic:fotbal", ["#2F7445", "#123520"], "#FFFFFF",
    "fotbal, meci, echipa națională de fotbal, naționala, Super Liga, Sheriff, Zimbru, Petrocub, Milsami, FMF, gol, antrenor, UEFA, Liga Conferințelor", "Sport, fotbal: naționala, campionatul Moldovei, cupele europene"],
  ["atletism", "Atletism", ["Sport", "Sport", "Sport"], "pic:atletism", ["#B0582A", "#4F220C"], "#FFFFFF",
    "atletism, alergare, maraton, semimaraton, sprint, săritura, aruncarea, atlet, atletă", "Sport, atletism: concursuri, maraton, atleții moldoveni"],
  ["haltere", "Haltere", ["Sport", "Sport", "Sport"], "pic:haltere", ["#4A4F57", "#1C1F24"], "#E2B84B",
    "haltere, haltere, haltrofil, haltrofilă, ridicarea greutăților, powerlifting", "Sport, haltere: campionate, haltrofilii moldoveni"],
  // pietonul lovit (2026-11-05): ilustrația cu două mașini ciocnite era falsă la Stăuceni
  ["pieton", "Accident cu pieton", ["Siguranța pietonilor", "Siguranța rutieră", "Siguranța pietonilor"], "walk", ["#B5452B", "#4F1A0E"], "#FFD43B",
    "pieton, pietonă, pietoni, trecere de pietoni, lovit de mașină, lovit de autobuz, lovit de camion, tamponat pe trotuar, accident cu pieton", "Accident cu pieton: pieton lovit de mașină, autobuz sau camion"],
  // teme fără poză potrivită (2026-11-05): 33 din 181 de articole primeau steagul sau stema
  ["razboi", "Război", ["Atacuri și bombardamente", "Conflict armat", "Atacuri și bombardamente"], "bomb", ["#5A2A2A", "#1F0D0D"], "#FF8A65",
    "război, atac, atacuri, bombardament, bombardat, drone, rachete, front, ofensivă, armata rusă, victime civile, raid aerian", "Război și atacuri: bombardamente, drone, rachete, victime"],
  ["energie", "Energie", ["Aprovizionarea cu energie", "Curent și gaz", "Aprovizionarea cu energie"], "bolt", ["#B07A0E", "#4A3104"], "#FFFFFF",
    "energie, energetic, pană de curent, fără curent, deconectări, rețea electrică, aprovizionare cu gaz, Energocom, Moldelectrica, centrală, infrastructură energetică", "Energie: pane de curent, aprovizionarea cu gaz și curent, rețeaua"],
  ["bani-card", "Bani și carduri", ["Plăți și conturi bancare", "Siguranța plăților", "Plăți și conturi bancare"], "credit-card", ["#1F5F8A", "#0B2A40"], "#FFD43B",
    "card bancar, plata cu cardul, cont bancar, bancomat, transfer, tranzacție, comision bancar, plată online, contestarea unei plăți", "Bani și carduri: plăți, conturi bancare, tranzacții contestate"],
  ["auto", "Mașini și acte auto", ["Mașina ta", "Acte și reguli auto", "Mașina ta"], "car", ["#3D4A5C", "#151B24"], "#FFD43B",
    "mașină, automobil, auto, înmatriculare, permis de conducere, RCA, carte verde, ASP auto, VIN, mașină din UE, inspecția tehnică, numere de înmatriculare", "Mașini și acte auto: înmatriculare, permis, asigurare, cumpărarea unei mașini"],
  ["violenta-familie", "Violență în familie", ["Ajutor și protecție", "Drepturile victimelor", "Ajutor și protecție"], "home-shield", ["#6B2E5E", "#2A0F25"], "#FFFFFF",
    "violență în familie, violență domestică, agresor, ordin de protecție, victimă, abuz, centru pentru victime, linia de încredere", "Violență în familie: ordinul de protecție, ajutor pentru victime"],
  ["munca", "Locuri de muncă", ["Joburi și salarii", "Piața muncii", "Joburi și salarii"], "briefcase", ["#2E6B5E", "#0F2A24"], "#FFFFFF",
    "locuri de muncă, joburi, angajare, angajator, târg de joburi, șomaj, ANOFM, contract de muncă, Inspecția Muncii, piața muncii", "Locuri de muncă: joburi, angajare, drepturile angajaților"],
  ["aeroport", "Aeroport și zboruri", ["Zboruri și pasageri", "Transport aerian", "Zboruri și pasageri"], "plane", ["#2A5FA8", "#0D2654"], "#FFFFFF",
    "aeroport, zbor, zboruri, avion, pasageri, cursă aeriană, companie aeriană, Wizz Air, bilete de avion, aterizare, decolare, alertă cu bombă la zbor", "Aeroport și zboruri: zboruri, pasageri, companii aeriene"],
  // compensațiile (editorul, 2026-11-06): la facturi, la zboruri, plăți de la stat
  ["compensatii", "Compensații", ["Plăți compensatorii", "Cine primește și cât", "Plăți compensatorii"], "receipt-refund", ["#1F7A5C", "#0A3326"], "#FFD43B",
    "compensații, compensație, compensare, compensații la gaz, compensații la curent, compensații la încălzire, sezonul rece, Energie Vulnerabilitate, plată compensatorie, despăgubire, compensații pentru zbor", "Compensații: la facturi, la zboruri, plăți compensatorii de la stat"],
  // dronele și baloanele în spațiul aerian al Moldovei (editorul, 2026-11-07: subiect frecvent)
  ["drona", "Drone", ["Spațiul aerian", "Obiecte în spațiul aerian", "Spațiul aerian"], "pic:drona", ["#34495E", "#121A22"], "#FFB74D",
    "dronă, drone, dronă căzută, fragmente de dronă, Gerbera, Shahed, Gheran, aerostat, balon, spațiul aerian, survol neautorizat, obiect zburător, alertă aeriană", "Drone: drone și baloane în spațiul aerian al Moldovei, drone căzute"],
  // apa oprită, avariile și lucrările la rețea (editorul, 2026-11-10: Hulboaca primise „pensii și salarii”)
  ["apa", "Apă și canalizare", ["Sistări de apă", "Lucrări la rețeaua de apă", "Apă potabilă"], "droplet", ["#1F6FA8", "#0A2C47"], "#7FD3FF",
    "apă, fără apă, sistarea apei, apa potabilă, Apă-Canal, apeduct, canalizare, rețeaua de apă, avarie la apeduct, deconectări de la apă", "Apă și canalizare: sistări, avarii, lucrări la rețea, apa potabilă"],
  // școala, colegiul, universitatea (editorul, 2026-11-12: colegiul agroindustrial de la Ungheni primise „Industrie”)
  ["educatie", "Educație și învățământ", ["Școli și grădinițe", "Elevi și profesori", "Învățământ profesional"], "school", ["#1F6F8B", "#0B2F3D"], "#FFD43B",
    "educație, învățământ, școală, liceu, gimnaziu, grădiniță, colegiu, universitate, elevi, studenți, profesori, bacalaureat, Ministerul Educației, an de studii", "Educație și învățământ: școli, grădinițe, colegii, universități, elevi și profesori"],
  // producția, fabricile, industria (editorul, 2026-11-12: producția de rachete antigrindină primise „Război”)
  ["industrie", "Producție și industrie", ["Economia Moldovei", "Fabrici și investiții", "Producție locală"], "building-factory-2", ["#4B5563", "#1F2937"], "#F59E0B",
    "producție, fabrică, uzină, industrie, întreprindere, parc industrial, zonă economică liberă, investiții în producție, export, linie de producție, producție locală", "Producție și industrie: fabrici, uzine, investiții în producție, economia reală"],
  // temele stabile fără card (2026-11-12, analiza ultimelor ~120 de coperte)
  ["curs-valutar", "Cursul valutar", ["Cursul oficial al leului", "Euro, dolar și leu", "Cursul oficial al leului"], "currency-euro", ["#14532D", "#052E16"], "#4ADE80",
    "cursul valutar, cursul oficial, BNM, euro, dolar, leu, leul moldovenesc, schimb valutar, case de schimb", "Cursul valutar: cursul oficial al leului față de euro și dolar"],
  ["vremea", "Vremea", ["Prognoza meteo", "Vremea în Moldova", "Prognoza meteo"], "sun-wind", ["#2563EB", "#1E3A8A"], "#FDE047",
    "vremea, prognoza meteo, temperaturi, ploi, ninsori, vânt, Serviciul Hidrometeorologic de Stat", "Vremea: prognoza meteo pentru Moldova"],
  ["incendii", "Incendii", ["Pompierii au intervenit", "Incendiu", "Salvatorii IGSU"], "flame", ["#B91C1C", "#450A0A"], "#FDBA74",
    "incendiu, a luat foc, a ars, pompieri, IGSU, flăcări, incendiu de vegetație, casă arsă", "Incendii: case, depozite, mașini și vegetație cuprinse de flăcări"],
  ["mediu", "Mediul", ["Protecția mediului", "Natură și poluare", "Inspecția de mediu"], "trees", ["#15803D", "#14532D"], "#BEF264",
    "mediu, protecția mediului, poluare, tăieri ilegale, arbori, păduri, deșeuri, gunoi, arderea frunzelor, Inspectoratul pentru Protecția Mediului, Agenția de Mediu", "Mediul: poluare, păduri, deșeuri, inspecții de mediu"],
  ["locuinta", "Locuința", ["Case și apartamente", "Credite pentru locuință", "Blocuri și renovare"], "home", ["#9A3412", "#431407"], "#FDE68A",
    "locuință, apartament, casă, Prima Casă, credit ipotecar, chirie, bloc, renovare energetică, asociația de proprietari", "Locuința: apartamente, case, Prima Casă, credite ipotecare, chirii, blocuri"],
  ["ajutoare-sociale", "Ajutoare sociale", ["Sprijin de la stat", "Persoane cu dizabilități", "Asistență socială"], "heart-handshake", ["#0E7490", "#083344"], "#FBCFE8",
    "ajutor social, asistență socială, persoane cu dizabilități, veterani, vârstnici, asistenți sociali, cantine sociale, indemnizații", "Ajutoare sociale: dizabilități, vârstnici, veterani, asistență socială"],
  ["traditii", "Sărbători și tradiții", ["Credință și obiceiuri", "Sărbători creștine", "Hramuri și obiceiuri"], "building-church", ["#7C2D12", "#3B0A0A"], "#FCD34D",
    "sărbători, tradiții, post, Crăciun, Paște, biserică, hram, obiceiuri, credință, Mitropolia", "Sărbători și tradiții: posturi, sărbători creștine, hramuri, obiceiuri"],
  // hackerii, atacurile informatice (editorul, 2026-11-13: legea despre hackeri primise „Energie”)
  ["cibernetic", "Securitate cibernetică", ["Atacuri informatice", "Date și sisteme protejate", "Hackeri și pedepse"], "shield-lock", ["#0F766E", "#042F2E"], "#5EEAD4",
    "hackeri, atac cibernetic, atacuri informatice, securitate cibernetică, sisteme informatice, date personale, virus, ransomware, STISC, CERT", "Securitate cibernetică: hackeri, atacuri informatice, protecția datelor și a sistemelor"],
  // prețurile la carburanți (editorul, 2026-11-10): panoul de prețuri al benzinăriei, cu cifre în schimbare
  ["carburanti", "Carburanți", ["Prețuri la benzină și motorină", "Prețurile carburanților", "Prețuri la benzinării"], "gas-station", ["#2B3340", "#0D1117"], "#FFB300",
    "carburanți, benzină, motorină, GPL, prețuri la carburanți, benzinării, prețul benzinei, prețul motorinei, ANRE carburanți, scumpiri la pompă, ieftiniri", "Carburanți: prețurile la benzină, motorină și GPL, benzinării"],
  ["sport", "Sport", ["Competiții și medalii", "Competiții și medalii", "Competiții și medalii"], "medal", ["#1F5F8A", "#0B2A40"], "#FFD43B",
    "sport, sportiv, sportivă, medalie, campionat, competiție, olimpiadă, jocurile olimpice, turneu, campion, campioană, lot național", "Sport: sportivii moldoveni, medalii, competiții (când nu e altă temă de sport)"],
];

// pictogramele sportive: silueta albă (fundal) și în culoarea accentului (sus)
const PIC = {};
async function loadPics() {
  for (const t of THEMES) {
    if (!t[3].startsWith("pic:")) continue;
    const name = t[3].slice(4);
    const png = await sharp(readFileSync(path.join(process.cwd(), "scripts/locuri/sport", `${name}.svg`)), { density: 300 })
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .toBuffer();
    const alpha = await sharp(png).extractChannel("alpha").toBuffer();
    const tint = async (hex) => {
      const buf = await sharp({ create: { width: 512, height: 512, channels: 3, background: hex } }).joinChannel(alpha).png().toBuffer();
      return `data:image/png;base64,${buf.toString("base64")}`;
    };
    PIC[name] = { white: await tint("#FFFFFF"), accent: await tint(t[5]) };
  }
}

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
  if (name.startsWith("pic:")) {
    const p = PIC[name.slice(4)];
    return `<image x="${x}" y="${y}" width="${size}" height="${size}" opacity="${opacity}" href="${color === "#FFFFFF" ? p.white : p.accent}"/>`;
  }
  if (name === "stars-eu") return euStars(x + size / 2, y + size / 2, size * 0.36, size * 0.075, color, opacity);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${iconPaths(name)}</svg>`;
}

// panoul de prețuri al benzinăriei: cifre LED în celule, săgeți de creștere/scădere; valorile
// diferă de la o variantă la alta, ca să nu treacă drept prețul zilei
const FUEL = [
  [["Benzină 95", "25.49", 1], ["Motorină", "21.87", 1], ["GPL", "13.20", -1]],
  [["Benzină 95", "24.96", -1], ["Motorină", "21.35", -1], ["GPL", "13.45", 1]],
  [["Benzină 95", "25.18", 1], ["Motorină", "21.62", -1], ["GPL", "13.32", 1]],
];
function pylon(v, accent) {
  const x = 735, w = 385;
  let rows = "";
  FUEL[v].forEach(([name, price, dir], i) => {
    const y = 175 + i * 150;
    rows += `<text x="${x + 28}" y="${y + 6}" font-family="${FONT}" font-size="27" font-weight="600" fill="#FFFFFF">${esc(name)}</text>`;
    let cx = x + 28;
    for (const ch of price) {
      if (ch === ".") {
        rows += `<circle cx="${cx + 6}" cy="${y + 92}" r="5" fill="${accent}"/>`;
        cx += 14;
        continue;
      }
      rows += `<rect x="${cx}" y="${y + 24}" width="58" height="78" rx="6" fill="#050608" stroke="#FFFFFF" stroke-opacity="0.08"/>
      <text x="${cx + 29}" y="${y + 89}" text-anchor="middle" font-family="Consolas, monospace" font-size="72" font-weight="700" fill="${accent}">${ch}</text>
      <line x1="${cx}" y1="${y + 63}" x2="${cx + 58}" y2="${y + 63}" stroke="#000000" stroke-width="3"/>`;
      cx += 66;
    }
    const ay = y + 63;
    rows += dir > 0
      ? `<polygon points="${x + w - 52},${ay + 18} ${x + w - 22},${ay + 18} ${x + w - 37},${ay - 16}" fill="#FF4D4D"/>`
      : `<polygon points="${x + w - 52},${ay - 16} ${x + w - 22},${ay - 16} ${x + w - 37},${ay + 18}" fill="#3DDC84"/>`;
  });
  return `<rect x="${x + w / 2 - 30}" y="600" width="60" height="80" fill="#1A1F27"/>
  <rect x="${x}" y="40" width="${w}" height="570" rx="22" fill="#151A22" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="3"/>
  <path d="M${x} 62 a22 22 0 0 1 22 -22 h${w - 44} a22 22 0 0 1 22 22 v58 h-${w} z" fill="${accent}"/>
  ${icon("gas-station", x + 24, 52, 56, "#151A22", 2, 1)}
  <text x="${x + 96}" y="98" font-family="${FONT}" font-size="34" font-weight="800" letter-spacing="2" fill="#151A22">PREȚURI · LEI/L</text>
  ${rows}`;
}

// cursul valutar: panou de case de schimb, cifre LED în schimbare (nu cursul zilei)
const RATES = [
  [["EUR", "20.12", 1], ["USD", "17.94", -1], ["RON", "3.95", 1]],
  [["EUR", "19.87", -1], ["USD", "17.61", -1], ["RON", "3.91", -1]],
  [["EUR", "20.34", 1], ["USD", "18.06", 1], ["RON", "4.02", 1]],
];
function ratesBoard(v, accent) {
  const x = 735, w = 385;
  let rows = "";
  RATES[v].forEach(([cur, val, dir], i) => {
    const y = 160 + i * 150;
    rows += `<circle cx="${x + 62}" cy="${y + 63}" r="40" fill="#FFFFFF" fill-opacity="0.1" stroke="${accent}" stroke-width="3"/>
    <text x="${x + 62}" y="${y + 74}" text-anchor="middle" font-family="${FONT}" font-size="27" font-weight="800" fill="#FFFFFF">${cur}</text>`;
    let cx = x + 122;
    for (const ch of val) {
      if (ch === ".") { rows += `<circle cx="${cx + 6}" cy="${y + 92}" r="5" fill="${accent}"/>`; cx += 14; continue; }
      rows += `<rect x="${cx}" y="${y + 24}" width="46" height="78" rx="6" fill="#050608" stroke="#FFFFFF" stroke-opacity="0.08"/>
      <text x="${cx + 23}" y="${y + 87}" text-anchor="middle" font-family="Consolas, monospace" font-size="62" font-weight="700" fill="${accent}">${ch}</text>
      <line x1="${cx}" y1="${y + 63}" x2="${cx + 46}" y2="${y + 63}" stroke="#000000" stroke-width="3"/>`;
      cx += 52;
    }
    const ay = y + 63;
    rows += dir > 0
      ? `<polygon points="${x + w - 46},${ay + 16} ${x + w - 18},${ay + 16} ${x + w - 32},${ay - 15}" fill="#FF4D4D"/>`
      : `<polygon points="${x + w - 46},${ay - 15} ${x + w - 18},${ay - 15} ${x + w - 32},${ay + 16}" fill="#4ADE80"/>`;
  });
  return `<rect x="${x}" y="40" width="${w}" height="590" rx="22" fill="#0B1410" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="3"/>
  <path d="M${x} 62 a22 22 0 0 1 22 -22 h${w - 44} a22 22 0 0 1 22 22 v58 h-${w} z" fill="${accent}"/>
  <text x="${x + w / 2}" y="98" text-anchor="middle" font-family="${FONT}" font-size="34" font-weight="800" letter-spacing="2" fill="#0B1410">CURS · LEI</text>
  ${rows}`;
}

// vremea: trei zile de prognoză, cu pictograme și temperaturi
const FORECAST = [
  [["sun", "+12°"], ["cloud-rain", "+7°"], ["cloud", "+5°"]],
  [["cloud-snow", "-2°"], ["snowflake", "-5°"], ["cloud", "+1°"]],
  [["sun-wind", "+18°"], ["sun", "+22°"], ["cloud-rain", "+15°"]],
];
function forecast(v, accent) {
  const x = 700, w = 450;
  let cols = "";
  FORECAST[v].forEach(([ic, t], i) => {
    const cx = x + 20 + i * 140;
    cols += `<rect x="${cx}" y="170" width="130" height="330" rx="18" fill="#FFFFFF" fill-opacity="${i === 0 ? 0.2 : 0.1}"/>
    ${icon(ic, cx + 25, 210, 80, i === 0 ? accent : "#FFFFFF", 1.6, 1)}
    <text x="${cx + 65}" y="400" text-anchor="middle" font-family="${FONT}" font-size="48" font-weight="800" fill="#FFFFFF">${t}</text>
    <rect x="${cx + 35}" y="440" width="60" height="8" rx="4" fill="${i === 0 ? accent : "#FFFFFF"}" fill-opacity="${i === 0 ? 1 : 0.4}"/>`;
  });
  return `<rect x="${x}" y="130" width="${w}" height="410" rx="26" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="3"/>
  ${cols}`;
}

// urna de vot: buletinul cu ștampila „VOTAT” intră prin fantă; variantele mută buletinul
function ballotBox(v, accent) {
  // buletinul (îngust cât fanta) e desenat întâi; urna și capacul îl acoperă, ca și cum ar intra
  const [by, rot] = [[96, -4], [70, 3], [120, -9]][v];
  const bx = 860;
  const stamp = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="#2E5BBA" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="31" fill="none" stroke="#2E5BBA" stroke-width="2"/>
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="800" fill="#2E5BBA">VOTAT</text>`;
  return `<g transform="rotate(${rot} ${bx + 80} 330)">
    <rect x="${bx}" y="${by}" width="160" height="300" rx="6" fill="#FFFFFF"/>
    <rect x="${bx + 18}" y="${by + 24}" width="90" height="11" rx="5" fill="#C9CCD6"/>
    <rect x="${bx + 18}" y="${by + 48}" width="124" height="9" rx="4" fill="#E2E4EA"/>
    <rect x="${bx + 18}" y="${by + 68}" width="108" height="9" rx="4" fill="#E2E4EA"/>
    ${stamp(bx + 100, by + 150)}
  </g>
  <rect x="730" y="330" width="420" height="345" rx="18" fill="#5B4CB8" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="4"/>
  <rect x="700" y="306" width="480" height="48" rx="10" fill="${accent}"/>
  <rect x="845" y="322" width="190" height="16" rx="8" fill="#1E1650"/>
  <text x="940" y="520" text-anchor="middle" font-family="${FONT}" font-size="64" font-weight="800" fill="#FFFFFF" fill-opacity="0.92" letter-spacing="6">VOT</text>`;
}

function card([id, title, subs, ic, [c1, c2], accent], v) {
  const sub = subs[v];
  // cu panou în dreapta (carburanți, curs, urnă), titlul încape în ~640 px
  const titleSize = Math.min(104, Math.floor((["carburanti", "curs-valutar", "alegeri"].includes(id) ? 640 : 1180) / (title.length * 0.6)));
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
  ${id === "carburanti" ? pylon(v, accent) : id === "alegeri" ? ballotBox(v, accent) : id === "curs-valutar" ? ratesBoard(v, accent) : id === "vremea" ? forecast(v, accent) : `<circle cx="${wm[0] + wm[2] / 2}" cy="${wm[1] + wm[2] / 2}" r="${wm[2] * 0.62}" fill="none" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="3"/>
  <circle cx="${wm[0] + wm[2] / 2}" cy="${wm[1] + wm[2] / 2}" r="${wm[2] * 0.7}" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="2"/>
  ${icon(ic, wm[0], wm[1], wm[2], "#FFFFFF", 1.1, 0.1)}`}
  <circle cx="132" cy="140" r="52" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2"/>
  ${icon(ic, 100, 108, 64, accent, 1.6, 1)}
  <text x="206" y="132" font-family="${FONT}" font-size="22" font-weight="600" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.85">ȘTIRI ACTUALE</text>
  <text x="206" y="162" font-family="${FONT}" font-size="20" fill="#FFFFFF" fill-opacity="0.6">Imagine simbol</text>
  <text x="80" y="330" font-family="${FONT}" font-size="42" fill="#FFFFFF" fill-opacity="0.92">${esc(sub)}</text>
  <text x="76" y="${330 + titleSize + 10}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="#FFFFFF">${esc(title)}</text>
  <rect x="80" y="${330 + titleSize + 52}" width="120" height="8" rx="4" fill="${accent}"/>
</svg>`;
}

await loadPics();
// „node scripts/locuri/cards.mjs a,b”: doar acele carduri, restul listei rămâne neatins
const only = process.argv[2]?.split(",");
const out = [];
for (const t of THEMES) {
  if (only && !only.includes(t[0])) continue;
  const photos = [];
  for (let v = 0; v < 3; v++) {
    const file = `${t[0]}-${v + 1}.png`;
    await sharp(Buffer.from(card(t, v))).png({ compressionLevel: 9 }).toFile(path.join("public/simbol", file));
    photos.push({ url: `https://stiriactuale.info/simbol/${file}`, credit: "Imagine simbol", source: "", alt: `Card: ${t[1]} — ${t[2][v]}` });
  }
  out.push({ id: `card-${t[0]}`, name: `TEMĂ (card instituție/regiune): ${t[7]}`, keywords: t[6], photos });
}
{
  const file = "content/locuri/simbol.json";
  const all = JSON.parse(readFileSync(file, "utf8"));
  const ids = new Set(out.map((p) => p.id));
  const kept = only ? all.filter((p) => !ids.has(p.id)) : all.filter((p) => !p.id.startsWith("card-"));
  writeFileSync(file, `${JSON.stringify([...kept, ...out], null, 2)}\n`);
}
console.log(`carduri: ${out.length * 3}`);
await import("./simbol-mini.mjs");
