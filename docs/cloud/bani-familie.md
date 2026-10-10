# Banii în familie — planul rubricii

Aprobată ca rubrică de proprietar. Categoria ghidurilor: `bani` („Bani, pensii și ajutoare”, în `src/lib/content/guides.ts`). Fiecare ghid are și varianta rusă (`docs/cloud/traducere-ru.md`). Reguli generale: `docs/cloud/ghiduri.md`. Ton informativ: fără recomandări de bănci, asigurători sau produse și fără sfaturi de investiții personalizate; cifrele doar cu sursă și dată.

**Pilonul (gata, 2026-10-11):** `banii-in-familie-buget-economii-credite-ghid-complet` — bugetul, fondul de urgență, economiile (tabel depozit / bani acasă / VMS), dobânzile medii BNM și rata de bază, creditele (Legea nr. 202/2013), asigurările, pensia, banii și copiii (doar principii), banii din diaspora, tabelul „Unde reclami”, lista ghidurilor rubricii și calculatoarele, FAQ. Orice ghid nou al rubricii se adaugă în secțiunea „Ghidurile rubricii «Banii în familie» și calculatoarele” a pilonului, RO + RU.

## Ghidurile noi ale rubricii (4, gata 2026-10-11, RO + RU)

| # | Slug | Ce acoperă |
|---|------|-----------|
| 1 | `fondul-de-urgenta-cat-pui-deoparte-si-unde` | calculul sumei (3–6 luni), construirea, unde ții banii (cont, depozit, numerar, de ce nu VMS), refacerea |
| 2 | `valorile-mobiliare-de-stat-pentru-populatie-cum-cumperi` | eVMS.md: cine poate, pașii, dobânzile rundei 5–19.10.2026, cuponul, impozitul, VMS vs. depozit |
| 3 | `cum-compari-doua-credite-dae-cost-total` | DAE și costul total după Legea nr. 202/2013 (art. 3, 4, 5, 12, 15, 18, 20, 23, 29), exemplu de calcul marcat ca exemplu |
| 4 | `asigurarile-utile-pentru-familie-locuinta-viata-sanatate` | obligatorii (AOAM/CNAM, RCA) vs. facultative, ce verifici în poliță, registrul BNM al asigurătorilor, unde reclami |

Ghiduri existente legate (nu se dublează): `bugetul-familiei-cum-il-faci-pas-cu-pas`, `depozitul-bancar-ce-garanteaza-statul-fgdsb`, `creditul-de-consum-ce-verifici-inainte-sa-semnezi`, `cum-eviti-datoriile-microcredite-dae-restante`, `colectorii-de-datorii-ce-au-voie-si-unde-reclami`, `comisioanele-bancare-card-transferuri-valuta`, `trimiterea-banilor-acasa-in-moldova`, `roaming-si-bani-in-calatorie`, `cum-economisesti-energie-electrica-acasa`, `programul-prima-casa-conditii-si-pasi`, `compensatii-si-scutiri-pe-care-le-uiti`, `ajutor-social-cine-il-poate-primi-si-cum-se-depune-cererea`, pensiile (`pensiile-in-moldova-tot-ce-trebuie-sa-stii`, `cum-se-calculeaza-pensia-pentru-limita-de-varsta`, `varsta-de-pensionare-in-moldova-calendar-femei-barbati`, `ce-este-indexarea-pensiilor`, `pensie-moldoveni-care-au-lucrat-in-strainatate`), asigurările (`polita-de-asigurare-medicala-obligatorie`, `rca-si-cartea-verde-ce-acopera-si-cum-le-cumperi`, `asiguratorul-nu-plateste-despagubirea-rca-casco`, `asigurarea-medicala-de-calatorie`), `reclamatia-la-banca-asigurator-sau-ocn-noile-reguli`, `fraudele-telefonice-si-online-cum-le-recunosti-si-unde-le-raportezi`, `unde-reclami-ghid-cu-toate-institutiile`.

