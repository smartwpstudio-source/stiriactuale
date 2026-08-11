"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Auto ads scanează pagina o singură dată, la încărcare completă (scriptul de
// bază din layout face asta) — navigarea client-side din App Router nu
// redeclanșează automat scanarea, iar reclama rămâne "înghețată" de la prima
// pagină încărcată. Retrigger la fiecare schimbare de rută ULTERIOARĂ primei
// randări, cf. arhitectura-site-nou-taxonomie-pwa-seo.md secțiunea 8, punctul 5.
//
// Pushul de pe randarea inițială e omis intenționat: scriptul de bază a scanat
// deja pagina, iar un push suplimentar imediat produce eroarea AdSense
// "'ins' elements ... already have ads in them" fără niciun beneficiu.
export function AdsenseRouteRefresh() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense poate fi blocat (adblock) sau neîncărcat încă — nu blocăm site-ul
    }
  }, [pathname]);

  return null;
}
