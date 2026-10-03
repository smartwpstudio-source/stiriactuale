// Video-ul unei postări Telegram, fără textul ei: playerul oficial al Telegram
// arată mereu și textul (în limba canalului). Pagina publică a postării
// (?embed=1) are adresa fișierului mp4 și a imaginii de previzualizare, cu o
// cheie care expiră — de aceea adresa se cere proaspătă la fiecare redare și
// se redirecționează acolo. Fișierul vine de pe serverele Telegram, nu de la noi.
// /api/tg-video/?p=canal/123 (video) · &poster=1 (imaginea)
const POST = /^[A-Za-z0-9_]{4,}[/][0-9]+$/;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const post = params.get("p") ?? "";
  if (!POST.test(post)) return new Response("post invalid", { status: 400 });
  const html = await fetch(`https://t.me/${post}?embed=1`, {
    headers: { "User-Agent": "Mozilla/5.0 (stiriactuale.info)" },
    signal: AbortSignal.timeout(10_000),
  })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");
  const target = params.has("poster")
    ? html.match(/tgme_widget_message_video_thumb"[^>]*background-image:url[(]'([^']+)'/)?.[1]
    : html.match(/<video[^>]+src="(https:[/][/][^"]+)"/)?.[1];
  if (!target) return new Response("fără video", { status: 404 });
  return new Response(null, {
    status: 302,
    // o oră în cache-ul Vercel: cheia Telegram ține mai mult, iar o redare nu mai cere funcția
    headers: { Location: target.replace(/&amp;/g, "&"), "Cache-Control": "public, s-maxage=3600" },
  });
}
