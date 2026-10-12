# Mutarea site-ului pe Cloudflare Workers

Ramura `cf-migration`. Codul merge în continuare și pe Vercel (Node): fiecare diferență
de platformă e aleasă la rulare (contextul Cloudflare prezent sau nu). Revenirea pe Vercel
înseamnă doar DNS + cron-uri (secțiunea 6).

## 1. Ce s-a schimbat în cod

| Ce | Vercel / Node | Cloudflare Workers |
|---|---|---|
| Conținut din `content/` (ghiduri, rețete, locuri, calendar, istorie, calculatoare) | citit de pe disc | copiat la build în assets sub `/_continut/` (`scripts/cloudflare/content-assets.ts`), citit prin binding-ul `ASSETS`; cererile directe la `/_continut/` primesc 404 |
| Baza de date | postgres.js (pool TCP) | Neon prin HTTP (`@neondatabase/serverless`) |
| Cache ISR / `revalidatePath` | cache-ul Vercel | R2 + cache regional + tag cache pe Durable Objects + coadă pe Durable Objects (`open-next.config.ts`) |
| Cron-uri | `vercel.json` | Cron Triggers (`wrangler.jsonc`) + handler `scheduled` (`cloudflare/worker.ts`), care cheamă aceleași rute `/api/cron/*` cu `Authorization: Bearer CRON_SECRET` |
| `next/image` | optimizarea Vercel | Cloudflare Images (binding `IMAGES`); fără binding, imaginile se servesc neoptimizate |
| Web Push | web-push | web-push doar pentru criptare + semnătura VAPID, trimiterea prin `fetch` (pe ambele) |
| Imaginile încărcate | Vercel Blob | tot Vercel Blob; în build-ul Cloudflare `undici` (folosit de `@vercel/blob`) e înlocuit cu `fetch`-ul nativ (`next.config.ts`, `BUILD_TARGET=cloudflare`), fiindcă undici compilează WebAssembly, interzis pe Workers. Mutarea în R2 e un pas opțional, separat |

Comenzi: `npm run cf:build` (build Next + OpenNext + conținutul în assets), `npm run cf:preview`
(local, cu binding-urile emulate), `npm run cf:deploy` (populează cache-ul R2 și publică).

**Atenție la build-ul local:** OpenNext include în worker valorile din `.env`, `.env.local`,
`.env.production` găsite în dosar. Un build pentru producție se face DOAR din GitHub Actions
(`.github/workflows/cloudflare-deploy.yml`), unde nu există `.env.local`.

## 2. Contul Cloudflare — de făcut o singură dată

1. **Plan Workers Paid** (5 $/lună): worker-ul are ~4 MB comprimat, peste limita de 3 MB a
   planului gratuit; tot planul plătit dă 30 s CPU pe cerere și Durable Objects cu SQLite.
2. **R2**: Dashboard → R2 → activează (cere card, are nivel gratuit), apoi creează bucket-ul
   `stiriactuale-cache` (sau `npx wrangler r2 bucket create stiriactuale-cache`).
3. **Durable Objects**: nimic de creat manual — clasele `DOQueueHandler`, `DOShardedTagCache`,
   `BucketCachePurge` se creează la primul deploy (migrarea `v1` din `wrangler.jsonc`).
4. **Images**: Dashboard → Images → activează transformările (planul gratuit are 5.000
   transformări unice/lună; peste, 0,50 $ / 1.000). Binding-ul `IMAGES` din `wrangler.jsonc` e
   suficient — nu trebuie zonă sau domeniu.
5. **Token API** pentru GitHub Actions: My Profile → API Tokens → „Edit Cloudflare Workers”
   (include Workers Scripts, Workers R2 Storage, Account Settings read). Pentru purge
   (opțional, pasul 7): un al doilea token, doar „Zone → Cache Purge” pe zona stiriactuale.info.
