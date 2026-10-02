# Brief: pagini pentru orașele mari (sesiuni Claude Code în cloud)

O pagină per oraș cu tot ce caută un locuitor sau cineva care vine acolo: primăria și serviciile ei, transportul, spitalele, urgențele, ASP, CNAS, oficiul poștal central, piețele, gara. Format: ca ghidurile (vezi `docs/cloud/ghiduri.md`, secțiunea Format), în `content/ghiduri/<slug>.json`, cu `"category": "orase"`. Un singur Pull Request: „Orașe — lot 1”. Nu modifici alte fișiere. Înainte de PR: `npm ci && npm run check:content` → `conținut: OK`.

## Structura (700–1.500 de cuvinte)
1. Pe scurt: orașul în 3 fraze (raion, populație după ultimul recensământ — cu sursa).
2. `<h2>` Primăria și serviciile: adresa, telefonul, programul, e-mail, ce acte se fac acolo.
3. `<h2>` Urgențe și sănătate: 112, spitalul, centrul de sănătate, farmaciile de gardă dacă există pagină oficială.
4. `<h2>` Acte: ASP (centrul multifuncțional), CNAS, oficiul de ocupare (ANOFM), poliția — adrese și telefoane.
5. `<h2>` Transport: gara auto / feroviară, rute spre Chișinău, transport urban (doar ce e publicat oficial).
6. FAQ: 4–6 întrebări reale („Unde fac buletinul în Bălți?”, „Ce program are primăria Cahul?”).

## Reguli
- **Fiecare adresă, telefon, program verificat acum pe sursa oficială** (site-ul primăriei, asp.gov.md, cnas.gov.md, politia.md, anofm.md, site-ul spitalului). Ce nu poți verifica, nu pui. Fără nume de persoane (primar, directori).
- Minim 3 surse, cel puțin 2 oficiale. Titlul: „Bălți: primăria, spitalul, ASP și transportul — contacte utile”. Română cu diacritice corecte. `updated` = azi.

## Lot 1
Chișinău, Bălți, Cahul, Ungheni, Comrat, Orhei, Soroca, Edineț, Hîncești, Strășeni.
