"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT_ID, ADSENSE_DISPLAY_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Bloc AdSense fix în corpul articolului. Auto Ads plasează reclame doar la prima
// pagină încărcată; la navigarea în site (Next.js, fără reîncărcare) articolul
// următor rămânea fără. Blocul fix se cere la fiecare montare. push() funcționează
// și înainte de încărcarea scriptului (coadă).
// Mereu blocul grafic responsiv „In text”: In-article (finalul textului) era vizibil doar
// 34% și aducea 0,20 $/1000 față de 58% și 0,27 $ (AdSense, 30 de zile la 2026-11-20).
export function AdSlot() {
  const pushed = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense blocat (adblock) sau slot deja completat — pagina merge oricum
    }
  }, []);

  // Fără anunț (unfilled): blocul gol se strânge doar cât nu e pe ecran. Strâns sub
  // ochii cititorului, ar muta textul (CLS — Search Console, 1.648 de adrese slabe
  // pe mobil, 2026-10-18); deasupra ecranului, browserul ține textul pe loc (scroll anchoring).
  useEffect(() => {
    const el = box.current;
    const ins = el?.querySelector("ins");
    if (!el || !ins) return;
    let io: IntersectionObserver | undefined;
    const check = () => {
      if (ins.dataset.adStatus !== "unfilled" || io) return;
      io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) {
          setHidden(true);
          io?.disconnect();
        }
      });
      io.observe(el);
    };
    const mo = new MutationObserver(check);
    mo.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    check();
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, []);

  return (
    // min-h rezervă locul anunțului ca textul să nu sară la încărcare (CLS)
    <div ref={box} className="ad-slot my-6 min-h-[300px] w-full" hidden={hidden}>
      <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-wide text-sub">Publicitate</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", textAlign: "center" }}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_DISPLAY_SLOT}
      />
    </div>
  );
}
