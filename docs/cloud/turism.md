# Moldova turistică — planul de conținut (etapele 2 și 3)

Aprobat ca rubrică de proprietar la 2026-10-10 (vezi `docs/cloud/gospodarie-bucatarie-turism.md`). Categoria ghidurilor: `turism`. Fiecare ghid are și varianta rusă (`docs/cloud/traducere-ru.md`).

**Pilonul (etapa 1, gata):** `moldova-turistica-ce-vizitezi-trasee-vinarii-manastiri` — regiuni, tipuri de obiective, trasee de o zi/weekend cu distanțe, transport, prețuri oficiale, calendar, sfaturi, FAQ. Toate ghidurile de mai jos îl leagă și sunt legate din el (după publicare, adaugă linkul în secțiunea potrivită a pilonului, RO + RU).

## Reguli comune (în plus față de `docs/cloud/ghiduri.md`)

- **Surse de bază:** portalul Oficiului Național al Turismului `turism.gov.md` (obiective, trasee, calendar, transport, vize; are și REST: `https://turism.gov.md/wp-json/wp/v2/events?per_page=100` — titlurile; datele sunt pe pagina fiecărui eveniment), Ministerul Culturii (`mc.gov.md`; tarifele muzeelor: Ordinul nr. 36/2025, `https://mc.gov.md/sites/default/files/file-cloud/ord-mc-36-2025.pdf`; Registrul monumentelor), Agenția „Moldsilva” (`moldsilva.gov.md`, Parcul Național Orhei, ariile protejate din fondul forestier), Ministerul Mediului / Agenția de Mediu, ONVV (`wineofmoldova.com`), Mitropolia Moldovei (`mitropolia.md`), site-urile oficiale ale vinăriilor și mănăstirilor, BNS (`statistica.gov.md`, comunicatele trimestriale „Frecventarea structurilor de primire turistică”), ANTA (registrul autogărilor), CFM (`railway.md`).
- **Prețuri:** doar cele publicate de instituție/vinărie pe site-ul ei, cu „verificat la AAAA-LL-ZZ”. Platformele de rezervare și agențiile NU sunt sursă de preț. Ce nu e publicat: „întreabă la…”.
- **Programe, hramuri, date de festival:** doar din sursa oficială; la festivaluri scrie data ultimei ediții anunțate și unde se anunță următoarea.
- **Distanțe:** pe șosea, din centrul Chișinăului (PMAN), rotunjite, „circa”. Le-am calculat cu OSRM pe OpenStreetMap (scriptul din sesiunea pilonului: Nominatim pentru coordonate + `router.project-osrm.org/route/v1/driving/28.8323,47.0245;<lon>,<lat>`). Nu da durate de drum din calcul; dă distanța.
- **Transport public:** nu inventa gara de plecare sau orele. ONT trimite la `autogara.md` (site vechi, verifică), autogările sunt în registrul ANTA (Gara Centru — str. Mitropolit Varlaam 58; Gara Sud — șos. Hîncești 86; Gara Nord).
- **Regiunea transnistreană (Tighina, Tiraspol):** orice mențiune cu avertizarea că nu e sub controlul autorităților constituționale + link la `transnistria-situatia-regiunii-si-impactul`; verifică avertizările MAE (`mfa.gov.md`) la data scrierii.
- **Poze:** pentru locuri reale doar poze reale ale locului — arhiva `content/locuri/locuri.json` (id-ul e trecut mai jos) sau Wikimedia Commons cu autorul și licența (urcate în Blob ca în arhivă: `credit` = „Autor / Wikimedia Commons, licență”, `source` = pagina fișierului). Previzualizează fiecare fișier înainte: candidații Commons de mai jos sunt găsiți după titlu, nu văzuți. Fără poză reală → fără poză (sau poză generică din arhivă, ex. `vie`, cu `alt` care spune ce se vede, NU prezentată ca locul respectiv). Nu folosi stoc cu alt loc.

Legenda poze: **[arhivă: id]** = avem în `locuri.json`; **[Commons: fișier — autor, licență]** = de descărcat și urcat; **[lipsă]** = nu am găsit poză liberă.

---

## Etapa 2 — ghiduri în context (8)

