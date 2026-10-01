# Brief: informații utile pe paginile de raion și de țară (sesiuni în cloud)

Pagina `/regiuni/<raion>/` și `/diaspora/<tara>/` arată acum doar știrile. Adaugi un bloc „Informații utile”: contactele de care un locuitor sau un moldovean din diaspora are nevoie real.

## Ce livrezi

Câte un fișier `content/locuri/raioane/<slug>.json` sau `content/locuri/tari/<slug>.json`. Slug-urile valide sunt cele din `src/lib/content/geo.ts` (`RAION_NAMES`, `COUNTRY_NAMES`). Un PR pe lot („Informații utile — raioane 1-12” etc.). Înainte de PR: `npm ci && npm run check:content` → `conținut: OK`.

## Format

```json
{
  "intro": "Opțional, 1-2 fraze factuale: reședința raionului, nr. de locuitori (cu sursă).",
  "updated": "AAAA-LL-ZZ",
  "sources": [{ "name": "Consiliul Raional Cahul", "url": "https://..." }],
  "blocks": [
    { "title": "Urgențe", "items": [{ "name": "Inspectoratul de Poliție Cahul", "phone": "+373 299 ...", "address": "str. ...", "url": "https://..." }] }
  ]
}
```

## Ce blocuri

**Raioane:** Urgențe (Inspectoratul de Poliție al raionului, Spitalul raional — recepție / urgențe, Direcția Situații Excepționale), Autorități (Consiliul raional, Primăria orașului-reședință), Servicii (Casa Teritorială de Asigurări Sociale, Agenția Servicii Publice — oficiul local, Oficiul Forței de Muncă).

**Țări:** Ambasada / consulatele Republicii Moldova (adresă, telefon, telefonul de urgență consulară, site), cum faci programarea consulară, numărul de urgență local (112 / 999 / 911), 1-2 linkuri oficiale utile pentru moldoveni (ex. portalul de programări consulare).

## Reguli

1. **Fiecare telefon și adresă verificate pe site-ul oficial al instituției** (gov.md, politia.md, site-ul consiliului raional, mfa.gov.md / site-ul ambasadei). Dacă nu găsești o informație oficială, nu o pui — un telefon greșit e mai rău decât niciunul.
2. Telefon în format internațional: `+373 22 123 456`.
3. Fără persoane fizice (nume de șefi, primari) — doar instituții; persoanele se schimbă.
4. `updated` = data de azi.

## Loturi

- Lot 1: drochia, soroca, edinet, briceni, ocnita, donduseni, riscani, glodeni, falesti, singerei, floresti, balti
- Lot 2: orhei, rezina, soldanesti, telenesti, calarasi, ungheni, nisporeni, straseni, criuleni, dubasari, anenii-noi, ialoveni
- Lot 3: hincesti, leova, cimislia, basarabeasca, cantemir, cahul, taraclia, causeni, stefan-voda, chisinau, gagauzia, ceadir-lunga
- Lot 4 (țări): italia, germania, franta, regatul-unit, spania, portugalia, romania, irlanda, belgia, olanda, cehia, polonia, israel, rusia, sua, canada

`transnistria` și `rabnita`: fără fișier (instituțiile constituționale nu funcționează acolo — informații greu de verificat).
