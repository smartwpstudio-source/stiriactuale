# Brief: ghiduri practice de sănătate, pe sezoane

Format: ca ghidurile (`docs/cloud/ghiduri.md`, secțiunea Format), în `content/ghiduri/<slug>.json`, `"category": "sanatate"`, `"updated"` = data de azi. 800–1.400 de cuvinte, 3–6 `<h2>`, FAQ 4–6 întrebări reale. Model de structură: un ghid existent din content/ghiduri (ex. `vaccinarea-copiilor-calendarul-national.json`).

## Reguli (temă de sănătate — strict)
- DOAR recomandări oficiale, atribuite: Ministerul Sănătății (ms.gov.md), Agenția Națională pentru Sănătate Publică (ansp.gov.md), IGSU (igsu.gov.md), CNAM (cnam.md), Centrul Național de Asistență Medicală Urgentă Prespitalicească (ambulanta.md), OMS (who.int), plus instituții similare din România / UE unde lipsesc cele moldovenești (ECDC, ms.ro). Minim 3 surse, minim 2 oficiale moldovenești sau OMS.
- Fără diagnostice, fără doze de medicamente, fără „tratamente naturiste”. Explici: ce e, cine e în pericol, cum previi, semnele de alarmă, primul ajutor recomandat oficial, CÂND suni la 112 / mergi la medic (secțiune obligatorie, clară, la început sau aproape).
- Cifre (cazuri, decese, temperaturi-prag) doar cu sursă și an.
- Română corectă, cu diacritice (ș, ț cu virgulă), ton calm și practic, fără alarmism.
- Linkuri interne doar spre ghiduri care există în content/ghiduri (verifică fișierul), ex. `/ghiduri/numerele-de-urgenta-si-ce-spui-cand-suni-la-112/`, `/ghiduri/medicul-de-familie-inscriere-si-schimbare/`, `/ghiduri/polita-de-asigurare-medicala-obligatorie/`.
- Titlul conține cuvintele pe care le caută omul (ex. „Intoxicația cu monoxid de carbon: semne, prim ajutor și cum o previi”). Slug fără diacritice, max 8 cuvinte.

## Scriere
Write direct în proiect poate fi blocat: scrie JSON-ul cu un script node în scratchpad (JSON.stringify) și copiază-l în content/ghiduri/. La final `npm run check:content` → „conținut: OK”. NU modifica alte fișiere, NU face commit.