### 1. `vinariile-din-moldova-tururi-program-rezervare`
**Titlu de lucru:** Vinăriile din Moldova deschise turiștilor: Cricova, Mileștii Mici, Purcari, Castel Mimi și altele — tururi și rezervare
- **Pentru cine:** cei din țară care plănuiesc o ieșire de o zi; diaspora care vine acasă cu prieteni străini; turiști străini.
- **Puncte:** regiunile IGP (Codru, Ștefan Vodă, Valul lui Traian, Divin) și „Drumul Vinului” (Iter Vitis, 28 de producători); fișă pe vinărie: unde, distanța, tipuri de tur, prețul publicat, program, cum rezervi (Cricova: tarifele de pe `cricova.md/ro/excursii/` — 250/400/700/950… lei, +100 lei după 16:00 și în weekend; Mileștii Mici: +100 lei după 17:00, copiii sub 10 ani gratuit — de reverificat pe site-ul oficial); Lista indicativă UNESCO 2025 (Cricova + Mileștii Mici); degustare și volan (link alcool la volan); cumpărarea vinului și limitele vamale pentru cei care pleacă.
- **Vinării:** Cricova, Mileștii Mici, Purcari, Castel Mimi, Asconi, Château Vartely, Et Cetera, Château Cojușna, Brănești, Poiana, Gogu, Leuntea-Vin, Javgur, Kislov (Bender — cu avertizarea despre regiune).
- **Surse:** site-urile vinăriilor (`cricova.md`, `milestii-mici.md`, `purcariwineries.com/turism/`, `castelmimi.md/tururi-vinicole/` …), `turism.gov.md` (paginile vinăriilor + Iter Vitis), `wineofmoldova.com`, UNESCO tentative list 6789, AGEPI.
- **Legături:** pilonul, `ziua-nationala-a-vinului`, `alcoolul-la-volan-limite-si-sanctiuni`, `vinieta-taxa-de-drum-pentru-masini`, articolele 2, 3, 10, 11, 17 din etapa 3.
- **Sezon de vârf:** septembrie–octombrie (cules, Ziua Vinului); galeriile subterane se vizitează tot anul.
- **Poze:** Cricova [arhivă: cricova], Mileștii Mici [arhivă: milestii-mici], Purcari [arhivă: purcari], Castel Mimi [Commons: Castel Mimi fațada.jpg — Helgie12, CC BY-SA 4.0], Château Cojușna [Commons: Chateau Cojusna Migdal-P din satul Cojușna 01.jpg — Vladikh, CC0], Asconi / Château Vartely / Et Cetera / Brănești / Poiana / Gogu [lipsă — cere vinăriei poză cu acord scris de folosire și autor, sau fără poză].

### 2. `manastirile-din-moldova-ce-vizitezi-hramuri-reguli`
**Titlu de lucru:** Mănăstirile din Moldova: Căpriana, Curchi, Saharna, Țipova, Hâncu, Japca, Rudi — hramuri, cum ajungi, reguli
- **Pentru cine:** pelerini, familii, turiști interesați de patrimoniu.
- **Puncte:** fișă pe mănăstire (raion, distanța, istoric pe scurt din sursă oficială, hramul, slujbe/program dacă e publicat, cazare pentru pelerini — ex. Zăbriceni doar cu programare); ținută și reguli (fotografiere, liniște) — doar ce publică mănăstirea/Mitropolia; calendarul hramurilor mari (Saharna — Sf. Macarie 26 mai; Sfânta Treime); acces (Țipova: scări în stâncă); traseul Codri (Condrița–Căpriana–Hâncu–Hîrjauca).
- **Mănăstiri:** Căpriana, Curchi, Saharna, Țipova, Hâncu, Japca, Hîrjauca, Rudi, Condrița, Zăbriceni, Orheiul Vechi (Butuceni).
- **Surse:** `mitropolia.md` (lista mănăstirilor, știri despre hramuri), site-urile mănăstirilor (ex. Curchi — linkul de pe ONT, Saharna), `turism.gov.md`, Registrul monumentelor (Ministerul Culturii).
- **Legături:** pilonul, ghidurile de sărbători (`sfanta-maria-mare-adormirea-maicii-domnului`, `inaltarea-domnului-si-rusaliile-traditii`, `pastele-traditii-in-moldova`…), articolele 5–9, 18, 25.
- **Sezon de vârf:** mai–octombrie; zilele de hram și Paștele.
- **Poze:** Căpriana [arhivă: capriana], Saharna și Țipova [arhivă: saharna-tipova], Orheiul Vechi [arhivă: orheiul-vechi], Curchi [Commons: Monasterio de Curchi, Curchi, Moldavia, 2023-11-01, DD 105-107 HDR.jpg — Diego Delso, CC BY-SA 4.0], Hâncu [Commons: Hâncu monastery, Moldova.jpg — Pudelek, CC BY-SA 4.0], Japca [Commons: AIRM - Mănăstirea Japca - martie 2014 - 752040298154059.jpg — Agenția de Inspectare și Restaurare a Monumentelor, CC BY-SA 4.0], Rudi [Commons: Mănăstirea Rudi-1 (biserica veche).jpg — Tolea93, CC BY 4.0], Condrița [Commons: Condrița monastery, Moldova.jpg — Pudelek, CC BY-SA 4.0], Hîrjauca [Commons: Mănăstirea „Înălțarea Domnului” în Hîrjauca.jpg — Tanyaofearth, CC BY-SA 4.0], Zăbriceni [lipsă — de căutat pe Commons].

