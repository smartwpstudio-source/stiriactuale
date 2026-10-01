# Brief: verificarea zilnică a articolelor publicate automat (sesiune în cloud)

Pipeline-ul publică singur știrile nesensibile. Verifici zilnic, cu ochi de editor, articolele publicate în ultimele 24 de ore.

## Pași

1. Citește `https://stiriactuale.info/feed/` — articolele din ultimele 24 de ore (după `pubDate`).
2. Pentru fiecare articol: deschide pagina, iar la final, în „Surse:”, deschide linkurile surselor originale.
3. Compară: **cifre, nume, date, locuri, declarații și cui sunt atribuite**. Verifică și regulile din `src/lib/pipeline/generate.ts` (prezumția de nevinovăție, fără numele minorilor sau ale victimelor violenței, fără promisiuni de actualizare).
4. Dacă **totul e corect** — nu faci nimic altceva. Fără issue, fără commit.
5. Dacă găsești **cel puțin o problemă** — deschizi **un singur issue** pe GitHub, titlu „Verificare DD.MM: N probleme”, cu, pentru fiecare problemă: linkul articolului, ce scrie la noi, ce scrie în sursă (citat scurt), gravitatea (greșeală de fapt / atribuire / regulă juridică / stil).

## Nu faci

- Nu modifici codul și nici conținutul. Corecturile le face editorul în /admin.
- Nu semnalezi preferințe de stil ca erori — doar greșeli de fapt, de atribuire și încălcări de reguli.
