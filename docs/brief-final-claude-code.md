# Brief de pornire — redesign stiriactuale.info
### Document de referință pentru Claude Code. Citește și celelalte trei:
- `plan-implementare-agregator-stiri-ai.md` — pipeline de agregare/generare AI (surse, scoring, prompt, cost)
- `arhitectura-site-nou-taxonomie-pwa-seo.md` — taxonomie, URL-uri, PWA, checklist SEO, AdSense
- `sistem-design-ui.md` — paletă de culori, tipografie, componente, pattern-uri de pagină

---

## Decizii finale (blocate — nu se renegociază fără motiv explicit)

1. **Stack**: Next.js (App Router) + TypeScript + Tailwind. Deploy pe Vercel (sau host Node echivalent) cu Cron Jobs native pentru pipeline-ul de 2 ore.
2. **Taxonomie URL**: secțiunea (regiuni/național/internațional/diaspora) e structura canonică; subiectul (sport, corupție, accidente etc.) e etichetă + pagină hub `/subiect/{topic}/`. Detalii complete în `arhitectura-site-nou-taxonomie-pwa-seo.md`, secțiunea 3.
3. **Migrare**: **fiecare articol vechi primește redirect 301 individual** către noul URL. Nu se renunță la niciun articol din arhivă.
4. **Notificări push**: **excluse din v1**. Se lasă loc în arhitectură (manifest + service worker pregătite), dar nu se implementează acum. Revizitat într-o fază ulterioară.
5. **PWA**: manifest instalabil + service worker cu strategie network-first pe conținut, cache-first pe shell. Fără push în v1.
6. **Construcție efectivă**: în Claude Code, pe repo real, de acum înainte. Acest chat rămâne document de referință/spec, nu locul de build susținut.
7. **Design UI**: paletă, tipografie și pattern-uri de componente blocate — detalii complete în `sistem-design-ui.md`. Nu se improvizează o identitate vizuală nouă în Claude Code.
8. **AdSense**: contul e deja aprobat pe domeniul stiriactuale.info de mult timp — nu necesită re-aplicare. Scriptul + `ads.txt` trebuie totuși reintegrate identic în codul nou (Next.js), cu grijă la continuitate în timpul migrării — detalii în `arhitectura-site-nou-taxonomie-pwa-seo.md`, secțiunea 8.

---

## Implicație tehnică critică: scala migrării

"Redirect individual pentru fiecare articol" schimbă abordarea față de un site mic:

- **Nu** pune sute/mii de intrări în array-ul `redirects()` din `next.config.js` — încetinește build-ul și devine imposibil de citit/întreținut.
- **Corect**: tabel de mapare `old_slug → new_url` (JSON la început, migrat spre o tabelă de bază de date când crește), verificat într-un **middleware** care face `NextResponse.redirect(newUrl, 301)` la runtime, înainte de randare.
- Ordinea de lucru pentru migrare:
  1. Export complet din WP — toate articolele, nu doar cele recente (WP REST API: `/wp-json/wp/v2/posts?per_page=100&page=N`, paginat până la capăt; sau export XML din admin WP)
  2. Pentru fiecare articol vechi: identifică categoriile WP originale (unele sunt localități — "Stiri Drochia" —, altele sunt subiecte — "Criminal", "Economic" —, altele sunt naționale — "Stiri Moldova")
  3. Script de mapare: categorie localitate → secțiune `regiuni/{oras}`; categorie subiect → tag `subiect/{topic}`; determină secțiunea primară a articolului (regulă: dacă are categorie de oraș → regiuni; altfel dacă are Stiri Moldova/Romania fără oraș → național; Stiri Externe → internațional)
  4. Generează tabelul final `old_slug → new_url` + noul slug (poate fi păstrat identic, doar cu prefix de secțiune nou)
  5. Verificare: fiecare URL vechi indexat în Google Search Console trebuie să aibă un rând în tabel — fără excepție

---

## Ordinea recomandată de lucru în Claude Code

1. Scaffold Next.js (structură de rute conform taxonomiei din `arhitectura-site-nou-taxonomie-pwa-seo.md`) + configurare Tailwind cu tokenii din `sistem-design-ui.md`
2. Script de export + mapare WP → tabel de redirect-uri (subiectul cel mai riscant, se face primul, cât timp arhiva veche e încă disponibilă)
3. Middleware de redirect 301 pe baza tabelului
4. Componente + pagini (articol, secțiune, hub subiect) cu SEO complet (`generateMetadata`, JSON-LD `NewsArticle` + `BreadcrumbList`, sitemap, robots) — pe baza pattern-urilor din `sistem-design-ui.md`
5. Manifest PWA + service worker (fără push)
6. Reintegrare AdSense (script + `ads.txt`, testat pe preview înainte de a comuta domeniul live — vezi secțiunea 8 din `arhitectura-site-nou-taxonomie-pwa-seo.md`)
7. Pipeline de agregare/generare AI (conform `plan-implementare-agregator-stiri-ai.md`) — ultimul, pentru că site-ul trebuie să existe funcțional înainte să aibă sens automatizarea de conținut
8. Configurare Cron Jobs în producție pentru pipeline (2 ore)

---

## Pentru pornirea în Claude Code

Instalezi Claude Code (pachet npm `@anthropic-ai/claude-code`, sau prin aplicația desktop Claude), deschizi un folder nou de proiect, și îi dai acest fișier plus celelalte două ca prim context — apoi îi ceri să înceapă cu pasul 1 din ordinea de mai sus. Pentru detalii exacte de instalare, verifică documentația curentă: https://docs.claude.com/en/docs/claude-code/overview
