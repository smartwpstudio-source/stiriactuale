"use client";

import { useEffect, useRef, useState } from "react";

// Doar video-ul postării Telegram (fără textul ei), primul în articol. Dacă
// Telegram nu-l dă pe web (fișier prea mare) sau schimbă ceva, rămâne playerul
// lor oficial (children), cu tot cu text — video-ul e obligatoriu în articol.
export function TelegramVideo({ post, channel, children }: { post: string; channel: string; children: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  // eroarea poate veni înainte de hidratare, când onError încă nu ascultă
  useEffect(() => {
    if (ref.current?.error) setFailed(true);
  }, []);
  if (failed) return <>{children}</>;
  const src = `/api/tg-video/?p=${post}`;
  return (
    <figure className="mt-6">
      <video
        ref={ref}
        src={src}
        poster={`${src}&poster=1`}
        controls
        playsInline
        // „metadata”: browserul încearcă imediat video-ul — dacă Telegram nu-l dă
        // (fișier prea mare pentru web), apare eroarea și trecem pe playerul lor
        preload="metadata"
        onError={() => setFailed(true)}
        className="aspect-video w-full rounded bg-black object-contain"
      />
      <figcaption className="mt-1 font-mono text-xs text-sub">
        Video:{" "}
        <a href={`https://t.me/${post}`} target="_blank" rel="noopener nofollow" className="underline hover:text-ink">
          {channel}, pe Telegram
        </a>
      </figcaption>
    </figure>
  );
}
