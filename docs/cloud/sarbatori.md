# Brief: pagini de sărbători și tradiții (sesiuni cloud)

Format: ca ghidurile (`docs/cloud/ghiduri.md`, secțiunea Format), în `content/ghiduri/<slug>.json`, cu `"category": "sarbatori"`. Un PR per lot. Înainte de PR: `npm ci && npm run check:content` → `conținut: OK`. Commit doar cu `content/ghiduri/`. Nu faci commit pe `master`.

## Structura unei pagini de sărbătoare (900–1.500 de cuvinte)
1. Pe scurt: ce se sărbătorește și **când — pe stil vechi și pe stil nou** (ex. „19 decembrie pe stil vechi, 6 decembrie pe stil nou”). Pentru sărbătorile legate de Paști: „la N zile după Paști” — fără date fixe.
2. `<h2>` Semnificația religioasă (după surse bisericești).
3. `<h2>` Tradiții în Moldova (sat, oraș, regiuni) — ce se face, ce se gătește, colinde/urări unde e cazul.
4. `<h2>` Ce nu e bine să faci — **credințe populare**: prezentate explicit ca superstiții/credințe din popor („se spune că…”, „în popor se crede că…”), nu ca reguli bisericești. Unde Biserica spune altceva, menționezi.
5. `<h2>` Cine își serbează onomastica (dacă e cazul) și urări scurte.
6. FAQ 4–6 întrebări reale („Ce nu ai voie să faci de Sf. Ilie?”, „Când e Boboteaza pe stil vechi?”).

Surse: mitropolia.md, mitropoliabasarabiei.md, doxologia.ro, basilica.ro, crestinortodox.ro, plus etnografie/folclor (Institutul Patrimoniului Cultural, muzee, Moldpres/IPN pentru tradiții locale). Minim 3 surse. Nimic inventat: tradițiile și superstițiile trebuie să apară în surse.

## Loturi (fiecare = o sesiune separată)

**G1 — iarna** (branch `sarbatori-lot-1`, PR „Sărbători — lot 1 (iarna)”): Sfântul Andrei; Sfântul Nicolae; Postul Crăciunului; Crăciunul (Nașterea Domnului); Sfântul Vasile și Anul Nou; Boboteaza; Sfântul Ioan Botezătorul (Soborul); Întâmpinarea Domnului.

**G2 — primăvara și Paștele** (branch `sarbatori-lot-2`, PR „Sărbători — lot 2 (Paștele)”): Postul Mare; Buna Vestire; Floriile; Săptămâna Mare și Vinerea Mare; Paștele; Paștele Blajinilor; Sfântul Gheorghe; Înălțarea Domnului și Rusaliile.

**G3 — vara și toamna** (branch `sarbatori-lot-3`, PR „Sărbători — lot 3 (vara–toamna)”): Sfinții Petru și Pavel; Sfântul Ilie; Schimbarea la Față; Adormirea Maicii Domnului (Sfânta Maria Mare); Tăierea capului Sf. Ioan; Nașterea Maicii Domnului (Sfânta Maria Mică); Înălțarea Sfintei Cruci; Sfântul Dumitru.

**H1 — sărbătorile de iarnă, partea practică** (branch `sarbatori-lot-4`, PR „Sărbători — lot 4 (iarna, practic)”): Masa de Crăciun în Moldova: bucate tradiționale și rețete; Colindele și uratul: texte și obiceiuri; Cum decorezi casa de sărbători (tradițional și modern); Idei de cadouri de Crăciun pe buget (fără linkuri spre magazine); Revelionul: tradiții și cum îl petreci; Calendarul sărbătorilor de iarnă: ce zile libere ai (cu sursa oficială).
