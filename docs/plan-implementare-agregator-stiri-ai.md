# Plan de implementare: sistem automat de generare și publicare știri (AI)
### pentru stiriactuale.info (WordPress, tema Bimber)

---

## 1. Context tehnic constatat

- Site rulează **WordPress + WPBakery + tema Bimber** (framework Snax), care are deja:
  - taxonomie pe orașe/raioane (Drochia, Strășeni, Florești, Criuleni, Anenii Noi, Șoldănești, Dondușeni etc.)
  - categorii naționale: Stiri Moldova, Stiri Romania, Stiri Externe
  - un sistem de "puncte"/upvote și filtre `latest / hot / trending` (`?filter-by=hot`) — deja folosite pentru popularitate
  - suport WP REST API nativ (`/wp-json/wp/v2/posts`)
- Lipsește: o categorie dedicată **diaspora** și un mecanism de scoring bazat pe **surse externe multiple**, nu doar interacțiune pe site.

**Recomandare imediată:** creează categoria `Moldoveni în Diaspora` (și eventual subcategorii pe țări: Italia, Franța, UK, Germania, SUA) înainte de a construi pipeline-ul — evită refactorizare ulterioară.

---

## 2. Cele 3 variante de implementare

| Variantă | Efort | Control | Cost recurent | Recomandat pentru |
|---|---|---|---|---|
| **A. Plugin existent** (AI Content Autopilot, BotWriter, Auto Robot) | Ore–zile | Limitat la ce oferă pluginul | API AI + eventual licență plugin | Testare rapidă / MVP |
| **B. Plugin custom** | 1–3 săptămâni dev | Total | Doar API-uri (AI text + imagine) | **Recomandat** — se potrivește exact pe taxonomia ta |
| **C. Aplicație web nouă** | Luni | Total, produs separat | Hosting nou + API-uri | Doar dacă vrei brand nou, nu automatizare pe cel existent |

### 2.1 Plugin-uri existente relevante (verificate live)
- **AI Content Autopilot** — fetch RSS, rescriere via OpenRouter (suportă Claude, GPT, Gemini), imagini AI via fal.ai, publicare programată, WP-Cron.
- **BotWriter** — explicit orientat pe "news aggregation blogs: pull and rewrite trending news", multilingv.
- **WP RSS Aggregator** — cel mai solid pentru *import* RSS brut (fără AI nativ în versiunea free), bun ca sursă de date pentru un plugin custom.
- **AI Content Creator / AI News** — generare pe bază de subiecte/cuvinte cheie, integrare OpenAI/Gemini.

Aceste plugin-uri sunt utile ca referință de funcționalitate sau ca soluție rapidă, dar niciunul nu are logica ta specifică (4 categorii țintă + scoring pe popularitate cross-sursă + oraș-nivel taxonomie).

---

## 3. Arhitectura pipeline-ului (varianta B — recomandată)

```
[1] Surse externe (RSS + Google News RSS pe cuvinte cheie)
        │  rulează la fiecare 2 ore via cron real de server
        ▼
[2] Deduplicare + Filtrare & scoring (relevanță + popularitate)
        ▼
[3] Clasificare AI pe categorii: local / național / internațional / diaspora
        ▼
[4] Generare articol unic (LLM) — titlu, corp, structură SEO
        ▼
[5] Generare/selectare imagine simbol (AI sau stock licențiat)
        ▼
[6] Publicare pe WordPress (draft recomandat inițial, apoi auto-publish)
```

### 3.1 Surse de monitorizat

**Sursă principală recomandată — news.yam.md** (RSS confirmat: `https://news.yam.md/ro/rss`)
Meta-agregator care combină deja zeci de surse moldovenești (ZdG, IPN, ProTV, NewsMaker, Realitatea, Noi.md, Moldpres, TV8, Unimedia ș.a.), actualizat la 1-3 minute. Are grupare nativă de subiecte cu contor de surse ("N știri similare") — de folosit ca semnal de popularitate suplimentar în scoring (3.2), pe lângă deduplicarea proprie.

