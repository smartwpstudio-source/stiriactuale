"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID, ADSENSE_DISPLAY_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Bloc AdSense fix "In-article", în corpul articolului. Auto Ads plasează
// reclame doar la prima pagină încărcată; la navigarea în site (Next.js, fără
// reîncărcare) articolul următor rămânea fără. Blocul fix se cere la fiecare
// montare. push() funcționează și înainte de încărcarea scriptului (coadă).
// display: blocul grafic responsiv „In text” în locul formatului In-article.
export function AdSlot({ slot, display = false }: { slot?: string; display?: boolean }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocat (adblock) sau slot deja completat — pagina merge oricum
    }
  }, []);

  return (
    // min-h rezervă locul anunțului ca textul să nu sară la încărcare (CLS);
    // dacă AdSense nu are anunț (unfilled), globals.css ascunde tot blocul.
    <div className="ad-slot my-6 min-h-[300px] w-full">
      <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-wide text-sub">Publicitate</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", textAlign: "center" }}
        data-ad-layout={display ? undefined : "in-article"}
        data-ad-format={display ? "auto" : "fluid"}
        data-full-width-responsive={display ? "true" : undefined}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={display ? ADSENSE_DISPLAY_SLOT : slot}
      />
    </div>
  );
}