### 3. `cetatile-si-siturile-istorice-din-moldova`
**Titlu de lucru:** Cetăți și situri istorice în Moldova: Orheiul Vechi, Soroca, Tighina, Saharna, Butuceni — program și bilete
- **Pentru cine:** turiști culturali, școli și grupuri, familii.
- **Puncte:** Orheiul Vechi (tarife Ord. MC 36/2025: 20/10 lei, parcare 30 lei, ghid 200–350 lei; ziua gratuită lunară); Cetatea Soroca (stare după restaurare, program — de la Consiliul raional/muzeul din Soroca; ONT o dă „redeschisă”); Cetatea Tighina (în Bender — avertizare, fără îndemn la vizită fără verificarea MAE); siturile arheologice de la Saharna; conacele (Manuc Bei, Ralli, Donici); ce înseamnă „monument ocrotit de stat” (Registrul monumentelor).
- **Surse:** Ministerul Culturii (ordinul 36/2025, Registrul monumentelor ocrotite de stat), `turism.gov.md`, Consiliul raional Soroca, `mfa.gov.md` (pentru regiune), BNS (dacă există date de vizitare).
- **Legături:** pilonul, `transnistria-situatia-regiunii-si-impactul`, `soroca-primaria-spitalul-asp-transportul`, `orhei-primaria-spitalul-asp-transportul`, articolele 1, 4, 12.
- **Sezon de vârf:** mai–octombrie (Soroca iarna: verifică dacă e deschisă).
- **Poze:** Orheiul Vechi [arhivă: orheiul-vechi], Soroca [arhivă: soroca], Tighina [arhivă: bender], Butuceni [arhivă: sat-moldovenesc (poarta din Butuceni); Commons: Butuceni, Orheiul Vechi.jpg — Iurieph, CC0], Manuc Bei [arhivă: hincesti], Conacul Ralli [Commons: Monumentul lui Alexandr Pușkin în Conacul familiei Ralli din sat. Dolna 01.jpg — Vladikh, CC BY-SA 4.0].

### 4. `natura-si-ariile-protejate-din-moldova-trasee-drumetii`
**Titlu de lucru:** Natura Moldovei: rezervații, parcuri naționale și trasee de drumeție — Codrii, Pădurea Domnească, Prutul de Jos, Nistrul
- **Pentru cine:** drumeți, familii, fotografi, observatori de păsări.
- **Puncte:** categoriile de arii protejate și ce ai voie (rezervațiile științifice — acces limitat; parcurile naționale — trasee); cele 5 rezervații științifice (Codrii, Plaiul Fagului, Pădurea Domnească, Prutul de Jos, Iagorlîc) — ce vezi, unde e administrația; Parcul Național Orhei (33,8 mii ha, harta traseelor Moldsilva) și Parcul Național „Nistrul de Jos”; monumente ale naturii: Valea Adâncă, Țipova, Suta de Movile, Defileul Văratic, Duruitoarea, Rudi–Arionești; traseele marcate de pe ONT (Drumul Dragonului 4,6 km, Farmecul Nistrului 4 km, Stâncile Prutului 156 km); reguli: foc, camping, deșeuri, căpușe (doar din acte/surse oficiale — Legea 1538/1998 pe legis.md, regulamentele parcurilor).
- **Surse:** `moldsilva.gov.md` (arii protejate, trasee, harta PN Orhei), `mediu.gov.md` / Agenția de Mediu (`am.gov.md`), legis.md (Legea 1538/1998, Legea 132/2018 privind Rezervația Biosferei „Prutul de Jos”), `turism.gov.md` (trasee), administrațiile rezervațiilor.
- **Legături:** pilonul, `capusele-boala-lyme-cum-scoti-capusa-corect`, `ciupercile-otravitoare-semne-intoxicatie-prim-ajutor`, `inecul-prim-ajutor-si-siguranta-la-apa`, articolele 13–16, 19.
- **Sezon de vârf:** aprilie–iunie și septembrie–octombrie; păsările — migrațiile de primăvară și toamnă.
- **Poze:** Codrii [arhivă: codrii], Nistrul [arhivă: nistru], Prutul [arhivă: prut], Pădurea Domnească [Commons: La intrare in Zimbrarie.jpg — SerKo Photography, CC BY-SA 4.0], Lacul Beleu [Commons: Lacul Beleu priveliște.jpg — Cezara-Patricia Cumatrenco, CC BY-SA 4.0], Plaiul Fagului [Commons: Plaiul Fagului (6).jpg — Tolea93, CC BY-SA 4.0], PN Orhei [Commons: Valea Rautului Butuceni Orhei toamna (2).jpg — Alex Prodan md, CC BY-SA 4.0], Suta de Movile [Commons: Cava obisnuit de pe Suta de Movile.jpg — SerKo Photography, CC BY-SA 4.0 — verifică dacă arată peisajul], Văratic [Commons: Defileul Văratic (Cascada).jpg — IurieSvet, CC BY-SA 4.0], Duruitoarea [Commons: Priveliste de pe ,,Duruitoarea Veche,,.jpg — SerKo Photography, CC BY-SA 4.0], Valea Adâncă [Commons: doar poze din 1980, Ion Chibzii, CC BY-SA 2.0 — caută una recentă], Iagorlîc [lipsă].

