# Brief: ghiduri „Unde și cum reclami” (abuzuri și conflicte cu instituții și firme)

Format: ca ghidurile (`docs/cloud/ghiduri.md`, secțiunea Format și Reguli de conținut), în `content/ghiduri/<slug>.json`, `"category": "siguranta"`, `"updated"` = data de azi. 900–1.500 de cuvinte, 4–6 `<h2>`, FAQ 4–6 întrebări reale.

## Structura fiecărui ghid
1. Pe scurt (2–3 fraze): ce drepturi ai și unde reclami.
2. Ce are voie / ce nu are voie (banca, executorul, colectorul etc.) — din lege, cu articolul.
3. Pașii, numerotați (`<ol>`): întâi reclamația la furnizor/instituție, termenul de răspuns, apoi autoritatea de supraveghere, soluționarea amiabilă, instanța.
4. **`<h2>Model de reclamație</h2>`** — un model scurt, gata de copiat, în `<p>`-uri: antet (Către…, De la… cu IDNP, adresa, telefon), obiectul, faptele, temeiul legal (articolul), cererea concretă, termenul de răspuns, anexe, data și semnătura. Câmpurile de completat între paranteze drepte: [numele], [data], [numărul contractului]. Fără nume reale.
5. Termene și costuri (taxa de stat dacă e cazul), greșeli frecvente, „ce faci dacă nu primești răspuns”.

## Reguli
- Surse: minim 3, minim una oficială moldovenească, consultate acum: legis.md (legea + articolul), bnm.md, cnpf.md, justice.gov.md, ombudsman.md, consumator.gov.md, cnam.md, ms.gov.md, anrceti.md, uniunea avocaților, uniunea executorilor, camera notarială. Dacă folosești un domeniu oficial care nu e în lista OFFICIAL din scripts/checks/content.ts, SPUNE-L în raport (nu modifica fișierul).
- Verifică cine supraveghează acum fiecare sector (ex. asigurătorii: BNM sau CNPF, după reforma din 2023) — nu presupune.
- Termene, plafoane, amenzi, taxe: doar confirmate pe sursă, cu data; altfel trimiți la sursă.
- Strict informativ: fără nume de bănci, asigurători, firme sau persoane; fără promisiuni („câștigi sigur”); fără îndemnuri la conflict. Ton calm, practic, „tu”.
- Română cu diacritice corecte (ș, ț cu virgulă). Titlul = ce caută omul pe Google. Descrierea 110–175 caractere, cu cuvintele din știri (pentru caseta „Ghid util”). Slug fără diacritice, max 8 cuvinte.
- Linkuri interne doar spre ghiduri existente (verifică în content/ghiduri), ex. `/ghiduri/cum-depui-o-plangere-la-politie-inclusiv-online/`, `/ghiduri/asistenta-juridica-garantata-de-stat/`, `/ghiduri/drepturile-consumatorului-returnarea-unui-produs-si-garantia/`, `/ghiduri/cum-eviti-datoriile-microcredite-dae-restante/`, `/ghiduri/protectia-datelor-personale-plangere-cnpdcp/`, `/ghiduri/plangere-la-inspectoratul-de-stat-al-muncii-cand-si-cum/`, `/ghiduri/cum-contesti-o-factura-la-gaz-sau-lumina/`, `/ghiduri/accidentul-usor-constatare-amiabila-si-rca/`, plus ghidurile acestui lot.

## Scriere
Scratchpad-ul e comun cu alți agenți: lucrează DOAR într-un subfolder cu numele lotului tău. Scrie JSON-ul cu un script node (JSON.stringify) și copiază-l în content/ghiduri/. La final `npm run check:content` → „conținut: OK” (ignoră erorile fișierelor altor agenți). NU modifica alte fișiere, NU face commit.
