# Sistem de design UI — stiri actuale (decizie finală)

## 1. Concept
Identitate ancorată în ce e site-ul cu adevărat: un sistem de monitorizare/editare, nu un blog generic. Semnătura vizuală e o bandă discretă sub header, care arată **rezultatul** pipeline-ului către cititor ("ultima știre publicată: acum X min"), **niciodată mecanica internă** (nu "următoarea sincronizare", nu "N surse monitorizate" — sunt detalii de infrastructură, expun site-ul ca automatizat pe cronometru și subminează încrederea, nu o construiesc).

## 2. Paleta de culori (hex exacte, de folosit direct în cod)

| Token | Hex | Rol |
|---|---|---|
| `ink` | `#141820` | header, footer, chrome întunecat |
| `ink2` | `#1E2530` | banda sub header (o nuanță mai deschisă decât ink) |
| `paper` | `#EAEEEA` | fundal de citire — gri-verzui rece, deliberat NU cremă caldă |
| `amber` | `#C98D2E` | accent principal, linkuri, puncte de semnalizare |
| `teal` | `#2B6E64` | subiecte neutre/pozitive (social, cultură, sport, diaspora generic) |
| `red-alert` | `#B23A2E` | **strict rezervat**: accidente, criminal, alertă 112, corupție — niciodată decorativ |
| `line` | `#D3D7CF` | bordurile de 0.5px (carduri, chip-uri) |
| `sub` | `#5C6259` | text secundar/mono (timestamp-uri, meta) |

Regulă fermă: roșul nu se folosește pentru altceva decât cele 4 subiecte de mai sus — își pierde sensul de "atenție" dacă apare oriunde altundeva.

## 3. Tipografie

| Rol | Font | Unde |
|---|---|---|
| Display/editorial | **Fraunces** (serif, weight 500, italic pt wordmark) | titluri H1/H2, wordmark "Stiri actuale" |
| Corp text & UI | **IBM Plex Sans** (400/500) | navigare, paragrafe, butoane |
| Mono/utilitar | **IBM Plex Mono** (400/500) | timestamp-uri, etichete de subiect, banda de status, breadcrumb |

Import Google Fonts:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap">
```

## 4. Extensie Tailwind (`tailwind.config.ts`)

```ts
export default {
  theme: {
    extend: {
      colors: {
        ink: '#141820',
        ink2: '#1E2530',
        paper: '#EAEEEA',
        amber: '#C98D2E',
        teal: '#2B6E64',
        alert: '#B23A2E',
        line: '#D3D7CF',
        sub: '#5C6259',
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
}
```

## 5. Componente cheie

**Header** — fundal `ink`, text `paper`. Wordmark "Stiri actuale" în Fraunces italic. Navigare (regiuni / național / internațional / diaspora) în Plex Sans, sentence case. Icon căutare la dreapta.

**Banda de status** — fundal `ink2`, text mono 10.5px, punct `amber`. Conținut: `ultima știre publicată: acum X min`. Atât — nimic despre surse monitorizate sau următoarea rulare.

**Hero (homepage)** — eyebrow mono `amber` ("cel mai popular acum"), H1 Fraunces ~24px, meta mono sub titlu (secțiune · localitate · timp · "raportat de N surse"), imagine/thumb lângă text.

**Card articol** — fundal alb, bordură `line` 0.5px, fără umbră (deliberat liniștit — vezi regula de restrângere de mai jos). Thumb cu tentă de culoare pe subiect (10-15% opacitate din culoarea subiectului) + icon Tabler centrat. Etichetă subiect mono, colorată. Titlu Fraunces 12-15px. Meta mono cu timp + număr de surse.

**Etichetă de subiect** (nu de secțiune — vezi taxonomia din `arhitectura-site-nou-taxonomie-pwa-seo.md`): roșu pentru accidente/criminal/alertă 112/corupție, amber pentru economic/criză energetică/sănătate, teal pentru social/cultură/sport/diaspora generic.

**Pagină categorie** — breadcrumb mono, H1 Fraunces, chip-uri de filtrare pe raion (pentru regiuni), listă de rânduri orizontale (thumb mic + conținut, nu grid dens) — mai potrivit pentru scanare rapidă la volum mare, paginare mono la final.

**Pagină articol** — breadcrumb, etichetă de subiect, H1 Fraunces, byline mono (echipă editorială · timp · N surse), imagine full-width, lead cu font puțin mai mare, corp cu subtitluri H2 Fraunces, tag-uri la final, "articole similare" (3 carduri mici). Lățime de citire limitată (~600px), nu se întinde pe tot ecranul.

## 6. Regula de restrângere (de respectat la orice extindere ulterioară)

- "Îndrăzneala" vizuală stă în bandă + hero + titluri Fraunces — restul (carduri, liste) rămâne deliberat liniștit, bordură subțire, fără umbre/gradient.
- Nu se adaugă culori noi în paletă fără motiv — 6 tonuri sunt suficiente pentru tot site-ul.
- Orice element nou se verifică întâi contra acestei reguli: dacă pare că "adaugă zgomot" fără să transmită o informație reală, se elimină (exact cazul benzii inițiale cu mecanica pipeline-ului, corectat mai devreme în discuție).