### 5. `turismul-rural-in-moldova-pensiuni-agroturism-tichet-de-vacanta`
**Titlu de lucru:** Turismul rural în Moldova: pensiuni, agroturism și tichetul de vacanță
- **Pentru cine:** familii din oraș, diaspora venită vara, angajați care primesc tichete de vacanță, proprietari care vor să deschidă o pensiune (secțiune scurtă).
- **Puncte:** ce e o pensiune turistică/agroturistică (definițiile din lege), cum verifici că e înregistrată (registrul ONT, dacă e public); tichetul de vacanță — HG nr. 60 din 18.02.2026, cine îl primește, unde se folosește (doar la unități afiliate), valabilitate 12 luni, ce scutiri are (doar din HG și Codul fiscal); cifrele BNS (2025: 67,8 mii turiști în pensiuni, +30,6%); exemple din ONT (Casa Părintească, Casa Olarului, Artă Rustică, Poarta Neamului — prețuri doar dacă sunt publicate de ei); ce întrebi înainte să rezervi.
- **Surse:** `turism.gov.md/ro/tichetul-de-vacanta/` + HG 60/2026 pe legis.md, Legea turismului, BNS, paginile ONT ale pensiunilor.
- **Legături:** pilonul, `activitatea-independenta-si-patenta-de-intreprinzator`, `cum-deschizi-intreprindere-individuala-sau-srl`, bucătăria moldovenească (pilonul `bucatarie`, după publicare), articolele 20–24.
- **Sezon de vârf:** mai–septembrie, weekendurile cu sărbători.
- **Poze:** [arhivă: sat-moldovenesc], [arhivă: vie]; pensiunile anume — [lipsă], doar cu acordul proprietarului.

### 6. `gagauzia-pentru-turisti-comrat-ceadir-lunga-traditii`
**Titlu de lucru:** Găgăuzia pentru turiști: Comrat, Ceadîr-Lunga, Hederlez, Kasım și vinul găgăuz
- **Pentru cine:** turiști din țară și străini, diaspora găgăuză.
- **Puncte:** cum ajungi (Comrat circa 101 km, Ceadîr-Lunga circa 133 km; gara auto din Comrat — str. Pobedî 2, registrul ANTA); ce vezi (muzee locale, piața centrală, biserici, vinării din zonă — doar ce e pe ONT/site-uri oficiale ale autonomiei); sărbătorile: Hederlez (6 mai, Ceadîr-Lunga), Gagauz Şarap Yortusu (Comrat, în ajunul lui Kasım), Kasım (8 noiembrie); limbile (găgăuză, rusă, română) și sfaturi de comunicare; scurt despre statutul autonomiei (link).
- **Surse:** `turism.gov.md` (regiunea Găgăuzia + evenimente), `gagauzia.md` (Comitetul Executiv), `comrat.md`, BNS, Legea 344/1994 (link la ghidul existent).
- **Legături:** pilonul, `gagauzia-autonomia-ce-prevede-statutul`, `comrat-primaria-spitalul-asp-transportul`, `ceadir-lunga-primaria-spitalul-asp-transportul`, `sfantul-gheorghe-traditii-si-onomastica`, `sfantul-dumitru-traditii-si-onomastica`.
- **Sezon de vârf:** mai (Hederlez) și începutul lui noiembrie (Kasım, sărbătoarea vinului).
- **Poze:** Comrat [arhivă: comrat], Ceadîr-Lunga [arhivă: ceadir-lunga]; muzeul din Beșalma [lipsă — de căutat pe Commons].

