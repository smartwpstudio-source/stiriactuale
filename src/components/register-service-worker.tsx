"use client";

import { useEffect } from "react";

// Înregistrare best-effort — dacă eșuează (browser fără suport, mediu de dev
// fără HTTPS etc.), site-ul funcționează normal, fără PWA/offline.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
