# Escrocheriile: cum le recunoști și ce faci — planul rubricii

Aprobată ca rubrică de proprietar la 2026-10-11. Categoria ghidurilor: `siguranta` (existentă). Fiecare ghid are și varianta rusă (`docs/cloud/traducere-ru.md`). Reguli generale: `docs/cloud/ghiduri.md`.

**Pilonul (gata, 2026-10-11):** `escrocheriile-in-moldova-cum-le-recunosti-si-ce-faci` — regula de bază (campania BNM cu MAI, CNPF, SIS și Asociația Băncilor), 11 scheme descrise oficial (apelul „de la bancă/Poliție”, falsul operator și aplicațiile de acces la distanță, „ruda în pericol”, vânzările pe site-uri de anunțuri, investițiile și cripto, joburile false, coletele/amenzile/premiile, phishing, chirii și bilete, preluarea contului de mesagerie, vârstnicii), semnele comune, primele minute, plângerea (CPP art. 58, 61, 219, 262–263), șansele de recuperare (Legea nr. 114/2012, art. 56–58), tabelul „Unde raportezi”, lista ghidurilor rubricii, FAQ. Orice ghid nou al rubricii se adaugă în secțiunea „Ghidurile rubricii «Escrocheriile»” a pilonului, RO + RU.

## Ghidurile rubricii

| # | Slug | Stare |
|---|------|-------|
| 0 | `fraudele-telefonice-si-online-cum-le-recunosti-si-unde-le-raportezi` | existent (2026-10-02) — apelurile false, aplicațiile, raportarea; nu se dublează |
| 1 | `ce-faci-daca-ai-cazut-in-plasa-escrocilor-pasi` | gata 2026-10-11 (RO + RU) — pașii în ordine, dovezi, plângerea, contestarea la bancă (Legea 114/2012 art. 55–58 și 104, formularul maib), chargeback, termene, parte civilă |
| 2 | `vanzari-online-999-marketplace-cum-nu-te-pacalesti` | gata 2026-10-11 (RO + RU) — vânzătorul (formularul fals de curierat, CNPF; Poșta Moldovei), cumpărătorul (avansul), magazin vs persoană fizică |
| 3 | `investitii-si-criptomonede-false-semne-cnpf-bnm` | gata 2026-10-11 (RO + RU) — semne, grupuri cu roboți, Forex/CFD, verificarea în registrele CNPF și BNM, IOSCO și regulatorii străini, cripto |
| 4 | `escrocheriile-care-vizeaza-varstnicii-cum-iti-protejezi-parintii` | gata 2026-10-11 (RO + RU) — schemele (accident, lanțul de „funcționari”), discuția, regulile de lângă telefon, setările cardului, plângerea pentru părinți (CPP art. 263), diaspora |

Ghiduri existente legate (nu se dublează): `cum-depui-o-plangere-la-politie-inclusiv-online`, `reclamatia-la-banca-asigurator-sau-ocn-noile-reguli`, `cumparaturi-online-colet-nelivrat-cum-reclami`, `munca-legala-in-strainatate-agentii-licentiate-cum-le-verifici`, `numerele-de-urgenta-si-ce-spui-cand-suni-la-112`, `protectia-datelor-personale-plangere-cnpdcp`, `creditul-de-consum-ce-verifici-inainte-sa-semnezi`, `drepturile-chiriasului-contractul-de-inchiriere-in-moldova`, `asistenta-juridica-garantata-de-stat`, `trimiterea-banilor-acasa-in-moldova`, `unde-reclami-ghid-cu-toate-institutiile`.

**De făcut (cere aprobare):** ghidul existent `fraudele-telefonice-...` nu are încă link spre pilon și spre ghidurile 1–4 (RO + RU). Nu l-am modificat.

## Surse de bază (verificate 2026-10-10/11)

- **Poliția (politia.md):** 28.04.2026 apelul „bancă/organe de drept” (`/ro/noutati/o-noua-metoda-de-escrocherie-fiti-vigilenti`); 29.01.2025 „ruda în accident”; 11.06.2026 cazul de 400.000 lei (lanțul de funcționari, curierul); 27.11.2024 Poșta Moldovei (86 de cazuri în 10 luni; 1310, 022 27 00 44); 06.01.2025 escrocheriile bancare de sărbători (`/ro/node/353`: premii, împrumuturi ușoare); 20.10.2025 grup cu investiții online (peste 4 mil. lei); 06.10.2025 campania „Stop Investițiilor False!”; pagina victimelor traficului (+373 22 254-998, 0 800 77777). Pagina Poliției despre biletele false (2024) a fost ștearsă.
- **BNM:** campania națională (`bnm.md/ro/node/69938`); uzurparea identității BNM; informarea din surse oficiale și cripto nereglementate (`/ro/node/69574`); recomandările pentru card (24/7, limite, SMS, 3D Secure, PIN); schemele cu pretext investițional; lista băncilor licențiate (10 bănci, date la 31.07.2026). Ghidul PDF „Cum te protejezi de fraude” e făcut din imagini, nu se citește ca text.
- **CNPF:** „Atenționări” (`cnpf.md/ro/atentionari-6568.html`) — cumpărătorul fals cu formular de curierat, apelurile „de la bancă”, grupurile cripto cu roboți, aplicațiile de acces la distanță, creditele pe numele tău, trainerii Forex/CFD, listele regulatorilor străini și IOSCO; „Registrele actelor permisive” (lista după Legea 171/2012, situația 29.06.2026); formularul de sesizare; Telefonul consumatorului 022 85 95 95.
- **legis.md** (WebFetch și curl dau 403; în browser textul complet e la `legis.md/cautare/showdetails/<doc_id>`, iar versiunile apar în `getResults?doc_id=...` ca `showDetails(null,'<id>')`): Legea nr. 114/2012, versiunea din 10.07.2026 = doc_id **155302** (art. 56: 13 luni, rambursare până la sfârșitul următoarei zile lucrătoare; art. 58: max. 500 lei, excepții, neglijență gravă; art. 104: 15/35 de zile lucrătoare). Atenție: există versiuni viitoare (01.01.2027, 17.03.2027) — reverifică după 1 ianuarie 2027. PDF-ul consolidat de pe bnm.md e vechi (plafon 2.500 lei) — nu-l folosi. Codul de procedură penală, versiunea din 28.08.2026 = doc_id **156018** (art. 58, 61, 219, 262–263); există și versiuni din 02.12.2026 și 09.12.2026.
- **Bănci:** maib — formularul „Cerere de contestare a plății” (docx); EuroCreditBank — comunicatul din 20.05.2026 (coduri SMS, acces la distanță, linkuri despre amenzi, documente false pe mesagerie).
- **Moldpres, 12.06.2026** — datele IGP de la audierile din Parlament (ianuarie–mai 2026: 515 / 310 / 230 de cazuri; peste 66 de ani; 56–65 de ani; peste jumătate în Chișinău).
- **ANOFM** (`anofm.md/ro/node/19349`): agențiile nu încasează taxe de la lucrători; 0 8000 1000.
- **STISC** — Ghidul securității cibernetice (verificarea în doi pași, contul spart).