### 7. `chisinau-in-una-doua-zile-ce-vizitezi`
**Titlu de lucru:** Chișinău în 1–2 zile: ce vizitezi, muzee, parcuri și transport
- **Pentru cine:** turiști străini, oaspeții diasporei, oamenii din raioane veniți în capitală.
- **Puncte:** traseu pe jos prin centru (PMAN, Arcul de Triumf, Catedrala, Parcul Ștefan cel Mare, Teatrul Național, Turnul de Apă); muzeele naționale cu tarifele oficiale (Ord. MC 36/2025) și ziua gratuită; parcuri (Valea Morilor, Grădina Botanică — tarif în ordin); Piața Centrală; transport: troleibuz 7 lei (rtec.md), aeroportul și gara; excursii de o zi din oraș (link pilon); evenimente: 14 octombrie, Ziua Vinului, târgurile de Crăciun.
- **Surse:** `turism.gov.md`, `chisinau.md`, ordinul MC 36/2025, site-urile muzeelor, `rtec.md`, `autourban.md`, `airport.md`.
- **Legături:** pilonul, `chisinau-primaria-spitalul-asp-transportul`, `hramul-chisinaului-14-octombrie`, `cum-ajungi-la-targurile-de-craciun-din-chisinau`, `zboruri-low-cost-din-chisinau-si-iasi`.
- **Sezon de vârf:** mai–octombrie; vârfuri: începutul lui octombrie (Ziua Vinului, hramul) și decembrie (târgurile).
- **Poze:** [arhivă: arcul-de-triumf, pman, stefan-cel-mare, valea-morilor, teatrul-national, chisinau-panorama, piata-centrala, aeroport-chisinau, gara-chisinau]; Turnul de Apă [Commons: Torre del agua, Chisináu, Moldavia, 2023-11-03, DD 62.jpg — Diego Delso, CC BY-SA 4.0]; Muzeul Național de Istorie [Commons: Museum of History (AP4L0086 1PS) (28922487610).jpg — Alexandru Panoiu, CC BY 2.0].

### 8. `calendarul-evenimentelor-turistice-din-moldova`
**Titlu de lucru:** Festivaluri și sărbători în Moldova: calendarul evenimentelor turistice pe luni (2027)
- **Pentru cine:** cei care își planifică weekendurile; agenții și ghizi; diaspora care alege când vine acasă.
- **Puncte:** tabel lunar cu evenimentele confirmate de organizatori/ONT (Vernisajul Vinului, Hederlez, Noaptea Muzeelor, DescOperă, Ia Mania, BelEU Fest, Festivalul Vinului de Autor, Festivalul Mărului, Ziua Vinului, Hramul Chișinăului, Miorița Laie, Şarap Yortusu, Kasım, obiceiurile de iarnă); hramurile mari ale mănăstirilor; zilele libere (link). Se actualizează în ianuarie și după fiecare anunț.
- **Surse:** `turism.gov.md` (calendar + pagina fiecărui eveniment), organizatorii, `mitropolia.md`, Hotărârea Parlamentului 433/1990 (Ziua Vinului).
- **Legături:** pilonul, `ziua-nationala-a-vinului`, `hramul-chisinaului-14-octombrie`, `sarbatorile-legale-in-moldova-in-2027-zile-libere`, `martisorul-traditii`.
- **Sezon de vârf:** pagină evergreen, cu vârf de căutări mai–octombrie.
- **Poze:** fără poză de loc anume; dacă e nevoie, [arhivă: pman] sau [arhivă: concert-scena] (generică, `alt` corect).

---

## Etapa 3 — articole evergreen (25)

Format: ghid (`category: turism`), 700–1.200 de cuvinte, RO + RU. Fiecare are „Cum ajungi” cu distanța din Chișinău, „Cât costă” doar cu tarife publicate, „Când să mergi”, FAQ 3–5.

