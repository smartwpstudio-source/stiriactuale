import { reportToEditor } from "@/lib/telegram";

// Comanda unui comunicat de presă (formularul de pe /comunicate-de-presa/) -> botul editorului.
// ponytail: fără limită pe IP; câmpul ascuns oprește roboții simpli, o limită dacă apare spam.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return new Response("Bad Request", { status: 400 });
  const f = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  if (f("site_web", 100)) return Response.json({ ok: true }); // robot: nu-l anunțăm
  const nume = f("nume", 120);
  const email = f("email", 160);
  const titlu = f("titlu", 200);
  const text = f("text", 8000);
  if (!nume || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !titlu || text.length < 50) return new Response("Bad Request", { status: 400 });
  const head = [
    "📢 Comandă nouă: comunicat de presă (500 lei)",
    "",
    `Nume: ${nume}`,
    `Firma: ${f("firma", 160) || "-"}  IDNO: ${f("idno", 20) || "-"}`,
    `E-mail: ${email}  Telefon: ${f("telefon", 40) || "-"}`,
    `Link: ${f("link", 300) || "-"}`,
    "",
    `Titlu: ${titlu}`,
    "",
  ].join("\n");
  // Telegram primește max ~4.000 de caractere pe mesaj: textul lung pleacă în bucăți
  const full = head + text;
  for (let i = 0; i < full.length; i += 3900) await reportToEditor(full.slice(i, i + 3900));
  return Response.json({ ok: true });
}
