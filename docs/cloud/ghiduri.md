# Brief: ghiduri practice (sesiuni Claude Code în cloud)

Scrii ghiduri evergreen pentru stiriactuale.info — site de știri din Republica Moldova, citit de oameni din raioane, din Chișinău și din diaspora (Italia, Germania, Franța, Marea Britanie, Spania, Portugalia, Israel, Rusia, România...).

## Ce livrezi

Câte un fișier `content/ghiduri/<slug>.json` pe ghid, apoi **un singur Pull Request pe lot**, titlu „Ghiduri — lot N”, cu lista ghidurilor și sursele principale în descriere. Nu modifici niciun alt fișier. Nu faci commit pe `master`.

Înainte de PR: `npm ci && npm run check:content` — trebuie să afișeze `conținut: OK`.

## Format

```json
{
  "slug": "pasaport-moldovenesc-din-italia",
  "title": "Pașaportul moldovenesc din Italia: acte, taxe și programare (2026)",
  "description": "110-175 caractere: ce afli din ghid, concret.",
  "category": "diaspora",
  "updated": "AAAA-LL-ZZ (azi)",
  "sources": [{ "name": "Agenția Servicii Publice", "url": "https://asp.gov.md/..." }],
  "bodyHtml": "<p>...</p><h2>...</h2>...",
  "faq": [{ "q": "Întrebare reală, cum ar căuta-o omul pe Google?", "a": "Răspuns scurt, 1-3 fraze." }]
}
```

Categorii: `diaspora`, `acte`, `bani`, `sanatate`, `auto`, `afaceri`, `educatie`, `siguranta`.

## Reguli de conținut (obligatorii)

1. **Doar informații verificate pe surse oficiale**, consultate acum, pe web: `*.gov.md` (asp.gov.md, mae.gov.md, cnam.gov.md, cnas.gov.md, servicii.gov.md, sfs.md...), legis.md, site-urile ambasadelor și consulatelor Moldovei. Minim 2 surse, cel puțin una oficială. Nimic din memorie fără verificare: taxe, termene, acte, adrese se schimbă.
2. Dacă o informație nu se poate verifica (ex. taxa exactă), scrii ce e sigur și trimiți la sursă („taxa actuală o găsești pe asp.gov.md, la secțiunea...”). **Nu inventa cifre, adrese, telefoane, termene.**
3. 700-1.500 de cuvinte. Structură: pe scurt (2-3 fraze), apoi pașii numerotați (`<ol>`), actele necesare (`<ul>`), costuri și termene, unde se depune / cum se face programarea, greșeli frecvente, ce faci dacă... Minim 3 `<h2>`.
4. HTML permis: `p, h2, h3, ul, ol, li, strong, em, a, table, thead, tbody, tr, th, td`. Linkuri doar spre surse oficiale. Fără imagini, stiluri, scripturi.
5. Ton: clar, direct, pentru oameni obișnuiți — „tu”, fraze scurte, fără limbaj birocratic. Explică termenii (apostilă, procură, IDNP).
6. Titlu cu ce caută omul pe Google, nu creativ. Anul în titlu doar dacă informația e legată de an.
7. FAQ: 3-6 întrebări pe care oamenii le pun real.
8. `updated` = data de azi (ziua în care ai verificat sursele).
9. Scrii exclusiv în română, cu diacritice corecte (ș, ț cu virgulă).

## Loturi de subiecte

**Lot 1 — diaspora: acte**
1. Pașaportul moldovenesc din străinătate: cum îl faci prin consulat (ghid general)
2. Buletinul de identitate pentru cei aflați peste hotare
3. Procura din străinătate: cum o faci la consulat și cum o folosești acasă
4. Apostila: ce este, când îți trebuie și cum o obții pentru acte moldovenești
5. Certificatul de naștere pentru copilul născut în străinătate (transcrierea)
6. Cazierul judiciar din Moldova când ești în străinătate
7. Votul din străinătate: cum, unde și cu ce acte
8. Recunoașterea diplomelor moldovenești în UE și a celor străine în Moldova

**Lot 2 — diaspora: bani, muncă, întoarcere**
1. Pensia pentru moldovenii care au lucrat în străinătate (acordurile de securitate socială)
2. Polița de asigurare medicală pentru cei plecați: cum o cumperi individual
3. Trimiterea banilor acasă: cele mai ieftine metode și ce verifici
4. Repatrierea unei persoane decedate în străinătate: pași și acte
5. Programul PARE 1+2: bani pentru o afacere la întoarcerea acasă
6. Permisul de conducere moldovenesc în Italia, Germania și restul UE
7. Mașina adusă din străinătate: vămuire și înmatriculare în Moldova
8. Cum îți înregistrezi copilul la școală în Moldova după anii petrecuți peste hotare

**Lot 3 — bani, pensii, ajutoare**
1. Compensațiile pentru încălzire: cine are dreptul și cum le ceri
2. Cum se calculează pensia pentru limită de vârstă
3. Vârsta de pensionare în Moldova: calendarul pentru femei și bărbați
4. Indemnizația unică la nașterea copilului: sumă, acte, termen
5. Indemnizația lunară pentru îngrijirea copilului: cum se calculează
6. Ajutorul social: cine îl poate primi și cum se depune cererea
7. Declarația pe venit pentru persoane fizice: cine depune și până când
8. Salariul minim și impozitul pe venit: cât rămâne „în mână”

**Lot 4 — acte, auto, sănătate**
1. Schimbarea buletinului: când e obligatoriu, acte, cost
2. MPass, MSign și e-servicii: cum faci actele online fără să mergi la ghișeu
3. Înmatricularea mașinii în Moldova: pași și taxe
4. Amenzile de circulație: cum le verifici și le achiți online
5. Permisul de conducere: preschimbarea și pierderea lui
6. Polița de asigurare medicală obligatorie: cât costă și cum o cumperi
7. Concediul medical: cine îl plătește și cum se calculează
8. Medicul de familie: cum te înscrii sau îl schimbi

**Lot 5 — afaceri, educație, drepturi**
1. Cum deschizi o întreprindere individuală sau un SRL în Moldova
2. Subvențiile AIPA pentru agricultori: tipuri și cum aplici
3. Programul „Prima casă”: condiții și pași
4. Admiterea la facultate în Moldova: calendar și acte
5. Cum depui o plângere la Poliție, inclusiv online
6. Cum contești o factură la gaz sau lumină (ANRE)
7. Drepturile chiriașului: contractul de închiriere în Moldova
8. Numerele de urgență și ce informații dai când suni la 112
