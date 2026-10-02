# Checklist lansare — stiriactuale.info pe Vercel

**Lansat 2026-10-01, ~18:00 Chișinău** (A @ → 216.150.1.1, www → CNAME Vercel).

Nimic din lista asta nu se face înainte de plata Vercel Pro (decizia proprietarului).
Ordinea contează: emailul și pozele se rezolvă ÎNAINTE de mutarea DNS.

## 1. Conturi și chei (proprietarul)

- [x] Vercel Pro plătit
- [ ] Vercel → Settings → Spend Management: notificare la ~5$
- [x] Vercel → Storage → Blob creat; `BLOB_READ_WRITE_TOKEN` copiat
- [x] `claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN`
- [x] Cheie API Magnific → `MAGNIFIC_API_KEY`
- [ ] Usage credits Claude: rămân OFF
- [ ] Chei vechi revocate: Anthropic API (console.anthropic.com), fal.ai

## 2. Variabile de mediu

| Variabilă | Vercel | GitHub Secrets | Notă |
|---|---|---|---|
| `DATABASE_URL` | da | da | Neon |
| `CLAUDE_CODE_OAUTH_TOKEN` | — | da | pipeline-ul rulează în GitHub Actions |
| `MAGNIFIC_API_KEY` | da | da | admin (înlocuire foto) + pipeline |
| `BLOB_READ_WRITE_TOKEN` | da | da | |
| `ADMIN_PASSWORD` | da | — | parolă lungă, unică |
| `CRON_SECRET` | da | — | colectarea RSS la 30 min |
| `TELEGRAM_BOT_TOKEN` | da | da | bot @sa_md_adminbot |
| `TELEGRAM_ADMIN_CHAT_ID` | da | da | chat privat editor |
| `TELEGRAM_CHANNEL_ID` | da | da | `-1001082195144` (Reporter News). Golit intenționat în `.env.local` până la lansare — altfel testele locale ar posta în canalul public |
| `FACEBOOK_PAGE_ID` | da | da | id-ul paginii „Știri Actuale” — gol local, ca testele să nu posteze pe pagină |
| `FACEBOOK_PAGE_TOKEN` | da | da | token de pagină fără expirare (pages_manage_posts) din aplicația Meta |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | da | da | notificări push; aceeași valoare ca în `.env.local` |
| `VAPID_PRIVATE_KEY` | da | da | NU se schimbă după lansare — altfel toți abonații se pierd |
| `GITHUB_DISPATCH_TOKEN` | da | — | token fine-grained, doar repo-ul stiriactuale, „Actions: Read and write” — cron-ul Vercel pornește pipeline-ul exact la oră (GitHub schedule întârzie cu ore) |

De șters din Vercel: `ANTHROPIC_API_KEY`, `FAL_KEY` (nu se mai folosesc; cheia API Anthropic ar avea prioritate și s-ar factura).

## 3. Înainte de mutarea DNS

- [x] `npm run migrate:upload-images` — urcă cele 615 poze/clipuri ale arhivei (223 MB) în Blob și rescrie URL-urile în baza de date
- [x] scos `stiriactuale.info/wp-content/uploads` din `next.config.ts` (images.remotePatterns)
- [x] **Email (cu o zi înainte), în DNS TopHost** — altfel `contact@stiriactuale.info` se oprește la mutare:
  - `mail` și `ftp`: din CNAME în `A 195.178.106.95` (făcut 2026-10-01)
  - modifică `MX  @` → `mail.stiriactuale.info` (prioritate 0)
  - modifică SPF `TXT  @` → `v=spf1 ip4:195.178.106.95 ip4:195.178.106.195 ~all`
  - găzduirea TopHost rămâne activă cât emailul e acolo
- [x] TTL pentru `A @` și `www` coborât la 300 s (revenire rapidă la WordPress dacă e nevoie)
- [ ] `npm run migrate:export-content` + `migrate:import` din nou, dacă pe WordPress s-a mai publicat ceva între timp

## 4. Lansare

- [x] push pe GitHub, deploy Vercel, domeniul adăugat în proiect
- [x] DNS TopHost: `A @` → IP-ul afișat de Vercel, `CNAME www` → valoarea afișată de Vercel (restul neatins)
- [ ] AdSense → Privacy & messaging: mesaj GDPR activ
- [ ] Search Console: sitemap `https://stiriactuale.info/sitemap.xml` retrimis (proprietatea rămâne aceeași — tag-ul de verificare e în layout)
- [x] verificat câteva URL-uri vechi (301) și `/feed/`
- [x] GitHub Actions → workflow „Pipeline stiri” activ; prima rulare manuală urmărită