**Surse complementare**
- **Moldpres** — RSS: `https://www.moldpres.md/config/rss.php?lang=rom` (variante și `lang=rus`, `lang=eng`; `moldpres.md` fără `www.` redirectează 301 la `www.moldpres.md` — folosește direct forma cu `www.` la fetch, verificat 2026-08-11). Util pentru comunicate oficiale/guvernamentale, dar NU ca sursă unică — prea formal, prea puține știri publicabile ca atare.
- **Ziarul de Gardă (zdg.md)** — RSS: `https://www.zdg.md/feed/` (similar, `zdg.md` fără `www.` redirectează 301, verificat 2026-08-11; există și `zdg.md/en/feed/` pentru varianta engleză). Prioritizează explicit pentru subiectul "corupție" — e singurul ziar investigativ din Moldova.

**Surse de verificat/folosit cu prudență**
- **stiri.md** — conținut foarte relevant (are teme dedicate deja "Diaspora" și "Alertă 112"), dar nu s-a găsit RSS vizibil în pagină. Verifică dacă are un endpoint separat înainte să renunți la ea ca sursă.
- **pulsmedia.md** — bun punctual pentru corupție/infracțiuni/investigații, dar ton tabloid (conținut marcat 18+ pe unele articole). Fără RSS confirmat. Dacă se include, se aplică pragul de calitate din 3.3 STRICT — conținutul senzaționalist nu trece doar pentru că "e popular".

**Filtru de credibilitate** (de aplicat la alegerea/ponderea surselor, nu doar traficul brut — vezi ponderea pe tier în 3.3), conform clasamentului CJI (Centrul pentru Jurnalism Independent) Media Radar:
- Cele mai credibile: Nokta.md, Agora.md, Moldova1.md, Zdg.md, Newsmaker.md, Ipn.md
- De evitat ca surse: Paranteze.md, Breakingnews.md, Md.kp.media

**Alte categorii de surse (neschimbate)**
- **Local/regional**: RSS-uri ale site-urilor regionale din Moldova (dacă au), sau Google News RSS filtrat pe numele fiecărui raion: `https://news.google.com/rss/search?q=Drochia&hl=ro-MD`
- **Internațional important**: agregatoare gen GDELT Project (gratuit, orientat evenimente globale) sau NewsAPI.org (plan plătit pentru volum) filtrat pe termeni relevanți (Ucraina, UE, Rusia — relevant pentru cititorul moldovean)
- **Diaspora**: Google News RSS cu combinații `moldoveni + Italia`, `moldoveni + Franța`, `moldoveni + Germania` etc., plus RSS-urile publicațiilor diasporei dacă există

**Condiție de atribuire pentru sursele descoperite prin yam.md** (vezi și 3.5): yam.md e doar canalul de descoperire, nu sursa faptică. Atribuirea din articolul generat trebuie să meargă spre sursa originală afișată de yam.md pentru fiecare știre (ex. "potrivit ZdG", nu "potrivit yam.md").

Toate sursele **trebuie verificate legal**: majoritatea site-urilor de presă permit RSS pentru citire, dar nu neapărat republicare automată — verifică `robots.txt` și termenii fiecărei surse.

### 3.2 Deduplicare & scoring de popularitate
- Hash pe titlu normalizat (fără diacritice/majuscule) + comparație prin similaritate de embeddings pentru a nu genera 2 articole pe aceeași știre din surse diferite
- **Semnal de popularitate** = numărul de surse independente care raportează aceeași știre în fereastra de 2h (proxy solid pentru "ce e important acum", fără nevoie de API-uri scumpe de social listening). Gruparea nativă de subiecte a yam.md ("N știri similare") se folosește ca semnal suplimentar aici, nu ca înlocuitor al deduplicării proprii — sursele nu vin doar din yam.md.
- Scor secundar: recență + prezența în categoria "trending" pe Google News

### 3.3 Selecție finală: prag de calitate, nu cotă fixă (decizie finală)

**Regula de bază**: un candidat se publică dacă *depășește un scor minim de calitate*, nu pentru că trebuie completat un număr fix de articole per rulare. Consecință directă și intenționată: dacă într-o rulare sunt 10 evenimente distincte peste prag, se publică 10; dacă în alta nu e niciunul, nu se publică nimic. Zero conținut de umplutură generat "ca să fie ceva nou".

