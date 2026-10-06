# Brief: ghiduri practice pentru șoferi și de economie în gospodărie

Format: ca ghidurile (`docs/cloud/ghiduri.md`, secțiunea Format), în `content/ghiduri/<slug>.json`, `"updated"` = data de azi. 800–1.400 de cuvinte, 3–6 `<h2>`, FAQ 4–6 întrebări reale. Modele: un ghid existent din content/ghiduri cu aceeași categorie (`auto`: ex. `rca-si-cartea-verde-ce-acopera-si-cum-le-cumperi.json`; `bani`: ex. `compensatii-incalzire-cine-are-dreptul-si-cum-le-ceri.json`).

## Reguli
- Categorii: șoferi → `"category": "auto"`; economie → `"category": "bani"`.
- Surse: minim 3, minim una oficială moldovenească (legis.md, politia.md / *.gov.md, anre.md, bnm.md, fgdsb.md, cnpf.md, energie/agenții de stat). Reguli de circulație și amenzi: DOAR din Regulamentul circulației rutiere (HG 357/2009) și Codul contravențional, pe legis.md, cu articolul/punctul. Partea tehnică (ulei, baterie, anvelope, consum) fără sursă oficială MD: recomandări generale, atribuite (ex. ADAC, AA, RAR, manualul producătorului), formulate prudent („verifică în manualul mașinii”).
- Cifre (amenzi, puncte de penalizare, tarife, praguri, sume garantate) doar cu sursă și dată; dacă nu ești sigur de valoarea în vigoare la data de azi, NU o scrie — trimite la sursă.
- Bani: strict informativ — ce garantează legea, cum compari, ce întrebi banca. FĂRĂ recomandări de investiții, fără nume de bănci „mai bune”, fără promisiuni de randament.
- Română corectă, cu diacritice (ș, ț cu virgulă), ton practic, liste concrete (pași, verificări), fără umplutură.
- Linkuri interne doar spre ghiduri care există în content/ghiduri (verifică fișierul), ex. `/ghiduri/rca-si-cartea-verde-ce-acopera-si-cum-le-cumperi/`, `/ghiduri/amenzi-de-circulatie-verificare-si-plata-online/`, `/ghiduri/compensatii-incalzire-cine-are-dreptul-si-cum-le-ceri/`, `/ghiduri/tarifele-la-gaz-energie-electrica-si-termoficare/`, `/ghiduri/creditul-de-consum-ce-verifici-inainte-sa-semnezi/`, `/ghiduri/drepturile-consumatorului-returnarea-unui-produs-si-garantia/`. Și între ghidurile din acest lot (slug-urile de mai jos).
- Titlul conține cuvintele pe care le caută omul. Descrierea 110–175 caractere, cu cuvintele cu care ar apărea în știri (pentru potrivirea „Ghid util”). Slug fără diacritice, max 8 cuvinte.

## Scriere
Write direct în proiect poate fi blocat: scrie JSON-ul cu un script node în scratchpad (JSON.stringify) și copiază-l în content/ghiduri/. La final `npm run check:content` → „conținut: OK” (ignoră erorile din fișiere care nu sunt ale tale — alte agenți scriu în paralel). NU modifica alte fișiere, NU face commit.
