import type { Metadata } from "next";
import Link from "next/link";
import { IconCalculator, IconBook } from "@tabler/icons-react";
import { Header } from "@/components/header";
import { StatusBar } from "@/components/status-bar";
import { Footer } from "@/components/footer";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { GUIDE_CATEGORIES, getGuides, type GuideCategory } from "@/lib/content/guides";

// Adresă greșită sau articol șters: în loc de o fundătură, căutarea și uneltele
// site-ului. Randată în root layout (nu în (site)), deci cu antetul și subsolul puse
// aici — fără scriptul AdSense: reclame pe o pagină fără conținut încalcă politica.
export const metadata: Metadata = { title: "Pagina nu există" };

const GUIDE_PICKS: GuideCategory[] = ["bani", "acte", "sanatate", "auto", "siguranta", "diaspora"];

export default async function NotFound() {
  const calcs = availableCalculators(await getCalcParams()).slice(0, 6);
  const guides = await getGuides();
  // din fiecare categorie practică, ghidul verificat cel mai recent
  const picks = GUIDE_PICKS.flatMap((c) => guides.filter((g) => g.category === c).sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 1));

  return (
    <>
      <Header />
      <StatusBar />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 lg:px-8">
          <p className="font-mono text-sm uppercase tracking-wide text-amber-ink">Eroare 404</p>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Pagina nu există sau a fost mutată</h1>
          <p className="mt-3 max-w-2xl text-lg text-sub">
            Poate linkul e vechi sau are o greșeală. Caută ce te interesează, mergi la ultimele știri sau folosește
            uneltele de mai jos.
          </p>

          <form action="/cautare/" className="mt-6 flex max-w-xl gap-2">
            <input
              name="q"
              type="search"
              required
              minLength={2}
              placeholder="Caută în știri…"
              aria-label="Caută în știri"
              className="min-w-0 flex-1 rounded border border-line bg-white px-4 py-3 text-ink focus:border-teal focus:outline-none"
            />
            <button className="rounded bg-teal px-5 py-3 font-medium text-white hover:bg-ink">Caută</button>
          </form>
          <Link prefetch={false} href="/" className="mt-4 inline-block font-medium text-teal underline">
            ← Ultimele știri
          </Link>

          <section className="mt-12">
            <h2 className="flex items-center gap-2 font-serif text-2xl text-ink">
              <IconCalculator size={26} stroke={1.75} className="text-teal" aria-hidden /> Calculatoare
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {calcs.map((c) => (
                <li key={c.slug}>
                  <Link prefetch={false}
                    href={`/calculatoare/${c.slug}/`}
                    className="flex h-full flex-col rounded-lg border border-line bg-white p-4 hover:border-teal hover:shadow-md"
                  >
                    <span className="font-serif text-lg leading-snug text-ink">{c.title}</span>
                    <span className="mt-1 text-[0.95rem] text-sub">{c.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link prefetch={false} href="/calculatoare/" className="mt-4 inline-block font-medium text-teal">
              Toate calculatoarele →
            </Link>
          </section>

          <section className="mt-12">
            <h2 className="flex items-center gap-2 font-serif text-2xl text-ink">
              <IconBook size={26} stroke={1.75} className="text-teal" aria-hidden /> Ghiduri practice
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((g) => (
                <li key={g.slug}>
                  <Link prefetch={false}
                    href={`/ghiduri/${g.slug}/`}
                    className="flex h-full flex-col rounded-lg border border-line bg-white p-4 hover:border-teal hover:shadow-md"
                  >
                    <span className="font-mono text-xs uppercase tracking-wide text-amber-ink">{GUIDE_CATEGORIES[g.category]}</span>
                    <span className="mt-1 font-serif text-lg leading-snug text-ink">{g.title}</span>
                    <span className="mt-1 line-clamp-2 text-[0.95rem] text-sub">{g.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link prefetch={false} href="/ghiduri/" className="mt-4 inline-block font-medium text-teal">
              Toate ghidurile →
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