Calculatoare legate (`src/lib/calculators.ts`): `/calculatoare/salariu-net/`, `/calculatoare/convertor-valutar/`, `/calculatoare/indemnizatie-somaj/`, `/calculatoare/concediu-medical/`, `/calculatoare/indemnizatie-crestere-copil/`, `/calculatoare/impozit-imobil/`. Nu există încă un calculator de credit sau de depozit pe site; până atunci, trimitem la calculatorul DAE al CNPF (dae.cnpf.md).

## Surse de bază (verificate octombrie 2026)

- **BNM — piața depozitelor / creditelor, lunar** (`bnm.md/ro/content/evolutia-pietei-depozitelor-bancare-luna-<luna>-<an>` și `...-creditelor-bancare-...`). Ratele sunt în imagini PNG (`/files/2.Tabel_..Depozite-Persoane fizice-MM.AAAA.png`, `/files/2.Tabel_.Credite-Persoane fizice-MM.AAAA.png`): se descarcă și se citesc. August 2026 (publicat 18.09.2026), persoane fizice: depozite noi la termen 5,87% lei / 1,30% valută; la vedere cu dobândă 0,92% / 0,79%; credite de consum 10,96% lei / 6,00% valută; imobiliare 8,07% lei. Datele pentru septembrie apar în jurul datei de 20 octombrie — **actualizează tabelul din pilon lunar**.
- **BNM — decizia de politică monetară din 17.09.2026** (PDF prin `bnm.md/ro/printpdf/content/decizia-de-politica-monetara-17092026`, citit cu `pdftotext`): rata de bază 9,00%; inflația anuală 6,96% în august 2026; medii pe piață în lei, august 2026: depozite noi 5,65%, credite noi 9,19%; următoarea ședință 5.11.2026.
- **Ministerul Finanțelor — VMS pentru populație**: lista comunicatelor pe `mf.gov.md/ro/datoria-sectorului-public/piața-primară-a-vms/comunicate-privind-plasarea-vms-prin-subscriere` (PDF, `pdftotext -layout`). Runde la două săptămâni. Runda 05–19.10.2026: 7,65% / 7,75% / 7,85% / 8,05% (1–4 ani), emitere 20.10.2026, fără înstrăinare sau răscumpărare înainte de scadență. **Ghidul investitorului VMS 2026** (PDF): condiții eVMS (cetățean RM, 18+, cont în lei la bancă din RM, semnătură electronică calificată, MPass), nominal 100 lei, scutirea de impozit din 15.08.2024, formula cuponului. **Actualizează dobânzile din pilon și din ghidul 2 la fiecare rundă nouă sau măcar lunar.**
- **Legea nr. 202/2013**: `legis.md/cautare/getResults?doc_id=138263&lang=ro` (textul se încarcă prin AJAX; în browser se citește cu `document.body.innerText` după încărcare). Atenție: Ministerul Dezvoltării Economice pregătește o lege nouă pentru transpunerea Directivei (UE) 2023/2225 (consultare 28.05–12.06.2026, termen decembrie 2026) — când e adoptată, ghidul 3 și pilonul trebuie revăzute.
- **FGDSB** (`fgdsb.md/pentru-deponenti/`): 200.000 lei pe deponent pe bancă, din 01.01.2025; plăți în 7 zile lucrătoare.
- **BNM — entități supravegheate: asigurări și sectorul nebancar** (`bnm.md/ro/content/entitati-supravegheate-asigurari-si-sectorul-nebancar`): registrul asigurătorilor (Excel, la 30.09.2026: 9 societăți), brokeri, agenți și bancassurance, OCN, AEÎ. BNM supraveghează asigurătorii din 01.07.2023; reclamațiile consumatorilor merg la CNPF.

Neconfirmat (nu scrie până nu găsești sursa): cota actuală a impozitului pe dobânzile la depozite (proiect MF de majorare din 2027); suma minimă / maximă pe eVMS.md (pagina se încarcă dinamic); limitele concrete (DSTI etc.) din Regulamentul BNM privind creditarea responsabilă (HCE nr. 60/2026) — legis.md a cerut verificare Cloudflare, iar PDF-ul BNM e scanat; dacă există o asigurare obligatorie a locuinței în pregătire (doar un articol vechi, nedatat, pe monitorul.fisc.md).