Neconfirmat (nu scrie până nu găsești sursa oficială moldovenească): o alertă oficială activă despre chirii false și despre bilete false; o alertă oficială din Moldova despre preluarea conturilor WhatsApp/Telegram prin cod (există doar la DNSC, România); termenele de chargeback ale fiecărei bănci; avertizări CNA despre escroci care se dau drept angajați CNA; depunerea plângerii penale online prin servicii.gov.md; un eventual cadru legal nou pentru activele virtuale (BNM spune că cripto nu e reglementat — reverifică periodic).

## Idei de articole evergreen

1. Apelurile cu număr falsificat (spoofing): de ce pe ecran apare numărul băncii sau al Poliției și cum verifici.
2. Codul din SMS: ce autorizează de fapt și de ce nu se dictează nimănui (banca, WhatsApp, Telegram, MPass).
3. Contul de WhatsApp sau Telegram furat: cum îl recuperezi și cum îți anunți contactele.
4. Creditul luat pe numele tău cu actele furate: ce faci, istoria de credit, contestarea la bancă și la OCN (legătură cu rubrica `bani`).
5. Buletinul pierdut sau copiat: riscurile și pașii (ASP, Poliție, bancă).
6. Escrocheriile cu mașini: importul „la comandă” cu avans, mașinile de pe site-uri străine, actele false.
7. Escrocheriile cu locuințe: chirie cu avans, vânzări cu acte false, ce verifici la Cadastru (legătură cu rubrica `casa`).
8. Ofertele de muncă pe Telegram: „sarcini plătite”, „curier”, cardul dat altcuiva — cum ajungi complice fără să vrei.
9. Copiii și adolescenții: grupurile cripto, jocurile, șantajul online; ce le spun părinții.
10. Falsul „recuperator de fonduri”: cum îi recunoști pe cei care promit banii înapoi.
11. Escrocheriile de sărbători: cadouri, colete, reduceri, bilete de avion și vacanțe.
12. Diaspora: escrocheriile cu transferuri de bani, „rudele” de pe numere noi, falsele consulate.
13. Plata sigură online: card virtual, limite, 3D Secure, ce verifici la un magazin nou.
14. Ce înseamnă „neglijență gravă” la bancă: exemple, ce trebuie să dovedească banca, cum contești.
15. Calendarul anual al alertelor: ce scheme revin în fiecare sezon (iarnă, Paște, vacanțe, începutul școlii).

## Legătura cu știrile

Știrile pe aceste teme trimit cititorul la ghidul potrivit, cu un link „Ce faci tu” (conceptul de impact: știrea duce la instrumentele site-ului). Legarea în cod o face coordonatorul; aici e doar maparea:

- **Alerte noi ale Poliției, BNM, CNPF** despre o schemă (apel, SMS, aplicație) → pilonul, secțiunea schemei; dacă e telefonică → și `fraudele-telefonice-...`.
- **Reținerea unui grup de escroci / dosare penale cu victime** → ghidul 1, secțiunea despre partea civilă; persoanele nu se califică drept vinovate până la hotărâre definitivă.
- **Victime vârstnice, „ruda în accident”, curieri** → ghidul 4.
- **Platforme de investiții, cripto, piramide, reclame cu demnitari** → ghidul 3; avertizările noi ale CNPF intră în ghid doar dacă sunt generale (nu liste de firme care se schimbă).
- **Escrocherii pe 999.md, Marketplace, în numele Poștei Moldovei** → ghidul 2.
- **Joburi în străinătate, trafic de persoane** → `munca-legala-in-strainatate-agentii-licentiate-cum-le-verifici` și pilonul (schema 6).
- **Modificări legislative** (Legea 114/2012, blocarea fondurilor suspecte) → actualizezi ghidul 1 și secțiunea „Șansele de recuperare” din pilon, cu data.
- **Statistici IGP** → pilonul, paragraful de început al schemelor, doar cu sursa și data.
