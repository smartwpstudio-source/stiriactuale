# Brief: sesiunea D — Israel (urgent), parametrii calculatoarelor, „Cât costă”

Formatul ghidurilor: `docs/cloud/ghiduri.md` (secțiunea Format și regulile de conținut). Fiecare sarcină = un Pull Request separat. Înainte de fiecare PR: `npm ci && npm run check:content` → `conținut: OK`. Nu modifici alte fișiere decât cele indicate. Nu faci commit pe `master`. Doar informații verificate acum, pe surse oficiale.

## Sarcina 1 — Lot 16: Israel, siguranță (URGENT, prima)

Situația de securitate din regiune e actuală; diaspora din Israel e numeroasă. 3 ghiduri, `category: "diaspora"`, branch `ghiduri-lot-16`, PR „Ghiduri — lot 16 (Israel, siguranță)”:
1. Moldovenii din Israel în situații de criză: înregistrarea la ambasadă, telefonul de urgență consulară, ce faci la alarmă (Pikud HaOref — Comandamentul Frontului Intern), adăposturi, aplicația oficială de alerte.
2. Întoarcerea acasă din Israel în situații de urgență: zboruri, evacuări organizate (doar ce a anunțat oficial MAE / ambasada), actele de care ai nevoie, ce faci dacă pașaportul e expirat (titlu de călătorie).
3. Lucrătorii moldoveni din Israel: drepturile la concediu, salariu și asigurare când activitatea se oprește din cauza situației de securitate (doar ce spun sursele oficiale israeliene și moldovenești).
Surse: israel.mfa.gov.md, mfa.gov.md (comunicate recente), oref.org.il, gov.il, btl.gov.il, anofm.md. **Datele de urgență (telefoane, adrese) doar de pe site-urile oficiale, verificate azi.** Data verificării în text („informații verificate la ...”).

## Sarcina 2 — parametrii calculatoarelor

Scrii **un singur fișier**: `content/calculatoare/parametri.json`, branch `calculatoare-parametri`, PR „Calculatoare — parametri 2026”. Fiecare valoare verificată acum pe legis.md / sfs.md / cnas.gov.md / cnam.gov.md, pentru anul în curs, cu sursa ei. Format exact:

```json
{
  "updated": "AAAA-LL-ZZ",
  "an": 2026,
  "salariu": {
    "impozit_venit_pct": 12,
    "scutire_personala_anuala_lei": 0,
    "cnam_angajat_pct": 9,
    "cnas_angajat_pct": 6,
    "salariu_minim_lei": 0,
    "cnas_deductibil": true,
    "cnam_deductibil": false,
    "nota": "ce e inclus / excepții importante, 1-3 fraze",
    "surse": [{ "name": "...", "url": "https://..." }]
  },
  "concediu_medical": {
    "trepte": [{ "stagiu_min_ani": 0, "procent": 60 }],
    "baza": "cum se calculează baza (venitul mediu lunar asigurat pe ultimele N luni)",
    "luni_baza": 6,
    "zile_medii_luna": 21,
    "plafon_lei": null,
    "primele_zile_angajator": 5,
    "surse": [{ "name": "...", "url": "https://..." }]
  },
  "maternitate": {
    "procent": 100,
    "luni_baza": 12,
    "zile_total": 126,
    "zile_medii_luna": 30.4,
    "plafon_lei": null,
    "surse": [{ "name": "...", "url": "https://..." }]
  }
}
```
Câmpurile `*_deductibil` spun dacă contribuția se scade din baza impozabilă. `zile_medii_luna` = numărul de zile la care se împarte venitul lunar ca să obții indemnizația pe o zi (lucrătoare la concediul medical, calendaristice la maternitate) — exact cum spune legea. Calculul din site: impozit = (brut − contribuțiile deductibile − scutire/12) × procent; indemnizația = venit mediu / zile_medii_luna × procent / 100 × zile. Dacă legea calculează altfel, scrie diferența în `nota` și în PR. Valorile din exemplu sunt doar forma — înlocuiește-le cu cele reale. Dacă o valoare nu există (ex. plafon), pune `null`. Dacă regula reală nu încape în format (ex. scutirea depinde de venit), descrie-o în `nota` și pune valoarea pentru cazul obișnuit. În descrierea PR-ului: tabel valoare → sursă (link exact).

## Sarcina 3 — „Cât costă în Moldova”, lot 1

`category: "costuri"`, branch `costuri-lot-1`, PR „Cât costă — lot 1”. 6 ghiduri, fiecare cu un `<table>` cu prețurile/taxele actuale și sursa fiecărui rând:
1. Cât costă actele de identitate în Moldova: pașaport, buletin, termene normale și urgente (ASP)
2. Cât costă permisul de conducere și înmatricularea mașinii (ASP)
3. Tarifele la gaz, energie electrică și termoficare: ce plătești acum (ANRE)
4. Tarifele la apă și canalizare în orașele mari (ANRE / operatori)
5. Taxele notariale uzuale: procură, contract de vânzare, moștenire
6. Taxele de stat în instanță: cât costă un proces civil
