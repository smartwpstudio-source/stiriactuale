import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Un singur editor, o parolă din ADMIN_PASSWORD. Sesiunea = cookie
// "expirare.semnătură" (HMAC cu cheie derivată din parolă) — schimbarea
// parolei invalidează toate sesiunile, fără tabel de sesiuni.
// ponytail: fără rate-limit la login, doar o întârziere la parolă greșită;
// adaugă blocare pe IP dacă apar încercări în log-uri.
const COOKIE = "sa_admin";
export const EDITOR_MARK = "sa_editor";
const SESSION_DAYS = 30;

function key(): Buffer | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? crypto.createHash("sha256").update(`session:${pw}`).digest() : null;
}

function sign(payload: string, k: Buffer): string {
  return crypto.createHmac("sha256", k).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function isAdmin(): Promise<boolean> {
  const k = key();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!k || !value) return false;
  const [exp, sig] = value.split(".");
  return !!exp && !!sig && safeEqual(sig, sign(exp, k)) && Number(exp) > Date.now();
}

// Obligatoriu la începutul FIECĂREI pagini și Server Action din /admin —
// action-urile sunt endpoint-uri POST publice, layout-ul nu le protejează.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login/");
}

export async function logIn(password: string): Promise<boolean> {
  const k = key();
  if (!k || !safeEqual(password, process.env.ADMIN_PASSWORD!)) {
    await new Promise((r) => setTimeout(r, 1500));
    return false;
  }
  const exp = String(Date.now() + SESSION_DAYS * 86400_000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp, k)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_DAYS * 86400,
  });
  // marcaj (nu autentificare): vizitele editorului nu se numără în afișări
  (await cookies()).set(EDITOR_MARK, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/view",
    maxAge: SESSION_DAYS * 86400,
  });
  return true;
}

export async function logOut(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
  (await cookies()).delete({ name: EDITOR_MARK, path: "/api/view" });
}
