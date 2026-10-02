// Video din sursă inserat în articol prin playerul oficial al platformei
// (embed) — video-ul rămâne la autor, nu se descarcă. Doar YouTube și
// Facebook: aici își pun materialele TV8, Jurnal TV, Moldova 1 etc. YouTube în
// varianta fără cookie-uri de urmărire.

const YT_ID = /^[\w-]{11}$/;

// Link (watch, youtu.be, shorts, embed, pagină Facebook video/reel) -> URL de
// embed, sau null dacă nu e un video recunoscut.
export function toEmbedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim().replace(/&amp;/g, "&"));
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.|mobile\.)/, "");

  if (host === "youtu.be" || host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]+)/)?.[1] ?? "";
    return YT_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === "facebook.com" || host === "fb.watch") {
    // playerul Facebook primește pagina video-ului ca parametru href
    if (u.pathname.startsWith("/plugins/video.php")) {
      const href = u.searchParams.get("href");
      return href ? toEmbedUrl(href) : null;
    }
    const isVideo = host === "fb.watch" || /\/(videos|watch|reel)\b/.test(u.pathname) || u.searchParams.has("v");
    if (!isVideo) return null;
    const page = host === "fb.watch" ? u.toString() : `https://www.facebook.com${u.pathname}${u.searchParams.has("v") ? `?v=${u.searchParams.get("v")}` : ""}`;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(page)}&show_text=false`;
  }
  return null;
}

// Primul video inserat în pagina sursei: iframe-uri, apoi og:video. Linkurile
// simple din text nu contează — pot fi spre alte subiecte.
export function findVideo(html: string): string | null {
  const candidates = [
    ...[...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/<meta[^>]+property=["']og:video(?::url|:secure_url)?["'][^>]+content=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];
  for (const c of candidates) {
    const embed = toEmbedUrl(c.startsWith("//") ? `https:${c}` : c);
    if (embed) return embed;
  }
  return null;
}

// Miniatura publică a unui video YouTube (fără cheie). hqdefault există mereu;
// e 4:3 cu benzi negre, tăiate de object-cover în cadrele 16:9. Facebook nu
// are miniatură publică — acolo rămâne poza de stock.
export function youtubeThumb(embedUrl?: string | null): string | null {
  const id = embedUrl?.match(/youtube-nocookie\.com\/embed\/([\w-]{11})/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
