// Postarea unei instituții cu pozele de la fața locului (Facebook/Telegram),
// prin pluginul oficial — pozele rămân la autor, noi doar arătăm postarea.
export function PostEmbed({ src }: { src: string }) {
  const fb = src.includes("facebook.com");
  return (
    <figure className="my-6">
      <iframe
        src={src}
        title="Postare cu poze de la fața locului"
        loading="lazy"
        className="mx-auto block h-[640px] w-full max-w-[500px] rounded border-0 bg-white"
      />
      <figcaption className="mt-1 text-center font-mono text-xs text-sub">
        Foto: postarea oficială de pe {fb ? "Facebook" : "Telegram"}
      </figcaption>
    </figure>
  );
}