**Scorul de calitate e o combinație, nu doar numărul de surse**, ca să nu iasă favorizate artificial doar știrile cu cele mai multe reluări identice:

| Componentă | Ce măsoară | Sursă |
|---|---|---|
| Popularitate cross-sursă | câte surse independente raportează același eveniment | din pasul de deduplicare/grupare (3.2), inclusiv contorul nativ yam.md |
| Recență | cât de proaspăt e evenimentul | timestamp din feed |
| Bogăția informației factuale | are cifre, nume, locație clară, sau e doar un titlu vag? | evaluat de LLM-ul de clasificare, ca scor suplimentar cerut explicit în prompt, nu doar eticheta de categorie |
| Încrederea clasificării | e o știre confirmată sau o speculație/sursă unică nesigură? | tot din LLM-ul de clasificare, ca scor de încredere |
| **Credibilitatea sursei** | tier-ul sursei originale (nu al yam.md ca și canal), conform clasamentului CJI Media Radar din 3.1 | pondere, nu filtru on/off: tier de încredere (Nokta/Agora/Moldova1/Zdg/Newsmaker/Ipn) crește scorul; surse de evitat (Paranteze/Breakingnews/Md.kp.media) scad scorul sau exclud candidatul, fără să blocheze automat restul sursei de descoperire (yam.md) |

Aceste cinci semnale se combină într-un singur scor numeric (ex. 0-100). **Același scor servește la două lucruri**: (a) pragul minim de publicare, (b) ordonarea candidaților atunci când sunt mai mulți decât plafonul de siguranță.

**Plafonul de siguranță (din discuția anterioară) devine acum un plafon calitativ, nu arbitrar**: dacă într-o secțiune calific mai mulți candidați decât plafonul (ex. 8 peste prag, plafon 5), **nu se aleg primii 5 cronologic — se păstrează cei 5 cu scorul de calitate cel mai mare**, iar restul se exclud explicit din rularea asta. Cei excluși nu sunt reprogramați pentru rularea următoare — dacă evenimentul rămâne relevant, va reapărea organic (scorul de popularitate crește pe măsură ce mai multe surse îl preiau) și va trece pragul atunci.

**Important**: pragul minim e independent per secțiune. E normal ca regiuni să aibă 4 articole într-o rulare și 0 în alta, în timp ce internațional aproape mereu are ceva — nu se forțează echilibru artificial între secțiuni doar ca să pară "simetric".

### 3.4 Clasificare automată pe categorii
Trimite titlul + rezumatul brut către un LLM cu un prompt de clasificare strict (4 etichete + subcategorie oraș/țară). Nu te baza doar pe cuvinte cheie — un LLM face distincția mult mai bine între "știre despre Moldova în presa internațională" vs. "știre internațională" propriu-zisă.

### 3.5 Generare articol unic — strategie de prompt
Reguli obligatorii de dat modelului:
1. Rescrie complet — nicio propoziție nu trebuie să semene structural cu sursa
2. Structură: titlu (max 60 caractere, cuvânt cheie la început), lead de 2-3 propoziții, corp cu subtitluri H2/H3, un paragraf de context, concluzie
3. Fără citate directe lungi din sursă (parafrazare, nu copiere)
4. Menționează sursa faptică generic ("potrivit autorităților", "conform presei locale") — nu reproduce formulările. Când știrea a fost descoperită prin yam.md, atribuirea merge spre sursa originală afișată de yam.md (ex. "potrivit ZdG"), niciodată spre yam.md — e doar canalul de descoperire, nu sursa faptică (vezi 3.1)
5. Ieșire structurată (JSON): `titlu`, `slug`, `meta_description` (150-160 car.), `lead`, `corp_html`, `categorie`, `tag-uri`, `alt_text_imagine`

### 3.6 Imagine simbol
- **Recomandat**: generare AI (evită complet problema drepturilor de autor)
- Alternativ: imagini cu licență liberă via API Unsplash/Pexels, cu atribuire automată în footer articol
- **Niciodată**: descărcarea imaginii direct de pe site-ul sursă

