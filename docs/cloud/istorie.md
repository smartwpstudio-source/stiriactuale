# Brief: „Azi în istorie” — evenimente pe zile (366 de zile)

Folosit în mesajul Telegram „Bună dimineața” și pe paginile `/azi-in-istorie/<zi>-<luna>/`. Un fișier pe lună: `content/istorie/01.json` … `12.json`.

## Format (exact)

```json
{
  "luna": 10,
  "updated": "AAAA-LL-ZZ",
  "zile": {
    "6": [
      { "an": 1991, "text": "Propoziție completă, la trecut, 80–220 de caractere.", "moldova": true, "sursa": "https://ro.wikipedia.org/wiki/..." }
    ]
  }
}
```

- `zile`: **toate** zilele lunii (cheile "1"…"31"; februarie până la "29"), fiecare cu **3–5 evenimente**, în ordinea anilor (crescător).
- `an`: număr întreg (î.Hr. = negativ, ex. -44). `moldova`: `true` doar pentru evenimente din istoria Moldovei / Basarabiei / Republicii Moldova sau ale românilor cu legătură directă cu Moldova; altfel `false`.
- **Cel puțin unul** dintre evenimente cu `moldova: true` când există pentru acea zi (bătălii ale lui Ștefan cel Mare, Unirea, 1812, 1918, 1940, 1944, 1989–1991, independența, constituția, personalități moldovene născute/decedate în acea zi etc.). Restul: evenimente mondiale importante, cunoscute (războaie, descoperiri, invenții, tratate, personalități mari), nu curiozități minore.
- `text`: în cuvintele tale (NU copia fraze din sursă), română corectă cu diacritice (ș, ț cu virgulă), neutru, fără adjective de valoare, fără anul în text (anul e în `an`). Pentru nașteri/decese: „S-a născut X, poet român, autorul …”.
- `sursa`: URL https către pagina care confirmă **exact data (zi, lună, an)**: articolul Wikipedia al evenimentului/persoanei (ro sau en), sau o sursă oficială/enciclopedică. Pagina zilei din Wikipedia („6 octombrie”) e acceptată doar dacă evenimentul apare acolo cu aceeași dată.

## Reguli de acuratețe (cele mai importante)
- Fiecare eveniment: data verificată ACUM pe sursă. Dacă sursele se contrazic (stil vechi/nou, ani diferiți), alege alt eveniment.
- Atenție la datele pe stil vechi (Rusia înainte de 1918, evenimente medievale): folosește data folosită de sursa citată și NU converti singur.
- Evită subiectele care pot fi propagandă sau contestate fără context (ex. formulări sovietice despre 1940/1944); scrie faptic: „Armata Roșie a ocupat…”, „URSS a anexat…”.
- Fără evenimente despre persoane în viață din politica actuală (alegeri, partide) — doar istorie încheiată.

## Scriere
Scratchpad-ul e comun cu alți agenți: lucrează DOAR într-un subfolder cu numele lotului tău. Scrie JSON-ul cu un script node (JSON.stringify) și copiază-l în `content/istorie/`. La final `npm run check:content` → „conținut: OK” (ignoră erorile fișierelor altor agenți). NU modifica alte fișiere, NU face commit.
