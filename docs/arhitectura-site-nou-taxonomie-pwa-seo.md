# Arhitectură site nou — taxonomie, PWA, SEO, migrare de pe WordPress
### Document complementar la `plan-implementare-agregator-stiri-ai.md`

---

## 1. De ce renunțarea la WP/Bimber e decizia corectă

- Temă neîntreținută = risc real de securitate și incompatibilități la fiecare update al nucleului WordPress — nu doar "posibile probleme", ci o bombă cu ceas.
- WPBakery (page builder) generează HTML umflat, cu multe div-uri și inline styles — greu de dus la scoruri Performance/SEO mari în Lighthouse, indiferent cât de mult optimizezi.
- WordPress clasic randează fiecare pagină server-side la fiecare request (fără caching agresiv), ceea ce lovește direct în Core Web Vitals — unul din factorii de ranking Google.
- **Concluzie**: o aplicație nouă, separată, cu control total pe fiecare byte trimis către browser, e alegerea corectă pentru obiectivul "SEO aproape de 100 + PWA".

---

## 2. Stack recomandat

**Next.js (App Router) + TypeScript + Tailwind CSS**

De ce exact acesta și nu altceva:
- Randare hibridă SSG/ISR pentru articole → HTML deja generat, indexabil instant de Google, fără să aștepte JS
- Suport nativ pentru `generateMetadata()` (meta tags per pagină), `sitemap.ts`, `robots.ts`, date structurate (JSON-LD)
- Optimizare imagine nativă (`next/image` — AVIF/WebP automat, lazy loading, dimensiuni corecte)
- PWA: manifest + service worker, ori manual, ori cu o bibliotecă dedicată — control total pe strategia de cache
- Deploy simplu (Vercel sau orice host cu Node.js), cu suport nativ pentru joburi programate (Cron Jobs) — exact ce trebuie pentru pipeline-ul de generare la 2 ore

Am pornit deja un schelet Next.js în acest chat, ca punct de plecare — îl poți lua de-acolo indiferent unde continuăm construcția efectivă.

---

## 3. Taxonomia ta are două axe — trebuie tratată ca atare

Ai descris:
- **4 secțiuni** (scop geografic): Regiuni Moldova, Național, Internațional, Diaspora
- **10 subcategorii** (subiect): sport, cultură, social, economic, accidente, criminal, corupție, criză energetică, sănătate, alertă 112

Asta înseamnă că un articol nu aparține unei singure cutii, ci unei combinații (ex: "corupție" + "național", sau "accidente" + "regiuni Moldova" + raionul Drochia). Dacă bagi ambele axe în URL, riști conținut duplicat sau URL-uri instabile. Soluția standard, sigură din punct de vedere SEO:

**Secțiunea = structura canonică de URL. Subiectul = etichetă (tag) + pagină hub cross-secțiune.**

```
/regiuni/{raion}/{slug}/          → ex: /regiuni/drochia/accident-pe-dn5/
/national/{slug}/                 → ex: /national/noi-tarife-anre/
/international/{slug}/            → ex: /international/summit-ue-chisinau/
/diaspora/{tara}/{slug}/          → ex: /diaspora/italia/moldoveni-marsaluiesc-la-roma/

/subiect/{topic}/                 → pagină hub, listează articole din toate secțiunile
                                     ex: /subiect/coruptie/ — agregă din national, regiuni etc.
```

- Fiecare articol are **exact un URL canonic** (secțiune + eventual localitate/țară + slug) — niciodată doi URL diferiți cu același conținut.
- Paginile `/subiect/{topic}/` sunt liste (nu duplică textul articolelor), deci pot fi indexate liber și pot prinde căutări de tip "știri corupție Moldova" fără risc de conținut duplicat.
- Breadcrumb-ul (cu schema `BreadcrumbList`) reflectă secțiunea, nu subiectul: `Acasă > Regiuni > Drochia > Titlu articol`. Subiectul apare ca etichetă vizuală pe pagina articolului, nu în ierarhie.

---

## 4. PWA — ce înseamnă concret pentru acest site

- **`manifest.json`**: nume, icoane (192px, 512px, plus maskable), `theme_color`, `display: standalone` — astfel site-ul devine instalabil ("Adaugă pe ecranul principal") pe Android/iOS/desktop.
- **Service worker** cu strategii diferite pe tip de conținut — foarte important să nu greșești aici:
  - articole/listă de știri → **network-first** (mereu conținut proaspăt; fallback pe cache doar dacă nu ai net) — altfel riști să arăți știri vechi ca fiind curente
  - shell-ul aplicației (CSS, JS, iconițe) → **cache-first** (viteză)
- **Offline parțial**: ultimele N articole citite rămân disponibile fără conexiune — util concret pentru diaspora care citește pe drum/în tranzit.
- **Opțional, dar cu impact real pentru publicul tău**: notificări push pentru "breaking news" — diaspora moldovenească e exact segmentul care ar activa alerte despre ce se întâmplă acasă. Necesită Web Push API + un serviciu de trimitere (ex. OneSignal) sau implementare proprie.

---

## 8. Monetizare — Google AdSense (decizie confirmată)

