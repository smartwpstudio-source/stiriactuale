# Brief: calendarul creștin-ortodox — sfinții pe zile (sesiuni cloud)

Site-ul calculează singur Paștele și sărbătorile mobile (Florii, Înălțare, Rusalii, posturi). Tu scrii doar **sărbătorile cu dată fixă și sfinții fiecărei zile**, câte un fișier pe lună: `content/calendar/sfinti/01.json` … `12.json`.

## Datele: după calendarul bisericesc

Data din fișier e **data din calendarul bisericesc** (ex. Sf. Nicolae = 6 decembrie, Nașterea Domnului = 25 decembrie). Aceeași listă servește ambele stiluri: site-ul o afișează pe stil nou la aceeași dată, iar pe stil vechi cu 13 zile mai târziu (Sf. Nicolae → 19 decembrie, Crăciunul → 7 ianuarie). **Nu converti tu datele.**

## Format (exact)

```json
{
  "luna": 12,
  "updated": "AAAA-LL-ZZ",
  "surse": [{ "name": "Mitropolia Moldovei — calendar ortodox", "url": "https://..." }],
  "zile": {
    "6": { "sfinti": ["Sf. Ierarh Nicolae, Arhiepiscopul Mirelor Lichiei"], "sarbatoare": "Sfântul Nicolae", "cruce": "rosie" },
    "7": { "sfinti": ["Sf. Ierarh Ambrozie, Episcopul Mediolanului"], "sarbatoare": null, "cruce": "neagra" }
  }
}
```

- `zile`: **toate** zilele lunii (cheile "1"…"31"; februarie până la "29").
- `sfinti`: 1–4 nume, ca în calendarul bisericesc, cu prescurtările obișnuite (Sf., Cuv., Mc., Ap., Ierarh).
- `sarbatoare`: numele popular al sărbătorii mari din acea zi, dacă există (ex. „Boboteaza”, „Sfântul Ilie”), altfel `null`.
- `cruce`: `"rosie"` (sărbătoare mare, cruce roșie în calendar), `"neagra"` (sfânt cu cinstire deosebită), `null` (zi obișnuită) — cum apare în calendarul sursă.
- **Nu pune** sărbătorile mobile (Paști, Florii, Rusalii, Înălțare) și nici zilele de post — le calculează site-ul.

## Surse

Calendarele oficiale publicate de Biserica Ortodoxă: mitropolia.md (Mitropolia Moldovei), mitropoliabasarabiei.md, basilica.ro / doxologia.ro (calendarul Patriarhiei Române). Minim 1 sursă oficială, verificată acum. Dacă sursele diferă la un sfânt secundar, urmează Mitropolia Moldovei și notează diferența în PR.

## Livrare

Înainte de PR: `npm ci && npm run check:content` → `conținut: OK`. Commit doar cu fișierele din `content/calendar/sfinti/`. Nu faci commit pe `master`.

## Sesiuni (fiecare separat)
- **F1:** lunile 01–04 → branch `calendar-sfinti-1`, PR „Calendar — sfinți ianuarie–aprilie”
- **F2:** lunile 05–08 → branch `calendar-sfinti-2`, PR „Calendar — sfinți mai–august”
- **F3:** lunile 09–12 → branch `calendar-sfinti-3`, PR „Calendar — sfinți septembrie–decembrie”
