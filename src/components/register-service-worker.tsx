"use client";

import { useEffect } from "react";

// Înregistrare best-effort — dacă eșuează (browser fără suport etc.), site-ul
// funcționează normal, fără PWA/offline. DOAR în producție: în dezvoltare
// URL-urile /_next/static nu au hash, iar cache-first ar servi CSS/JS vechi
// după fiecare modificare — acolo SW-ul existent se dezinstalează.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  }, []);

  return null;
}