6. **Secrete în GitHub** (repo → Settings → Secrets → Actions): `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL` (există deja pentru pipeline),
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (dacă e setat pe Vercel).
7. **Secretele worker-ului** (o singură dată, din terminal cu `npx wrangler login`, sau din
   Dashboard → Workers → stiriactuale → Settings → Variables and Secrets), aceleași valori ca
   pe Vercel:

   ```
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put TELEGRAM_BOT_TOKEN        # și cheia /api/revalidate/ derivă din el
   npx wrangler secret put TELEGRAM_CHANNEL_ID
   npx wrangler secret put TELEGRAM_ADMIN_CHAT_ID
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put CRON_SECRET
   npx wrangler secret put NEXT_PUBLIC_VAPID_PUBLIC_KEY
   npx wrangler secret put VAPID_PRIVATE_KEY
   npx wrangler secret put BLOB_READ_WRITE_TOKEN
   npx wrangler secret put MAGNIFIC_API_KEY
   npx wrangler secret put GITHUB_DISPATCH_TOKEN
   npx wrangler secret put FACEBOOK_PAGE_TOKEN
   npx wrangler secret put FACEBOOK_PAGE_ID
   npx wrangler secret put NEXT_PUBLIC_ADSENSE_CLIENT_ID   # dacă există
   # opțional, purge-ul cache-ului regional după revalidare (fără ele rămâne oprit):
   npx wrangler secret put CACHE_PURGE_ZONE_ID
   npx wrangler secret put CACHE_PURGE_API_TOKEN
   ```

   Primul `wrangler secret put` înainte de primul deploy creează worker-ul gol — e în regulă.
   Lista exactă a variabilelor folosite de site: `grep -rhoE "process\.env\.[A-Z0-9_]+" src`.

## 3. Primul deploy (site-ul live rămâne pe Vercel)

1. GitHub → Actions → „Deploy Cloudflare Workers” → Run workflow, întâi cu `dry_run` bifat
   (doar build), apoi fără.
2. Worker-ul răspunde pe `https://stiriactuale.<subdomeniu>.workers.dev`. De verificat acolo:
   prima pagină, un articol, un ghid RO/RU, o rețetă, un calculator, `/ru/`, `/sitemap.xml`,
   `/feed/`, `/og/?t=Test`, `/admin/` (login), o poză de articol (`/_next/image`).
3. Cron-urile NU rulează încă: `CRONS_ENABLED` e `"0"` în `wrangler.jsonc` (altfel ar porni
   pipeline-ul și rezumatele Telegram a doua oară, pe lângă cele din Vercel).

## 4. Comutarea DNS

Domeniul are acum nameserverele la TopHost (`ns4.tophost.md`, `ns5.tophost.md`), site-ul pe
Vercel și **e-mailul pe serverul TopHost**. Un Worker pe domeniu propriu cere ca zona să fie
în Cloudflare, deci se mută nameserverele la Cloudflare, cu toate înregistrările de e-mail
copiate EXACT, pe „DNS only” (nor gri), nu prin proxy.

Înregistrările citite pe 2026-10-12 (`nslookup ... 8.8.8.8`) care TREBUIE să existe în
Cloudflare înainte de schimbarea nameserverelor:

| Nume | Tip | Valoare | Proxy |
|---|---|---|---|
| `stiriactuale.info` | MX (prioritate 0) | `mail.stiriactuale.info` | — |
| `mail` | A | `195.178.106.95` | DNS only |
| `webmail` | A | `195.178.106.95` | DNS only |
| `autodiscover` | A | `195.178.106.95` | DNS only |
| `autoconfig` | A | `195.178.106.95` | DNS only |
| `ftp` | A | `195.178.106.95` | DNS only |
| `cpanel` | A | `195.178.106.95` | DNS only |
| `stiriactuale.info` | TXT | `v=spf1 ip4:195.178.106.95 ip4:195.178.106.195 ~all` | — |
| `default._domainkey` | TXT | cheia DKIM `v=DKIM1; k=rsa; p=MIIBIjAN…` (copiată integral din panoul TopHost) | — |
| `stiriactuale.info` | TXT | `google-site-verification=jkrADUNstPNC-IyGn2__uRBqQTRP7aFBWdpHV52RlRg` | — |

Plus orice altceva din panoul DNS TopHost (`_dmarc`, `webdisk`, `cpcalendars`, `cpcontacts`,
`_cpanel-dcv…`, verificări Yandex/Facebook/Google News) — `nslookup` nu poate lista toată zona;
exportul complet se ia din panoul TopHost și se compară rând cu rând cu ce importă Cloudflare.
Înregistrările site-ului (`stiriactuale.info A 216.150.1.1`, `www CNAME …vercel-dns…`) NU se
copiază: le înlocuiește domeniul worker-ului.

