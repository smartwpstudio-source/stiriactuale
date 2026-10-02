"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Bloc AdSense fix "In-article", în corpul articolului. Auto Ads plasează
// reclame doar la prima pagină încărcată; la navigarea în site (Next.js, fără
// reîncărcare) articolul următor rămânea fără. Blocul fix se cere la fiecare
// montare. push() funcționează și înainte de încărcarea scriptului (coadă).
export function AdSlot({ slot }: { slot: string }) {
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
    <div className="my-6">
      <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-wide text-sub">Publicitate</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
      />
    </div>
  );
}
