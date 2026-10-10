# Rubricile evergreen: Calendarul agricol, Bucătăria moldovenească, Moldova turistică

Aprobat de proprietar 2026-10-10. Trei piloni informaționali, fiecare cu ghiduri în context, apoi articole evergreen (și rețete la bucătărie). Planul de conținut detaliat al fiecărui pilon: `docs/cloud/calendar-agricol.md`, `docs/cloud/bucatarie.md`, `docs/cloud/turism.md`.

## Categorii de ghiduri (src/lib/content/guides.ts)
- `gospodarie` — „Gospodărie, grădină și vie” (calendarul agricol și ghidurile lui)
- `bucatarie` — „Bucătăria moldovenească”
- `turism` — „Moldova turistică” (`calatorii` rămâne pentru călătoriile din Moldova în străinătate)

Ghidurile sunt JSON în `content/ghiduri/<slug>.json` + varianta rusă obligatorie în `content/ghiduri-ru/<slug>.json` (vezi `docs/cloud/ghiduri.md`, `docs/cloud/traducere-ru.md`). Fără ea, `npm run check:content` pică.

## Rețetele — tip nou de conținut
`content/retete/<slug>.json` (RO) și `content/retete-ru/<slug>.json` (RU, obligatoriu, același slug). Pagini: `/retete/` (lista), `/retete/<slug>/`, `/ru/retete/<slug>/`.

```json
{
  "slug": "sarmale-in-foi-de-varza",
  "title": "Sarmale în foi de varză murată, ca la moldoveni",
  "description": "110–175 caractere, meta description",
  "updated": "2026-10-10",
  "image": { "url": "https://…blob.vercel-storage.com/retete/sarmale.jpg", "credit": "Magnific (stoc)", "alt": "ce se vede EXACT în poză" },
  "servings": 8,
  "prepMinutes": 60,
  "cookMinutes": 180,
  "difficulty": "mediu",
  "fasting": false,
  "course": "fel-principal",
  "region": "toată Moldova",
  "occasions": ["craciunul-nasterea-domnului-traditii-in-moldova"],
  "ingredients": [
    { "group": "Umplutura", "items": [ { "qty": "500", "unit": "g", "name": "carne tocată de porc", "note": "mai grasă" } ] }
  ],
  "steps": [ { "text": "Pasul, o acțiune clară.", "minutes": 10 } ],
  "tips": ["…"],
  "mistakes": ["…"],
  "variants": [ { "region": "sudul Moldovei", "text": "…" } ],
  "storyHtml": "<p>Povestea felului de mâncare: originea, sărbătoarea, obiceiul.</p>",
  "sources": [ { "name": "…", "url": "https://…" } ],
  "related": ["slug-ghid", "slug-reteta"]
}
```

- `difficulty`: `usor` | `mediu` | `dificil`. `course`: `ciorbe` | `fel-principal` | `aluaturi` | `deserturi` | `aperitive` | `garnituri` | `conserve` | `bauturi`.
- `occasions` și `related`: slug-uri existente de ghiduri sau rețete.
- `ingredients[].group` opțional (rețetele simple au un singur grup fără nume).
- `storyHtml`: faptele istorice cu sursă în `sources`; fără povești inventate.
- RU: aceeași structură, text tradus; `qty` identic, `unit` tradus (г, кг, мл, шт., ст. л., ч. л.).

## Poze
Stoc Magnific (licență comercială): `npx tsx --env-file=.env.local scripts/stock.ts search "<termen în engleză>" 10`, apoi `… get <id> retete/<slug>` → adresa din Blob. Previzualizează poza înainte (descarcă preview-ul și uită-te la ea): poza trebuie să arate EXACT felul de mâncare / locul. `alt` descrie ce se vede în poză, scris de cel care a văzut-o. Pentru locuri reale (mănăstiri, cetăți, vinării) — doar poze reale ale locului (arhiva `content/locuri/`, Wikimedia Commons cu autorul), nu stoc cu alt loc.

## Etape
1. Cei 3 piloni (RO+RU), planurile de conținut, șablonul de rețetă + primele 3 rețete.
2. Ghidurile din planuri.
3. Articolele evergreen și restul rețetelor.
Totul urcă pe Vercel într-un singur push, la final.
