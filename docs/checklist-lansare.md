# Checklist lansare — stiriactuale.info pe Vercel

Nimic din lista asta nu se face înainte de plata Vercel Pro (decizia proprietarului).
Ordinea contează: emailul și pozele se rezolvă ÎNAINTE de mutarea DNS.

## 1. Conturi și chei (proprietarul)

- [ ] Vercel Pro plătit
- [ ] Vercel → Settings → Spend Management: notificare la ~5$
- [ ] Vercel → Storage → Blob creat; `BLOB_READ_WRITE_TOKEN` copiat
- [ ] `claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN`
- [ ] Cheie API Magnific → `MAGNIFIC_API_KEY`
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
| `TELEGRAM_CHANNEL_ID` | da | — | canalul Reporter News |

De șters din Vercel: `ANTHROPIC_API_KEY`, `FAL_KEY` (nu se mai folosesc; cheia API Anthropic ar avea prioritate și s-ar factura).

## 3. Înainte de mutarea DNS

- [ ] `npm run migrate:upload-images` — urcă cele 615 poze/clipuri ale arhivei (223 MB) în Blob și rescrie URL-urile în baza de date
- [ ] scos `stiriactuale.info/wp-content/uploads` din `next.config.ts` (images.remotePatterns)
- [ ] **Email:** MX-ul domeniului arată acum spre serverul WordPress (`stiriactuale.info`). La mutarea pe Vercel emailul `contact@stiriactuale.info` se oprește dacă MX-ul nu e mutat explicit pe furnizorul de email (ex. serverul de mail al găzduirii actuale prin hostname propriu, sau alt serviciu)
- [ ] `npm run migrate:export-content` + `migrate:import` din nou, dacă pe WordPress s-a mai publicat ceva între timp

## 4. Lansare

- [ ] push pe GitHub, deploy Vercel, domeniul adăugat în proiect
- [ ] DNS mutat pe Vercel
- [ ] AdSense → Privacy & messaging: mesaj GDPR activ
- [ ] Search Console: sitemap `https://stiriactuale.info/sitemap.xml` retrimis (proprietatea rămâne aceeași — tag-ul de verificare e în layout)
- [ ] verificat câteva URL-uri vechi (301) și `/feed/`
- [ ] GitHub Actions → workflow „Pipeline stiri” activ; prima rulare manuală urmărită
