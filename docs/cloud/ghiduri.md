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

Categorii: `diaspora`, `acte`, `bani`, `sanatate`, `auto`, `afaceri`, `educatie`, `siguranta`. (`dosare` și `orase` au brief-uri proprii: `docs/cloud/dosare.md`, `docs/cloud/orase.md`.)

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

**Lot 6 — familie și moștenire**
1. Moștenirea în Moldova: cum o accepți și cum obții certificatul de moștenitor
2. Divorțul în Moldova: la oficiul de stare civilă sau în instanță
3. Căsătoria în Moldova și înregistrarea celei încheiate în străinătate
4. Pensia de întreținere pentru copii: cum se stabilește și cum o obții
5. Plecarea copilului minor peste hotare: acordul părinților și actele
6. Testamentul: cum îl faci la notar și ce trebuie să conțină
7. Schimbarea numelui sau prenumelui: acte și pași
8. Tutela și curatela: cine poate fi tutore și cum se stabilește

**Lot 7 — locuință și proprietate**
1. Drepturile chiriașului: contractul de închiriere în Moldova
2. Cumpărarea unui apartament: ce verifici la Cadastru și pașii la notar
3. Extrasul din Registrul bunurilor imobile: cum îl obții, inclusiv online
4. Impozitul pe bunurile imobiliare: cine plătește, cât și până când
5. Înregistrarea la domiciliu și viza de reședință
6. Autorizația de construire pentru o casă: acte și pași
7. Racordarea unei case la rețeaua de gaz: pași și costuri
8. Asociația de proprietari (condominiu): drepturile locatarilor

**Lot 8 — muncă și salarii**
1. Contractul individual de muncă: ce trebuie să conțină
2. Concediul anual de odihnă: câte zile și cum se plătește
3. Concediul de maternitate și cel paternal: durată, plată, acte
4. Șomajul: cum te înregistrezi la ANOFM și ce ajutor primești
5. Concedierea: preaviz, indemnizații și cum o contești
6. Munca legală în străinătate: agențiile licențiate și cum le verifici
7. Activitatea independentă și patenta de întreprinzător
8. Plângerea la Inspectoratul de Stat al Muncii: când și cum

**Lot 9 — consumator, bani, siguranță online**
1. Drepturile consumatorului: returnarea unui produs și garanția
2. Creditul de consum: ce verifici înainte să semnezi (DAE, costuri)
3. Fraudele telefonice și online: cum le recunoști și unde le raportezi
4. RCA și Cartea Verde: ce acoperă și cum le cumperi
5. Vinieta (taxa de drum) pentru mașini: cine plătește și cum
6. Impozitele și taxele plătite online prin MPay
7. Cum citești factura de gaz sau de energie electrică
8. Protecția datelor personale: cum depui o plângere la CNPDCP

**Lot 10 — sănătate și protecție socială**
1. Gradul de dizabilitate: cum se stabilește și ce drepturi oferă
2. Biletele de tratament balnear prin CNAS: cine le primește și cum
3. Medicamentele compensate: lista, rețeta și farmaciile
4. Vaccinarea copiilor: calendarul național și unde se face
5. Alocațiile pentru copiii cu dizabilități
6. Serviciul de îngrijire la domiciliu pentru vârstnici
7. Certificatul medical pentru permisul de conducere
8. Asistența juridică garantată de stat: cine o primește gratuit

## Loturi pe țări (diaspora) și de sezon

La ghidurile pe țări: titlul începe cu țara sau orașul („Pașaportul moldovenesc în Italia: …”). Sursele principale sunt site-ul ambasadei sau al consulatului Moldovei din acea țară (`<tara>.mfa.gov.md`) și, pentru regulile țării gazdă, site-urile oficiale ale acelei țări. Unde informația e deja în ghidul general (ex. `pasaport-moldovenesc-din-strainatate`), ghidul pe țară dă ce e **specific țării** (adresa misiunii, programare, taxe locale, acte cerute acolo) și trimite cu link la ghidul general.

**Lot 11 — Italia**
1. Pașaportul și buletinul moldovenesc în Italia: consulatele, programarea, taxele
2. Procura și actele notariale la consulatele Moldovei din Italia
3. Permesso di soggiorno pentru moldoveni: tipuri, reînnoire, acte
4. Pensia italiană și cea moldovenească: acordul de securitate socială Italia–Moldova
5. Permisul de conducere moldovenesc în Italia: conversie și termene
6. Cetățenia italiană pentru moldoveni: condiții și pași
7. Codice fiscale, tessera sanitaria și medicul de familie în Italia
8. Transcrierea actelor italiene (naștere, căsătorie) în Moldova

**Lot 12 — Germania și Franța**
1. Pașaportul și buletinul moldovenesc în Germania: Berlin, Frankfurt, programare
2. Munca în Germania pentru moldoveni: viză, Blue Card, recunoașterea calificării
3. Anmeldung, asigurarea medicală și Kindergeld pentru moldovenii din Germania
4. Pensia din Germania pentru cei care se întorc în Moldova
5. Pașaportul și actele moldovenești în Franța: ambasada din Paris, programare
6. Titre de séjour pentru moldoveni în Franța: tipuri și reînnoire
7. Munca legală în Franța și recunoașterea diplomelor moldovenești
8. Asigurarea medicală (Carte Vitale) și ajutoarele CAF pentru moldovenii din Franța

**Lot 13 — Regatul Unit, Spania, Portugalia, Irlanda**
1. Pașaportul moldovenesc în Regatul Unit: ambasada din Londra, programare
2. Munca și șederea în Regatul Unit pentru moldovenii cu cetățenie română
3. Pașaportul și actele moldovenești în Spania: ambasada din Madrid
4. NIE, empadronamiento și sistemul de sănătate în Spania pentru moldoveni
5. Pașaportul și actele moldovenești în Portugalia: ambasada din Lisabona
6. Rezidența în Portugalia (AIMA) pentru moldoveni: acte și pași
7. Actele moldovenești în Irlanda: misiunea competentă și programare
8. PPS, munca și sănătatea în Irlanda pentru moldoveni

**Lot 14 — România, Israel, Rusia, SUA și Canada**
1. Cetățenia română pentru moldoveni: dosarul, jurământul, pașaportul
2. Actele moldovenești în România: ambasada din București, consulatele din Iași și Brașov
3. Munca în Israel pentru moldoveni: acordul bilateral, contracte, agenții autorizate
4. Actele moldovenești în Israel: ambasada din Tel Aviv, programare
5. Actele moldovenești în Rusia: ambasada din Moscova, programare, pașaport
6. Moldovenii în SUA: ambasada din Washington, pașaport, procură
7. Moldovenii în Canada: ambasada din Ottawa, pașaport, acte
8. Viza de turist pentru rudele din Moldova (SUA, Canada, Regatul Unit): ce acte cer

**Lot 15 — de sezon** (folosesc anul în titlu, actualizate pentru 2026–2027)
1. Sezonul de încălzire 2026–2027: când pornește căldura și cum citești factura
2. Bacalaureatul 2027: calendar, probe, contestații
3. Admiterea 2027 la colegii și facultăți: calendar și acte (completează ghidul general)
4. Declarația pe venit 2027: termenul de 30 aprilie, cine depune, cum online
5. Călătoria cu copiii peste hotare în vacanță: acte, procura părintelui, controlul la frontieră
6. Pregătirea pentru iarnă: ajutorul pentru perioada rece și compensațiile 2026–2027
7. Alegerile: cum verifici unde votezi și ce acte îți trebuie (general, pentru orice scrutin)
8. Sărbătorile legale în Moldova în 2027: zile libere și transferuri
