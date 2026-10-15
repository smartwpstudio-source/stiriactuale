import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedHeight } from "@/components/calc/embed-height";
import { describe, getForecast, LOCATIONS } from "@/lib/weather";

// Vremea într-un oraș, ca widget pentru alte site-uri (iframe), în locul
// informerelor vechi (ex. gliadrochiana.info, 2026-10-15). Datele: MET Norway
// (CC BY 4.0 — sursa se citează). noindex: e doar un widget.
export const revalidate = 1800;
export const metadata: Metadata = { robots: { index: false, follow: true } };

export function generateStaticParams() {
  return Object.keys(LOCATIONS).map((loc) => ({ loc }));
}

const dayName = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("ro-MD", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

export default async function WeatherEmbedPage({ params }: PageProps<"/embed/vremea/[loc]">) {
  const { loc } = await params;
  const place = LOCATIONS[loc as keyof typeof LOCATIONS];
  if (!place) notFound();
  const f = await getForecast(place.lat, place.lon);
  const now = f && describe(f.now.symbol);
  return (
    <div className="mx-auto w-full max-w-[640px] bg-paper p-3 sm:p-4">
      <EmbedHeight slug={`vremea-${loc}`} />
      <h1 className="font-serif text-xl text-ink sm:text-2xl">Vremea în {place.name}</h1>
      {!f || !now ? (
        <p className="mt-3 text-sub">Prognoza nu e disponibilă acum. Revino peste câteva minute.</p>
      ) : (
        <>
          <p className="mt-3 flex items-center gap-3">
            <span className="text-4xl" aria-hidden>{now.icon}</span>
            <span className="font-mono text-3xl text-ink">{f.now.temp}°C</span>
            {now.text && <span className="text-sub">{now.text}</span>}
          </p>
          <ul className="mt-4 divide-y divide-line rounded border border-line bg-white">
            {f.days.map((d) => {
              const x = describe(d.symbol);
              return (
                <li key={d.date} className="flex items-center justify-between gap-3 px-3 py-2 text-[0.95rem]">
                  <span className="capitalize text-ink">{dayName(d.date)}</span>
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{x.icon}</span>
                    <span className="font-mono text-ink">
                      {d.min}…{d.max}°C
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="mt-3 text-xs text-sub">
        Date: MET Norway ·{" "}
        <a href="/" target="_blank" rel="noopener" className="underline">
          Știri Actuale — știri din Moldova
        </a>
      </p>
    </div>
  );
}
