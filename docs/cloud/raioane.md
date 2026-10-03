# Brief: ghiduri pe raioane + Transnistria + ATO Găgăuzia

Continuarea ghidurilor de oraș (`docs/cloud/orase.md`, model: `content/ghiduri/soroca-primaria-spitalul-asp-transportul.json`). Fiecare ghid apare automat sub știrile din raionul lui („Ghid util”), deci e contextul local al cititorului. Format: ca ghidurile (`docs/cloud/ghiduri.md`, secțiunea Format), în `content/ghiduri/<slug>.json`, `"category": "orase"`. NU modifici alte fișiere, NU faci commit/push/PR. La final: `npm run check:content` → `conținut: OK`.

## Slug — OBLIGATORIU începe cu cheia raionului din `src/lib/content/geo.ts` (RAION_NAMES)
`<cheie>-primaria-spitalul-asp-transportul`, ex. `singerei-primaria-spitalul-asp-transportul`, `anenii-noi-…`, `stefan-voda-…`, `ceadir-lunga-…`. Altfel ghidul nu se leagă de știri.

## Ghid de raion (700–1.500 de cuvinte)
Titlu: „Sîngerei: primăria, spitalul, ASP și transportul — contacte utile” (numele ca în RAION_NAMES).
1. Pe scurt: raionul în 3 fraze — orașul-reședință, populația raionului după RPL 2024 (statistica.gov.md), cu ce se învecinează.
2. `<h2>` Consiliul raional și primăria orașului-reședință: adrese, telefoane, program, ce acte se fac acolo.
3. `<h2>` Urgențe și sănătate: 112, spitalul raional, centrul de sănătate, AMU.
4. `<h2>` Acte și servicii de stat: ASP (centrul multifuncțional), CNAS, Serviciul Fiscal de Stat (subdiviziunea), ANOFM, inspectoratul de poliție, cadastru dacă există pagină oficială.
5. `<h2>` Transport: autogara, rute spre Chișinău/Bălți, punctele de trecere a frontierei din raion (dacă există, de pe border.gov.md).
6. FAQ: 4–6 întrebări reale („Unde fac buletinul în Sîngerei?”).

## Reguli
- Fiecare adresă, telefon, program verificat ACUM pe sursa oficială (asp.gov.md, cnas.gov.md, sfs.md, anofm.md, igp.gov.md / politia.md, site-ul consiliului raional / primăriei / spitalului, border.gov.md). Ce nu poți verifica, nu pui. Fără nume de persoane.
- Minim 3 surse, cel puțin 2 oficiale. Română cu diacritice corecte (ș, ț cu virgulă). `updated` = data de azi.

## Transnistria — slug `transnistria-regiunea-necontrolata-ce-trebuie-sa-stii`
Titlu: „Transnistria: regiunea necontrolată de Chișinău — istorie, statut, ce trebuie să știi”. 1.200–2.000 de cuvinte. DOAR fapte, ton neutru, atribuite, fără termenii propagandei („RMN” doar între ghilimele ca denumire autoproclamată; „administrația de facto de la Tiraspol”).
- Statutul juridic: parte a Republicii Moldova, teritoriu necontrolat de autoritățile constituționale; nerecunoscută de niciun stat membru ONU.
- Istoria conflictului pe scurt: 1990 proclamarea, războiul din 1992 (cifre de victime cu sursa), acordul din 21 iulie 1992, forțele de menținere a păcii, trupele ruse (GOTR), depozitul de la Cobasna, formatul 5+2, Memorandumul Kozak 2003 (respins).
- Ce înseamnă azi pentru cetățeni: acte (ASP are oficii pentru locuitorii din stânga Nistrului), vamă și posturi, gazul (contextul crizei din 2025 cu sursa), circulația, școlile cu grafie latină.
- Surse: mfa.gov.md / Biroul politici de reintegrare (gov.md), OSCE (osce.org), ONU, presă de încredere (Europa Liberă, Reuters, AP). Fără surse de propagandă (sputnik, tass, ria, novostipmr ca sursă de fapte).
- FAQ: „Pot călători în Transnistria?”, „Ce acte au locuitorii din stânga Nistrului?” etc.

## ATO Găgăuzia — slug `gagauzia-autonomia-ce-prevede-statutul`
Titlu: „Găgăuzia (UTA Găgăuzia): ce prevede autonomia, cine conduce și de ce apar scandaluri”. 1.200–2.000 de cuvinte. Ton neutru, fapte atribuite — ghidul e contextul politic pentru știrile din Găgăuzia (Comrat are deja ghidul informativ cu contacte: nu repeta contactele, pune link spre `/ghiduri/comrat-primaria-spitalul-asp-transportul/`).
- Legea 344/1994 privind statutul juridic special; teritoriul (Comrat, Ceadîr-Lunga, Vulcănești, satele), populația RPL 2024.
- Instituțiile: bașcanul (ales direct, membru de drept al Guvernului), Adunarea Populară, Comitetul Executiv; competențe și limite.
- Context politic factual: referendumul din 2 februarie 2014 (declarat ilegal de instanțe), alegerile din 2023 și dosarul bașcanei Evghenia Guțul (condamnare — verifică stadiul exact și data), legăturile cu Ilan Șor atribuite din surse judiciare, disputele de competențe cu Chișinăul. Fiecare afirmație cu sursa; ce e în curs în instanță se spune ca atare.
- Surse: legis.md (Legea 344), gov.md, CEC (cec.md), Europa Liberă, ZdG, Reuters/AP, BNS.
- FAQ: „Ce înseamnă statutul de autonomie?”, „Poate Găgăuzia să iasă din Moldova?” (prevederea din lege despre schimbarea statutului de stat independent — citește-o exact).
