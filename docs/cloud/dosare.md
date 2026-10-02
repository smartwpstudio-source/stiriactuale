# Brief: dosare pe subiectele mari (sesiuni Claude Code în cloud)

Un „dosar” e o pagină de fond despre un subiect care revine mereu în știri: ce s-a întâmplat, de ce contează, cronologia, unde suntem acum. Știrile zilnice trimit cititorul aici pentru context. Pentru Google sunt paginile care rămân relevante luni de zile.

## Ce livrezi

Același format ca ghidurile (vezi `docs/cloud/ghiduri.md`, secțiunea Format), în `content/ghiduri/<slug>.json`, cu `"category": "dosare"`. Un singur Pull Request, titlu „Dosare — lot 1”. Nu modifici alte fișiere, nu faci commit pe `master`. Înainte de PR: `npm ci && npm run check:content` → `conținut: OK`.

## Structura unui dosar (1.000–2.000 de cuvinte)

1. **Pe scurt** (3–4 fraze): ce e subiectul și de ce îl afectează pe cititor.
2. **Cronologie** (`<h2>`, apoi `<ul>` cu date): momentele-cheie, cu data exactă.
3. **Cifrele importante** (`<table>` unde ajută): sume, procente, termene — fiecare cu sursa.
4. **Cine sunt actorii** și ce poziții au, citate sau parafrazate cu atribuire.
5. **Unde suntem acum** (la data din `updated`).
6. **Ce urmează** — doar pași anunțați oficial, cu data anunțului.
7. **Ce înseamnă pentru tine** — impactul concret asupra unui om obișnuit.
FAQ: 4–6 întrebări reale.

## Reguli (obligatorii)

1. **Fiecare fapt, cifră și dată verificată acum pe web.** Surse: oficiale (`*.gov.md`, parlament.md, legis.md, bnm.md, anre.md, cec.md, procuratura.md, instanțe) plus presă cu redacție (ipn.md, moldpres.md, zdg.md, newsmaker.md, tv8.md, europalibera.org, rise.md, agora.md). Minim 4 surse, cel puțin 2 oficiale.
2. **Neutru și juridic corect:** o persoană e „condamnată” doar după hotărâre definitivă; altfel „acuzată / inculpată / cercetată”. Nu atribui intenții, nu folosi adjective de valoare. Pozițiile politice le prezinți atribuite, din ambele tabere când există.
3. Ce nu poți verifica, nu scrii. Fără cifre din memorie.
4. Ton clar, fraze scurte, explică termenii (vetting, acquis, tarif reglementat).
5. Titlul = ce caută omul pe Google, ex. „Furtul miliardului: cronologia dosarului și unde sunt banii”.
6. HTML permis ca la ghiduri. Română cu diacritice corecte (ș, ț cu virgulă). `updated` = azi.

## Lot 1

1. Furtul miliardului: cronologia dosarului, condamnările și recuperarea banilor
2. Reforma administrativ-teritorială: ce se schimbă pentru raioane și primării
3. Prețul gazului în Moldova: cum se stabilește tariful și de ce s-a schimbat
4. Aderarea Moldovei la UE: etapele negocierilor și calendarul
5. Independența energetică: de unde vin gazul și curentul Moldovei
6. Reforma justiției și evaluarea judecătorilor (vetting): ce s-a făcut până acum
7. Transnistria: situația regiunii și ce înseamnă pentru restul țării
8. Pensiile și salariile: indexările din ultimii ani și cum se calculează