**De verificat la un ghid vechi:** `cum-eviti-datoriile-microcredite-dae-restante` trimite la lista OCN de pe cnpf.md, dar registrul OCN autorizate apare acum și pe pagina BNM de entități supravegheate. Clarifică cine ține registrul în vigoare.

## Idei de articole evergreen (pentru mai târziu)

1. Inflația și economiile tale: cum citești cifra BNS/BNM și ce înseamnă dobânda reală.
2. Rata de bază a BNM: ce este și cum ajunge (sau nu) în rata ta la credit și în dobânda la depozit.
3. Dobânda fixă sau flotantă la credit: cum funcționează, ce scrie în contract, ce se întâmplă când crește rata de bază.
4. Rambursarea anticipată a creditului: când merită, cum se calculează compensația, cererea către bancă.
5. Refinanțarea și consolidarea creditelor: când ajută și când e doar o datorie mai lungă.
6. Istoria de credit: cum ceri raportul de la biroul de credit și cum corectezi o greșeală.
7. Creditul ipotecar dincolo de „Prima casă”: avans, evaluare, asigurare, costuri notariale.
8. Pensiile facultative și economisirea pentru bătrânețe: ce există legal în Moldova și cine supraveghează.
9. Banii de buzunar și educația financiară a copiilor, pe vârste.
10. Depozitul în valută sau în lei: riscul de curs, garanția FGDSB, impozitul.
11. Cardul de credit și overdraftul: cum se calculează dobânda și perioada de grație.
12. Contul comun și banii cuplului: cont comun, procura, moștenirea depozitelor.
13. Cumpărăturile în rate „0%”: ce verifici (comisioane, asigurare, DAE).
14. Bugetul unei familii cu venituri din străinătate: curs, comisioane, cum planifici transferurile.
15. Ce faci cu o sumă mare primită o dată (moștenire, vânzarea unei case): garanția FGDSB 200% timp de 3 luni, plafonul, opțiunile.

## Legătura cu știrile

Știrile pe aceste teme trimit cititorul la ghidul potrivit, cu un link „Ce faci tu” (conceptul de impact):

- **Decizii BNM de politică monetară (rata de bază)** → secțiunea „Dobânzile medii și rata de bază” din pilon; ghidul 3 (dobânda flotantă, comparația ofertelor); ghidul despre depozite.
- **Inflația lunară (BNS) și Raportul asupra inflației (BNM)** → tabelul economiilor din pilon (inflație vs. dobânda la depozit), ghidul `preturile-la-alimente-si-inflatia-date-bns-bnm`, `bugetul-familiei-cum-il-faci-pas-cu-pas`.
- **Rundele noi de VMS / schimbări de dobânzi la eVMS.md** → ghidul 2 (actualizat cu ultimul comunicat) și tabelul din pilon.
- **Statistica BNM a depozitelor și creditelor (lunar)** → tabelul din pilon; ghidul 1 (unde ții fondul de urgență).
- **Credite: legi noi, plafoane, controale la OCN, colectori** → ghidul 3, `creditul-de-consum-ce-verifici-inainte-sa-semnezi`, `cum-eviti-datoriile-microcredite-dae-restante`, `colectorii-de-datorii-ce-au-voie-si-unde-reclami`.
- **Asigurători: licențe retrase, amenzi, schimbări la RCA** → ghidul 4 (cum verifici asigurătorul), `asiguratorul-nu-plateste-despagubirea-rca-casco`.
- **Bănci în dificultate, FGDSB** → `depozitul-bancar-ce-garanteaza-statul-fgdsb`, ghidul 1.
- **Fraude financiare („investiții”, apeluri „de la bancă”)** → secțiunea despre economii din pilon și ghidul de fraude (rubrica „Escrocheriile”, făcută separat).