Necesită implementare explicită — nu se suprapune automat:

1. **Contul e deja aprobat — nu se reaplică** (precizare importantă): stiriactuale.info e conectat la AdSense de mult timp, deci pasul de aprobare inițială (15-20 articole, review de site nou) nu se aplică. Ce se aplică în schimbă: **scriptul AdSense + `ads.txt` trebuie reintegrate identic în noul cod (Next.js)** — nu se transferă automat doar pentru că domeniul e deja aprobat. Vechea integrare trăia în WordPress/Bimber (plugin sau temă); codul nou pornește de la zero pe partea asta.
2. **Risc de continuitate la migrare, de evitat activ**: dacă `ads.txt` lipsește chiar și temporar de pe domeniul live în timpul trecerii de pe WP pe Next.js, sistemele automate AdSense pot semnala "ads.txt negăsit" și suspenda temporar servirea reclamelor pe cont. Testează scriptul + `ads.txt` pe un mediu de preview **înainte** de a comuta domeniul live pe noul site, ca să nu existe nicio fereastră fără ele.
3. **Integrare de bază**: script AdSense (același publisher ID de acum) o singură dată, în layout-ul global, via `next/script` cu `strategy="afterInteractive"` — plus `ads.txt` identic, în `public/`.
4. **Auto ads** (Google decide singur plasarea, după integrarea inițială) sau **unități manuale** (`<ins class="adsbygoogle">` plasat exact unde vrei, control mai bun pe layout).
5. **Capcană specifică Next.js**: navigarea client-side între articole nu reîmprospătează automat reclamele — necesită re-declanșare (`push({})`) la fiecare schimbare de rută, altfel reclama rămâne "înghețată" de la prima pagină încărcată.
6. **Relevant pe termen lung**: chiar cu contul deja aprobat, o scădere bruscă de calitate (conținut AI scalat, fără supraveghere) poate declanșa o re-evaluare și restricționarea reclamelor pe un cont existent, nu doar respingerea unuia nou. Perioada de draft/review manual din primele 2-4 săptămâni (stabilită în planul de pipeline) rămâne relevantă ca protecție a contului deja activ, nu doar ca poartă de intrare.

---

## 5. Ce înseamnă realist "SEO aproape de 100"

Important să separăm două lucruri diferite, ca să nu avem așteptări greșite:

- **Scorul tehnic (Lighthouse SEO) = 100 este perfect atingibil** și e pur mecanic: viewport corect, titluri unice per pagină, meta description unică, linkuri crawlabile (nu doar butoane JS), text alt la imagini, `robots.txt` valid, date structurate valide. Se face corect din prima, prin implementare disciplinată — nu ține de conținut sau timp.
- **Performance 90-100** cere disciplină reală: imagini optimizate automat, fonturi self-hosted cu preload, JavaScript minim livrat către client, randare statică unde se poate.
- **Poziția reală în Google (ranking)** e altă discuție — depinde de autoritate acumulată (backlinks), prospețimea și unicitatea conținutului, timpul de indexare. Tehnicul îți dă premisele corecte; nu garantează locul 1 din prima săptămână.

---

## 6. Migrarea — punctul cel mai riscant, de neignorat

- Structura actuală de URL pe stiriactuale.info e **plată**: `stiriactuale.info/titlu-articol/` (fără categorie în cale).
- Structura nouă propusă (`/national/slug/`, `/regiuni/drochia/slug/`) e diferită la nivel de format URL.
- **Dacă schimbi formatul URL-urilor fără redirect-uri 301 pentru fiecare articol vechi, pierzi tot backlink-ul și rankingul Google acumulat până acum.** Asta anulează practic beneficiul SEO al redesign-ului.

Pași necesari:
1. Export conținut vechi (WP REST API sau export XML) — titluri, categorii, date, URL-uri existente
2. Mapare automată: categorie veche → secțiune + subiect nouă (ex. "Stiri Drochia" → `/regiuni/drochia/`)
3. Generare fișier de redirect-uri 301 (la nivel de `next.config.js` sau la nivel de server/CDN) — un rând per articol vechi
4. Decizie de luat: migrăm conținutul vechi 1:1 (articolele rămân accesibile, doar cu URL nou) sau doar redirecționăm generic către secțiunea echivalentă, fără să păstrăm fiecare articol individual

---

## 7. Unde construim efectiv

- **Aici, în acest chat**: bun pentru scaffold inițial, prototip rapid, testare izolată a deciziilor de arhitectură — exact ce am făcut până acum.
- **Claude Code**: recomandat pentru construcția susținută — lucrează direct pe repo-ul tău real, persistă între sesiuni (nu se pierde la fiecare conversație nouă), poate rula scripturile de migrare pe exportul WP real, se integrează cu deploy-ul (Vercel CLI/GitHub Actions).
- **Important de clarificat**: nici acest chat, nici Claude Code nu "rulează" automatizarea de generare știri la fiecare 2 ore în producție — asta depinde strict de infrastructura de hosting (Vercel Cron Jobs / GitHub Actions programat / cron pe server), indiferent unde scriem codul. Claude Code scrie și întreține codul; infrastructura de producție îl execută.