Pași:
1. Cloudflare → Add a site → `stiriactuale.info` → planul Free pentru zonă e suficient.
   Cloudflare scanează înregistrările existente; se verifică cu tabelul de mai sus și se pun pe
   „DNS only” toate cele de e-mail/cPanel.
2. Cu o zi înainte: în TopHost, TTL mic (300 s) unde se poate.
3. Seara, cu trafic mic: la registrar (TopHost), nameserverele se schimbă cu cele două date de
   Cloudflare. Propagarea: de la minute la câteva ore; e-mailul merge pe tot parcursul dacă
   MX/A/SPF/DKIM sunt identice în ambele zone.
4. Când zona e „Active” în Cloudflare: Workers → stiriactuale → Settings → Domains & Routes →
   Add Custom Domain: `stiriactuale.info` și `www.stiriactuale.info` (redirect www → fără www
   rămâne cum era: Redirect Rule în Cloudflare dacă îl făcea Vercel).
5. SSL/TLS → mod „Full (strict)”. Nimic altceva în Cache Rules: HTML-ul îl cache-uiește worker-ul.
6. Cron-urile, în ordinea asta (să nu ruleze nici dublu, nici deloc):
   - Vercel → proiect → Settings → Cron Jobs → Disable (sau ramura de Vercel fără `crons`);
   - în `wrangler.jsonc` `"CRONS_ENABLED": "1"` + deploy (sau doar variabila din Dashboard).
7. Verificări după comutare: un e-mail trimis și primit la adresele de pe domeniu; Search
   Console (proprietatea rămâne validă prin TXT); `/api/revalidate/` după o rulare a
   pipeline-ului (logul din Actions); la 10:00 UTC logul cron-ului în Dashboard → Workers →
   Logs; o notificare push de test din `/admin`.
8. După 1–2 săptămâni stabile: domeniile scoase din proiectul Vercel (nu proiectul).

## 5. Pași opționali, mai târziu

- **Purge cache** (`CACHE_PURGE_ZONE_ID` + `CACHE_PURGE_API_TOKEN`): golește cache-ul regional
  imediat după `revalidatePath`. Nu e necesar pentru corectitudine (tag cache-ul e verificat la
  fiecare cerere); fără secrete rămâne oprit și doar loghează „Skipping cache purge”.
- **Plasarea worker-ului lângă bază** (`"placement": { "mode": "smart" }`): baza Neon e în
  us-east-2; paginile din cache nu ating baza, dar cele generate la cerere (căutare, admin,
  regenerări) fac interogări peste ocean. De activat doar dacă logurile arată timpi mari.
- **Vercel Blob → R2**: imaginile încărcate din admin și pozele de stoc copiate de pipeline
  rămân pe Vercel Blob (merge prin HTTP, se plătește separat la Vercel). Mutarea: un bucket R2
  public pe un subdomeniu (ex. `media.stiriactuale.info`), `put` înlocuit cu binding-ul R2 /
  API-ul S3 în `src/lib/pipeline/image.ts` și scripturile pipeline-ului, copierea fișierelor
  existente și rescrierea URL-urilor din bază (sau păstrarea vechilor URL-uri cât trăiește
  contul Vercel). `remotePatterns` din `next.config.ts` trebuie să includă noul domeniu.

## 6. Revenirea pe Vercel

Proiectul Vercel rămâne neatins până la sfârșitul perioadei de probă; codul din `cf-migration`
merge și acolo (pe Node folosește aceleași căi ca înainte).

1. Cloudflare → `CRONS_ENABLED` = `"0"` (sau ștergerea triggerelor din worker).
2. Vercel → Cron Jobs → Enable.
3. DNS (în Cloudflare, zona rămâne acolo): se scot Custom Domains din worker și se pun
   înapoi `stiriactuale.info A 216.150.1.1` și `www CNAME ddd15b7daac021bc.vercel-dns-017.com`
   (valorile actuale de la Vercel — de verificat în Vercel → Domains), pe „DNS only”.
   Propagare: TTL-ul înregistrărilor (minute), nu schimbare de nameservere.
4. Alternativ, revenire completă: nameserverele înapoi la TopHost (zona de acolo rămâne
   neschimbată dacă nu e ștearsă).