### 3.7 SEO — checklist integrat în pipeline
- Titlu: cuvânt cheie principal în primele 60 caractere
- Meta description: 150-160 caractere, cu chemare la acțiune implicită
- Structură H2/H3 logică, nu doar text continuu
- `alt` text descriptiv pe imagine (generat de AI odată cu articolul)
- Slug curat (fără stopwords inutile)
- Schema.org `NewsArticle` (JSON-LD) inserat automat — crucial pentru Google News / Discover
- Linkuri interne automate către articole similare (dacă folosești un plugin ca AI Content Autopilot, are asta nativ; altfel se implementează cu scoring pe suprapunere de cuvinte cheie)

### 3.8 Publicare & cron fiabil — varianta cea mai economică (decizie finală)
- **Nu te baza pe WP-Cron implicit** (rulează doar la vizite pe site, deci nesigur pentru "la fiecare 2 ore" pe un site cu trafic variabil)
- **Fereastră activă: 6:00-22:00, pauză 22:00-6:00** — 9 rulări/zi în loc de 12, taie ~25% din costul de AI din secțiunea 5
- **Precizia pe minut nu contează** → nu mai are rost verificarea internă de fus orar. Mergem direct pe **GitHub Actions (gratuit)**, cu 9 orare fixe în UTC, acceptând un derapaj de max. o oră față de ora Chișinăului de două ori pe an (la schimbarea orei) — irelevant aici.
- **Vercel rămâne pe planul Hobby (gratuit)** — nu mai e nevoie de Vercel Pro doar pentru cron, deci **-20 USD/lună** față de varianta cu Vercel Cron orar.
- Workflow GitHub Actions (`.github/workflows/pipeline.yml`):
```yaml
name: Pipeline stiri
on:
  schedule:
    - cron: '0 3 * * *'   # 06:00 Chisinau (vara)
    - cron: '0 5 * * *'   # 08:00
    - cron: '0 7 * * *'   # 10:00
    - cron: '0 9 * * *'   # 12:00
    - cron: '0 11 * * *'  # 14:00
    - cron: '0 13 * * *'  # 16:00
    - cron: '0 15 * * *'  # 18:00
    - cron: '0 17 * * *'  # 20:00
    - cron: '0 19 * * *'  # 22:00
  workflow_dispatch: {}   # rulare manuală, utilă la testare cu Claude Code
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Apeleaza endpoint-ul de pipeline
        run: |
          curl -f -X POST https://<domeniul-tau>/api/pipeline/run \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```
- `CRON_SECRET` se ține ca secret în GitHub (Settings → Secrets), nu în cod — endpoint-ul `/api/pipeline/run` verifică acest header și respinge orice cerere fără el, ca să nu poată nimeni din exterior să declanșeze pipeline-ul pe banii tăi de API.
- Folosește biblioteca **Action Scheduler** (aceeași folosită de WooCommerce) pentru robustețe la procesare — reia automat task-urile eșuate
- **Recomandare editorială**: primele 2-4 săptămâni publică ca **draft**, nu live — verifici manual calitatea și acuratețea faptică înainte să activezi auto-publish. Modelele AI pot "haluciona" detalii, iar pe știri (mai ales accidente/crime, cum are site-ul tău mult) o eroare factuală e gravă.

---

## 4. Stack tehnic recomandat (varianta B)

| Componentă | Recomandare |
|---|---|
| Limbaj plugin | PHP (nativ WordPress) |
| Task scheduling | Action Scheduler + cron real de server |
| Parsare RSS | SimplePie (deja inclus în WP core) |
| Generare text | API LLM (ex. Claude API) cu prompt structurat + output JSON |
| Generare imagine | API de generare imagine (fal.ai, sau alt provider) |
| Deduplicare | hash text + comparație embeddings (poate fi tot via același API LLM) |
| Publicare | `wp_insert_post()` intern (dacă rulează ca plugin pe același WP) |
| Verificare calitate | pas manual de review (draft) primele săptămâni, apoi eșantion aleator ulterior |

