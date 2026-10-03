"use client";

import { useState } from "react";

// Doar video-ul postării Telegram (fără textul ei), primul în articol. Dacă
// Telegram schimbă ceva și video-ul nu se mai poate reda, rămâne poza
// articolului (children) — știrea nu se strică.
export function TelegramVideo({ post, channel, children }: { post: string; channel: string; children: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{children}</>;
  const src = `/api/tg-video/?p=${post}`;
  return (
    <figure className="mt-6">
      <video
        src={src}
        poster={`${src}&poster=1`}
        controls
        playsInline
        preload="none"
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
