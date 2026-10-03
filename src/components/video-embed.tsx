// Playerul oficial YouTube/Facebook pentru video-ul din sursă (src/lib/video.ts).
// loading="lazy": nu încarcă nimic până nu ajunge cititorul la el.
export function VideoEmbed({ src, title }: { src: string; title: string }) {
  // postarea Telegram are înălțimea ei (video + text), nu cadru 16:9
  if (src.startsWith("https://t.me/"))
    return (
      <figure className="mt-6">
        <iframe
          src={src}
          title={`Video: ${title}`}
          loading="lazy"
          className="mx-auto block h-[640px] w-full max-w-[520px] rounded border-0 bg-white"
        />
        <figcaption className="mt-1 text-center font-mono text-xs text-sub">Video: Telegram, preluat de la sursa știrii</figcaption>
      </figure>
    );
  return (
    <figure className="mt-6">
      <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
        <iframe
          src={src}
          title={`Video: ${title}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <figcaption className="mt-1 font-mono text-xs text-sub">
        Video: {src.includes("facebook.com") ? "Facebook" : "YouTube"}, preluat de la sursa știrii
      </figcaption>
    </figure>
  );
}
