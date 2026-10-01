"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

// Auto ads, încărcat din client ca să poată fi oprit pe pagini marcate
// data-no-ads (arhiva preluată de la alte redacții — politica AdSense interzice
// reclamele pe conținut copiat). Se încarcă o singură dată, la prima pagină
// fără marcaj; dependența de pathname acoperă intrarea pe site printr-o pagină
// de arhivă urmată de navigare spre o pagină normală.
// ponytail: după ce scriptul s-a încărcat, o navigare client-side spre o pagină
// de arhivă nu-l mai poate descărca; cititorii de arhivă vin aproape mereu
// direct din Google/Facebook (încărcare completă), deci cazul e rar.
export function AdsenseScript() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.querySelector("[data-no-ads]") || document.getElementById("adsbygoogle-js")) return;
    const s = document.createElement("script");
    s.id = "adsbygoogle-js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    document.head.appendChild(s);
  }, [pathname]);

  return null;
}