---

## 5. Cost per articol și estimare lunară (verificat, august 2026)

**Prețuri API curente** (per milion tokeni, USD):
| Model | Rol în pipeline | Input | Output |
|---|---|---|---|
| Claude Haiku 4.5 | clasificare pe categorii (volum mare, task simplu) | $1 | $5 |
| Claude Sonnet 5 | generare articol (calitate scris) | $2 *(introductiv, până la 31 aug 2026 — apoi revine la $3/$15)* | $10 *(→ $15 din 1 sep 2026)* |

**Cost per articol publicat** (estimare pe baza volumului tipic de tokeni):
- Clasificare (Haiku, ~5 candidați evaluați per articol publicat final): ~450 tokeni input + 50 output → **~0.03-0.04 cenți** per candidat, ~0.2-0.4 cenți per articol publicat
- Generare articol (Sonnet 5, ~1200 tokeni input + ~1200 output — titlu, lead, corp, meta SEO): **~1.4 cenți** la preț introductiv, **~2.2 cenți** după 1 septembrie 2026
- Imagine simbol (FLUX Schnell/Pro via fal.ai, cel mai practic raport preț/calitate): **~1-5 cenți** per imagine, în funcție de model/rezoluție

**Total per articol publicat: aproximativ 2,5 – 8 cenți USD** (text + clasificare + imagine), în funcție de modelul de imagine ales.

**Estimare lunară**, la un volum realist de 15-25 articole/zi (450-750/lună):
- Text + clasificare (Sonnet 5 + Haiku 4.5): **~10-20 USD/lună**
- Imagini (fal.ai, FLUX): **~5-25 USD/lună** în funcție de model
- Surse de știri: gratuit (Google News RSS, GDELT) → până la ~50 USD/lună dacă alegi NewsAPI.org plătit pentru internațional
- **Total realist: 15-45 USD/lună**, plus opțional surse plătite

**Doi factori care schimbă calculul, de reținut:**
1. **Sonnet 5 e la preț introductiv până la 31 august 2026** — după această dată, costul de generare crește cu ~50% ($2/$10 → $3/$15). Bugetul de mai sus e calculat cu ambele scenarii.
2. **Prompt caching** (Anthropic) reduce costul instrucțiunilor reutilizate (schema JSON, ghidul editorial — aceleași la fiecare apel) cu până la 90% pe partea de input la apelurile repetate — merită activat din prima, reduce factura de generare cu 20-35% la volumul tău. Batch API (reducere 50%) nu se potrivește aici — introduce întârziere fără garanție sub 24h, incompatibilă cu ciclul de 2 ore.
- **Total estimat MVP: 20-80 USD/lună**, scalabil cu volumul de articole

---

## 6. Roadmap propus

1. **Săptămâna 1**: creezi categoria diaspora, aduni lista de surse RSS/Google News per categorie, configurezi cron real
2. **Săptămâna 2**: construiești pipeline-ul de bază — fetch, dedup, scoring, clasificare (fără generare AI încă, doar draft-uri cu titlul original + link sursă, ca să validezi selecția de știri)
3. **Săptămâna 3**: integrezi generarea AI de text + imagine, publicare ca draft
4. **Săptămâna 4**: revizuiești manual 2 săptămâni de draft-uri, calibrezi promptul, apoi activezi auto-publish pentru categoriile cu calitate constantă (poți lăsa "criminal"/"accidente" pe review manual mai mult timp, dată fiind sensibilitatea)

---

## 7. Riscuri de ținut minte

- **Halucinații factuale** — mai ales pe nume, cifre, locații exacte; verificare umană esențială la lansare
- **Drept de autor pe formulare și imagini** — vezi secțiunea legală de mai sus
- **Calitate editorială la scară** — un site 100% automatizat pierde încrederea cititorilor dacă se observă tipare repetitive; păstrează un om în buclă pentru cazurile sensibile (crime, accidente, victime)
- **Dependență de o singură sursă de "populare"** — dacă te bazezi doar pe Google News, ratezi conversații reale din social media locală; merită completat manual periodic
