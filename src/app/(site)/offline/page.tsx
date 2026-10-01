import type { Metadata } from "next";
import Link from "next/link";

// Servită de service worker când cititorul e fără internet și pagina cerută nu
// e în cache (sw.js, OFFLINE_URL). Articolele citite recent rămân accesibile.
export const metadata: Metadata = {
  title: "Fără conexiune",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-sub">fără conexiune</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">Nu ai internet acum</h1>
      <p className="mt-4 text-ink">
        Pagina asta nu a fost salvată pe dispozitiv. Ultimele articole pe care le-ai citit rămân disponibile și fără
        internet — încearcă din nou când revine conexiunea.
      </p>
      <Link href="/" className="mt-6 inline-block rounded bg-ink px-4 py-2 text-paper">
        Prima pagină
      </Link>
    </div>
  );
}
