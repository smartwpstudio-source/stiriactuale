"use client";

import { useEffect, useState } from "react";
import { ADSENSE_CLIENT_ID, ADSENSE_SIDE_SLOT } from "@/lib/adsense";

// Reclama verticală fixă din coloana laterală, doar pe ecrane late (≥1280 px):
// pe ecranele înguste coloana nu există, iar un <ins> ascuns dă eroare la AdSense,
// deci blocul se creează abia după ce știm lățimea ecranului.
export function SideAd() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1280px)").matches) return;
    setWide(true); // eslint-disable-line react-hooks/set-state-in-effect -- lățimea se află doar în browser
  }, []);
  useEffect(() => {
    if (!wide) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adblock sau bloc deja completat
    }
  }, [wide]);

  if (!wide) return null;
  return (
    <div className="ad-side w-[300px]">
      <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-wide text-sub">
        Publicitate
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 300, height: 600 }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SIDE_SLOT}
      />
    </div>
  );
}

// Pagină îngustă (ghid, calculator) + coloana cu reclama fixă pe ecrane late.
export function WithSideAd({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full xl:flex xl:max-w-[1160px] xl:justify-center xl:gap-10">
      <div className="min-w-0 flex-1">{children}</div>
      <aside className="hidden w-[300px] shrink-0 py-8 xl:block">
        <div className="sticky top-6">
          <SideAd />
        </div>
      </aside>
    </div>
  );
}
