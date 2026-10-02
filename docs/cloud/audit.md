# Brief: audit tehnic și SEO al stiriactuale.info (sesiune Claude Code în cloud)

Site de știri din Moldova, Next.js 16 (App Router, `src/app`), Tailwind v4, Postgres (Drizzle). **Citește întâi `AGENTS.md`** — Next.js 16 are API-uri diferite de ce știi; ghidurile sunt în `node_modules/next/dist/docs/` după `npm ci`.

## Ce faci

1. **Site-ul live** (https://stiriactuale.info): prima pagină, o secțiune, un raion, o țară, un articol, `/ghiduri/` și un ghid, `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt`, `/feed/`. Verifică:
   - linkuri interne rupte (404) și redirecturi în lanț;
   - `<title>` și meta description pe fiecare tip de pagină (lungime, unicitate, fără duplicate);
   - canonical, `og:*`, `twitter:*`, JSON-LD (NewsArticle, BreadcrumbList, FAQPage la ghiduri) — valid și complet;
   - `hreflang`/`lang`, headinguri (un singur `<h1>`), `alt` la imagini;
   - sitemap: toate URL-urile răspund 200, fără noindex în sitemap;
   - viteza: dimensiunea HTML/JS, imagini fără `width`/`height`, fonturi blocante.
2. **Codul**: aceleași probleme la sursă, plus accesibilitate de bază (contrast, butoane fără etichetă, focus vizibil).

## Ce livrezi

- **Un Pull Request** „Audit tehnic — reparații”, cu reparațiile sigure și mici (meta, JSON-LD, alt, linkuri, atribute de imagine). Fiecare commit = o problemă. Rulează `npm ci && npx next typegen && npx tsc --noEmit -p . && npm run lint` înainte de PR — totul verde.
- În descrierea PR-ului: **tabel cu toate problemele găsite** (gravitate, unde, reparată în PR sau doar semnalată) și, separat, recomandările care cer decizia editorului.

## Nu faci

- Nu schimbi designul, textele editoriale, pipeline-ul de știri (`src/lib/pipeline/`), schema bazei de date, autentificarea din `/admin`, variabilele de mediu sau dependențele.
- Nu faci commit pe `master`. Nu rulezi nimic ce scrie în baza de date (nu ai acces oricum).