### Obiective individuale

| # | Slug | Pentru cine | Puncte (3–5) | Surse | Legături | Sezon | Poză |
|---|---|---|---|---|---|---|---|
| 1 | `orheiul-vechi-ce-vezi-bilete-cum-ajungi` | toți; prima excursie din Chișinău | ce vezi (mănăstirea rupestră, biserica 1636, băile, Butuceni); bilete și parcare (Ord. MC 36/2025); trasee „Drumul Dragonului” 4,6 km; DescOperă; cum ajungi (circa 52 km) | mc.gov.md, turism.gov.md, moldsilva.gov.md | pilon, ghid 3, ghid 4 | mai–oct | [arhivă: orheiul-vechi] |
| 2 | `cricova-pivnitele-tur-pret-rezervare` | turiști, grupuri, cupluri | pachetele și prețurile de pe cricova.md; program L–V 10–20, S–D 10–18; rezervare; suplimente; UNESCO | cricova.md, turism.gov.md, UNESCO 6789 | pilon, ghid 1 | tot anul; vârf sept–oct | [arhivă: cricova] |
| 3 | `milestii-mici-galeriile-tur-pret` | turiști, iubitori de vin | colecția Guinness; tipurile de tur și prețul de pe site-ul oficial; transport prin galerii; 12–14°C | site-ul oficial Mileștii Mici, turism.gov.md, UNESCO 6789 | pilon, ghid 1, art. 17 | tot anul | [arhivă: milestii-mici] |
| 4 | `cetatea-soroca-program-bilete` | familii, școli | istoria (Ștefan cel Mare, Petru Rareș); starea după restaurare și program (de confirmat la muzeul/Consiliul raional Soroca); Lumânarea Recunoștinței; Festivalul Mărului | turism.gov.md, Consiliul raional Soroca, Ministerul Culturii | pilon, ghid 3, `soroca-primaria-spitalul-asp-transportul` | mai–oct | [arhivă: soroca]; Lumânarea [Commons: Lumânarea Recunoștinței Sky.jpg — John Cucereanu, CC BY-SA 4.0] |
| 5 | `manastirea-capriana-istorie-hram` | pelerini, familii | atestare 1420, mănăstire domnească; biserica Adormirea Maicii Domnului; hramul; cum ajungi (circa 36 km); pădurea din jur | mitropolia.md, turism.gov.md | pilon, ghid 2, art. 18 | mai–oct, 28 august | [arhivă: capriana] |
| 6 | `manastirea-curchi-cum-ajungi` | pelerini, turiști | fondată 1773; ansamblul; hram; cum ajungi (circa 57 km), combinat cu Orheiul Vechi | site-ul mănăstirii, mitropolia.md, turism.gov.md | ghid 2, art. 1 | mai–oct | [Commons: Monasterio de Curchi … DD 105-107 HDR.jpg — Diego Delso, CC BY-SA 4.0] |
| 7 | `saharna-manastirea-si-cascadele` | pelerini, drumeți | Sfânta Treime, moaștele Sf. Macarie (26 mai); cascadele și traseul; cum ajungi (circa 97 km) | mitropolia.md, site-ul mănăstirii, turism.gov.md | ghid 2, ghid 4, art. 8 | mai–iunie | [arhivă: saharna-tipova]; cascada [Commons: Cascadă la Saharna.jpg — Avereanu, CC BY-SA 4.0] |
| 8 | `manastirea-rupestra-tipova` | drumeți, familii cu copii mari | trei biserici în stâncă, peste 20 de încăperi; acces pe scări; cascadele Țipova; cum ajungi (circa 93 km) | turism.gov.md, mitropolia.md, Ministerul Culturii | ghid 2, ghid 4, art. 7 | mai–oct | [arhivă: saharna-tipova] (fișierul Diego Delso cu Țipova) |
| 9 | `manastirea-hancu-cum-ajungi` | pelerini, familii | întemeiată 1678; mănăstire de maici; cele două biserici; cum ajungi (circa 59 km); traseul Codri | turism.gov.md, mitropolia.md | ghid 2, art. 18 | mai–oct | [Commons: Hâncu monastery, Moldova.jpg — Pudelek, CC BY-SA 4.0] |
| 10 | `castel-mimi-bulboaca-tur-vizita` | cupluri, grupuri, evenimente | castelul din 1893, redeschis 2016; tururi și prețuri publicate pe castelmimi.md; evenimente (Rosé Day, Ziua Vinului); cum ajungi (circa 39 km) | castelmimi.md, turism.gov.md | ghid 1, art. 17 | mai–oct | [Commons: Castel Mimi fațada.jpg — Helgie12, CC BY-SA 4.0] |
| 11 | `purcari-vinaria-si-nistrul-de-jos` | iubitori de vin, weekend în sud-est | vinăria din 1827; tururi (purcariwineries.com/turism); Parcul Național „Nistrul de Jos”; cum ajungi (circa 114 km) | purcariwineries.com, turism.gov.md | ghid 1, ghid 4 | mai–oct | [arhivă: purcari] |
| 12 | `conacul-manuc-bei-hincesti` | familii, istorie | construit 1858–1861; Palatul, Castelul de vânătoare (Bernardazzi), Turnul de veghe; restaurat 2013–2015; program și bilet (de la muzeu); circa 35 km | turism.gov.md, Ministerul Culturii | ghid 3 | apr–oct | [arhivă: hincesti] |
| 13 | `padurea-domneasca-rezervatia-zimbrii` | familii, natură | rezervație științifică; zimbrăria; ce ai voie să vizitezi (de la administrație); cum ajungi (circa 189 km) | moldsilva.gov.md, mediu.gov.md / am.gov.md | ghid 4 | apr–iun, sept–oct | [Commons: La intrare in Zimbrarie.jpg — SerKo Photography, CC BY-SA 4.0] |
| 14 | `lacul-beleu-prutul-de-jos-rezervatia-biosferei` | observatori de păsări, fotografi | Rezervația Biosferei „Prutul de Jos” (Legea 132/2018), sit Ramsar; BelEU Fest (8 august); cum ajungi (circa 208 km) | legis.md, mediu.gov.md, turism.gov.md | ghid 4, `cahul-primaria-spitalul-asp-transportul` | primăvara și toamna (migrație), august | [Commons: Lacul Beleu priveliște.jpg — Cezara-Patricia Cumatrenco, CC BY-SA 4.0] |
| 15 | `suta-de-movile-defileul-varatic-duruitoarea` | drumeți | Suta de Movile (recife fosile, circa 1.600 ha); Defileul Văratic (21,3 ha); Duruitoarea; lacul Costești-Stînca | turism.gov.md, Agenția de Mediu | ghid 4 | apr–iun, sept–oct | Văratic [Commons: Defileul Văratic (Cascada).jpg — IurieSvet, CC BY-SA 4.0]; Duruitoarea [Commons: Priveliste de pe ,,Duruitoarea Veche,,.jpg — SerKo Photography, CC BY-SA 4.0]; Suta de Movile [Commons: candidat SerKo Photography — de verificat] |
| 16 | `vadul-lui-voda-statiune-nistru` | familii din Chișinău, vara | stațiune balneară din 13.02.2025; zonele de odihnă; siguranța la apă; cum ajungi (circa 23 km) | turism.gov.md, Primăria Chișinău, ANSP (calitatea apei la scăldat) | `inecul-prim-ajutor-si-siguranta-la-apa`, `canicula-insolatia-socul-termic-prim-ajutor` | iunie–august | [Commons: Dniester near Vadul lui Vodă.jpg — dittaeva, CC BY 2.0] |

