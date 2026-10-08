# Brief: ghidurile în rusă (versiunea /ru/)

Fiecare ghid românesc `content/ghiduri/<slug>.json` primește varianta rusă `content/ghiduri-ru/<slug>.json` — **același slug**, aceeași structură (slug, title, description, category, updated, sources, bodyHtml, faq). Pagina rusă: `/ru/ghiduri/<slug>/`. Pagini doar în rusă (fără pereche românească): `"ruOnly": true`.

## Reguli de traducere (obligatorii)
1. **Aceleași fapte, nimic adăugat sau scos:** cifre, date, termene, sume, articole de lege, linkuri — identice. Dacă găsești o greșeală de fapt în original, NU o corecta în traducere: semnaleaz-o în raport.
2. **Rusă naturală, cum se vorbește în Moldova:** instituțiile cu denumirea rusă folosită oficial în Moldova + acronimul românesc între paranteze la prima mențiune, ex. „Агентство государственных услуг (ASP)”, „Национальная касса социального страхования (CNAS)”, „Государственная налоговая служба (SFS)”, „Национальная медицинская страховая компания (CNAM)”. Unde instituția are site/pagină în rusă, folosește denumirea de acolo. Numele actelor românești: traducerea + originalul între paranteze la prima mențiune (ex. „удостоверение личности (buletin)”).
3. **Linkurile interne `/ghiduri/<slug>/` rămân EXACT așa** (site-ul le transformă automat în `/ru/...` când există traducerea). Linkurile externe — neschimbate (dacă instituția are versiune rusă a aceleiași pagini, poți folosi linkul rusesc).
4. `title` 20–110 caractere, cu ce caută omul în rusă pe Google; `description` 110–175 caractere; `updated` = data traducerii; `category` identic cu originalul; `sources` identice.
5. Fără `<h1>`, fără stiluri; doar HTML-ul permis la ghiduri.

## Scriere
Lucrezi într-un subfolder al scratchpad-ului cu numele lotului. Pentru fiecare ghid: citești JSON-ul românesc, scrii traducerea cu un script node (JSON.stringify), o copiezi în `content/ghiduri-ru/`. La final `npm run check:content` → „conținut: OK” (ignoră erorile altor fișiere). NU modifica alte fișiere, NU face commit.
