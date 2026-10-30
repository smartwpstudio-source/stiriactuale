import { absoluteUrl, SITE_URL } from "@/lib/seo";

// IndexNow (2026-10-30): adresele noi ajung la Bing, Yandex, Seznam, Naver și Yep în
// câteva minute, nu la următoarea trecere prin sitemap — api.indexnow.org le dă mai
// departe tuturor. Google nu folosește IndexNow: el ia știrile din news-sitemap.xml.
// Cheia e publică prin definiție: fișierul public/<cheie>.txt arată că site-ul e al nostru.
const KEY = "31ca899bf4a9b711fb5b51ec2c7bcc28";

export async function submitIndexNow(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList: paths.map(absoluteUrl) }),
    signal: AbortSignal.timeout(10_000),
  })
    .then((r) => r.ok || console.error(`IndexNow: HTTP ${r.status}`))
    .catch((err) => console.error(`IndexNow: ${err}`));
}
