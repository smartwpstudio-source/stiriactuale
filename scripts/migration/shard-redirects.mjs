// Redirecturile articolelor WordPress (src/data/legacy-redirects.json, 722 KB, 4.191 de
// adrese) împărțite după prima literă în public/redirects/<literă>.json (2026-10-31).
// Importat direct în proxy.ts, tabelul întreg se citea la fiecare pornire a Worker-ului
// (~170 ms de procesor la pornirea la rece); acum proxy.ts citește doar bucata necesară,
// și doar pentru o adresă veche cu un singur segment. Se rulează după generate-redirects.ts.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const map = JSON.parse(readFileSync("src/data/legacy-redirects.json", "utf8"));
const shards = {};
for (const [k, v] of Object.entries(map)) {
  const c = /^[a-z0-9]/.test(k[0]) ? k[0] : "_";
  (shards[c] ??= {})[k] = v;
}
rmSync("public/redirects", { recursive: true, force: true });
mkdirSync("public/redirects");
for (const [c, m] of Object.entries(shards)) writeFileSync(`public/redirects/${c}.json`, JSON.stringify(m));
console.log(`${Object.keys(map).length} adrese în ${Object.keys(shards).length} fișiere`);
