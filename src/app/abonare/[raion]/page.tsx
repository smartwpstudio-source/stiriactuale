import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { StatusBar } from "@/components/status-bar";
import { Footer } from "@/components/footer";
import { PushOptIn } from "@/components/push-opt-in";
import { raionLabel } from "@/lib/content/geo";

// Campania de abonare pe raion (cererea editorului, 2026-11-03): pagina pe care o postează pe
// Facebook și în grupurile raionului. Pornim cu Drochia; dacă merge, se adaugă raioane aici.
// Fără (site)/layout: fără reclame pe o pagină fără conținut editorial; noindex, nu e pentru Google.
const CAMPAIGN = ["drochia"];

export const generateStaticParams = () => CAMPAIGN.map((raion) => ({ raion }));

export async function generateMetadata({ params }: { params: Promise<{ raion: string }> }): Promise<Metadata> {
  const { raion } = await params;
  const title = `Abonează-te la știrile din raionul ${raionLabel(raion)}`;
  const description = `Primești pe telefon știrile din raionul ${raionLabel(raion)}, gratuit, fără cont. Te dezabonezi oricând.`;
  const image = `/og/?${new URLSearchParams({ t: title, s: "Gratuit" })}`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/abonare/${raion}/` },
    openGraph: { title, description, url: `/abonare/${raion}/`, images: [{ url: image, width: 1200, height: 630 }] },
  };
}

export default async function SubscribePage({ params }: { params: Promise<{ raion: string }> }) {
  const { raion } = await params;
  if (!CAMPAIGN.includes(raion)) notFound();
  const name = raionLabel(raion);
  return (
    <>
      <Header />
      <StatusBar />
      <main className="flex flex-1 flex-col">
        <article className="mx-auto w-full max-w-[720px] px-4 py-8">
          <p className="font-mono text-xs uppercase tracking-wide text-amber-ink">Gratuit</p>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Abonează-te la știrile din raionul {name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink">Afli pe telefon ce s-a întâmplat la {name}, chiar când publicăm știrea, fără să mai cauți pe Facebook.</p>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink">
            <li>Primești o notificare la fiecare știre din raionul {name} și la știrile importante pentru toată țara.</li>
            <li>Este gratuit. Nu îți cerem cont, număr de telefon sau email.</li>
            <li>Noaptea, între 22:00 și 07:00, nu trimitem nimic.</li>
            <li>Te dezabonezi oricând, cu un singur buton, de pe această pagină.</li>
          </ul>
          <PushOptIn place={raion} section="regiuni" campaign />
          <p className="mt-4 text-sm text-sub">
            Ai iPhone? Alertele merg doar cu site-ul adăugat pe ecran: deschide pagina în Safari, apasă Partajează → Adaugă pe ecranul principal, intră de acolo și
            activează alertele.
          </p>
          <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-ink">
            <Link prefetch={false} href={`/regiuni/${raion}/`} className="font-medium text-teal underline">
              Ultimele știri din raionul {name}
            </Link>
            <Link prefetch={false} href={`/ghiduri/${raion}-primaria-spitalul-asp-transportul/`} className="font-medium text-teal underline">
              Ghidul raionului: primăria, spitalul, ASP și transportul
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
