// Service worker PWA — strategii pe tip de conținut, vezi
// arhitectura-site-nou-taxonomie-pwa-seo.md secțiunea 4:
//   - shell-ul aplicației (CSS/JS/iconițe)      -> cache-first (viteză)
//   - pagini (articole, liste de știri)         -> network-first (mereu proaspăt;
//                                                   fallback pe cache doar offline)
//   - ultimele N articole citite                -> rămân disponibile offline
// Fără push în v1 — decizie finală, brief-final-claude-code.md punctul 4.

const VERSION = "v1";
const STATIC_CACHE = `stiriactuale-static-${VERSION}`;
const PAGES_CACHE = `stiriactuale-pages-${VERSION}`;
const ARTICLE_CACHE = `stiriactuale-articles-${VERSION}`;
const MAX_OFFLINE_ARTICLES = 20;

const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, ARTICLE_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

// Pagină de articol individual (nu hub de secțiune/subiect) — ex.
// /regiuni/{raion}/{slug}/, /national/{slug}/. Necesar ca să știm ce intră
// în bugetul de "ultimele N articole citite", separat de paginile de listă.
function isArticlePage(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  const [section] = segments;
  if (section === "regiuni" || section === "diaspora") return segments.length >= 3;
  if (section === "national" || section === "international") return segments.length >= 2;
  return false;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map((req) => cache.delete(req)));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, trimTo) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      if (trimTo) await trimCache(cacheName, trimTo);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  const isNavigation =
    request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
  if (!isNavigation) return;

  if (isArticlePage(url)) {
    event.respondWith(networkFirst(request, ARTICLE_CACHE, MAX_OFFLINE_ARTICLES));
  } else {
    event.respondWith(networkFirst(request, PAGES_CACHE));
  }
});