### Trasee tematice

| # | Slug | Pentru cine | Puncte | Surse | Legături | Sezon | Poză |
|---|---|---|---|---|---|---|---|
| 17 | `traseu-de-o-zi-drumul-vinului-in-sud` | iubitori de vin, cu șofer | Mileștii Mici (19 km) → Asconi (Puhoi, 34 km) → Castel Mimi (39 km); rezervări, ore, prețuri publicate; șoferul nu bea | site-urile vinăriilor, turism.gov.md | ghid 1, art. 3, 10 | sept–oct | [arhivă: milestii-mici] |
| 18 | `traseu-de-o-zi-manastirile-din-codri` | pelerini, familii | Condrița (30 km) → Căpriana (36 km) → Hâncu (59 km) → Hîrjauca; hramuri, ținută | mitropolia.md, turism.gov.md | ghid 2, art. 5, 9 | mai–oct | [arhivă: capriana] |
| 19 | `weekend-pe-nistru-japca-soroca-saharna` | drumeți, familii | Japca (132 km), Soroca (154 km), Rudi (192 km) sau Saharna–Țipova la întoarcere; cazare (doar unde e publicată) | turism.gov.md, mitropolia.md | ghid 2, 3, art. 4, 7, 8 | mai–oct | [arhivă: nistru] |
| 20 | `weekend-in-sud-purcari-gagauzia-prutul-de-jos` | turiști cu mașina | Purcari/Crocmaz → Comrat → Cahul/Beleu; distanțe; vinieta pentru mașinile străine | turism.gov.md, ANTA | ghid 1, 4, 6 | mai–oct | [arhivă: purcari] |

