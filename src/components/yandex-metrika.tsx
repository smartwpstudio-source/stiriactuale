"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

// Yandex.Metrika — statistica rapidă cerută de proprietar (2026-10-11).
// Doar în cadrul public (site)/layout.tsx, nu în /admin. Navigarea în site e
// fără reîncărcare (Next.js), așa că la fiecare schimbare de pagină trimitem
// un „hit”; prima vizită o numără deja `init`.
const ID = 91825971;

type Ym = (id: number, method: string, ...args: unknown[]) => void;

export function YandexMetrika() {
  const pathname = usePathname();
  const last = useRef(pathname);

  useEffect(() => {
    // doar la schimbarea paginii (nu la prima randare, nici la dubla rulare din dev)
    if (last.current === pathname) return;
    last.current = pathname;
    const ym = (window as unknown as { ym?: Ym }).ym;
    ym?.(ID, "hit", window.location.href, { referer: document.referrer });
  }, [pathname]);

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');ym(${ID}, 'init', {clickmap:true, referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://mc.yandex.ru/watch/${ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
        </div>
      </noscript>
    </>
  );
}