### Sezoane și idei

| # | Slug | Pentru cine | Puncte | Surse | Legături | Sezon | Poză |
|---|---|---|---|---|---|---|---|
| 21 | `ce-faci-in-moldova-in-weekend-idei` | familii, cupluri, prieteni | 10 idei de weekend pe distanțe (sub 50 km, 50–100 km, peste 100 km); ce rezervi din timp; buget orientativ doar cu tarife oficiale | pilonul + sursele lui | pilon, ghidurile 1–7 | tot anul | [arhivă: chisinau-panorama] sau fără |
| 22 | `moldova-toamna-culesul-viilor-ziua-vinului` | iubitori de vin, fotografi | Ziua Vinului (primul weekend din octombrie); vinăriile care primesc la cules (doar anunțate); Hramul Chișinăului; Festivalul Mărului; Miorița Laie | turism.gov.md, wineofmoldova.com, vinăriile | `ziua-nationala-a-vinului`, ghid 1, ghid 8 | sept–nov | [arhivă: vie] |
| 23 | `moldova-iarna-ce-vizitezi` | familii, diaspora acasă de sărbători | galeriile de vin (temperatură constantă); Vernisajul Vinului de Iarnă; obiceiurile de iarnă (Ungheni, Hîncești); târgurile de Crăciun; drumurile iarna | turism.gov.md, cricova.md | `cum-ajungi-la-targurile-de-craciun-din-chisinau`, `conditiile-meteo-polei-ceata-zapada-cum-conduci`, `colindele-si-uratul-texte-si-obiceiuri` | dec–feb | [arhivă: cricova] |
| 24 | `moldova-primavara-si-vara-festivaluri-drumetii` | drumeți, tineri, familii | Vernisajul de primăvară, Hederlez, Noaptea Muzeelor, DescOperă, Ia Mania, BelEU Fest; drumeții; căpușe și caniculă | turism.gov.md, organizatorii | ghid 4, 8, `capusele-boala-lyme-cum-scoti-capusa-corect` | apr–aug | [arhivă: codrii] |
| 25 | `moldova-cu-copiii-excursii-de-o-zi` | părinți | locuri potrivite (Bardar Zoo Club la 13 km, muzeele cu tarif redus/gratuit sub 7 ani, Sensorica, Orheiul Vechi, Mileștii cu trenulețul); siguranță; ce iei la drum | turism.gov.md, ordinul MC 36/2025, site-urile locurilor | pilon, `scaunul-auto-pentru-copii-obligatii-si-varsta` | tot anul | [lipsă pentru Bardar/Sensorica — doar cu acordul lor]; [arhivă: valea-morilor] |

Notă: turismul religios și calendarul hramurilor intră în ghidul 2 și ghidul 8 (nu articol separat). Dacă e nevoie de un al 26-lea: `hramurile-manastirilor-din-moldova-calendar` — doar cu datele de la Mitropolie.

---

## Ce n-am putut confirma în etapa 1 (de verificat la scriere)
- Programul și tariful actual la **Cetatea Soroca** (ONT spune „restaurată și redeschisă”; presa veche vorbea de închidere iarna și de restaurări din 2023).
- Lista oficială de tarife la **Mileștii Mici** (am găsit doar regulile: +100 lei după 17:00, copiii sub 10 ani gratuit, pe o pagină de rezervare de pe subdomeniul „mail.milestii-mici.md”).
- Regimul de vizitare în **rezervațiile științifice** (textul Legii 1538/1998 pe legis.md nu s-a deschis automat — 403; de citit manual).
- Data ediției 2026 la DescOperă, Ia Mania, Lapoiana, Festivalul Vinului de Autor, Festivalul Mărului, BelEU Fest (pe ONT apar fără an).
- Ce gară auto deservește fiecare direcție (registrul ANTA dă doar adresele; `autogara.md` e un site din 2018).
- Tarifele filialelor Muzeului de Etnografie (Țipova, Balioz) — tabelul din ordinul MC 36/2025 e dezaliniat în PDF; de citit pe original.
