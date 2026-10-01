import type { PlaceInfo } from "@/lib/content/places";

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

// Contacte utile pe pagina unui raion / unei țări (content/locuri/).
export function PlaceInfoBox({ info, name }: { info: PlaceInfo; name: string }) {
  return (
    <section className="mt-6 rounded border border-line bg-white p-5">
      <h2 className="font-serif text-xl text-ink">Informații utile — {name}</h2>
      {info.intro && <p className="mt-2 max-w-3xl text-ink/90">{info.intro}</p>}
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {info.blocks.map((b) => (
          <div key={b.title}>
            <h3 className="font-mono text-xs uppercase tracking-wide text-amber-ink">{b.title}</h3>
            <ul className="mt-2 space-y-2 text-[0.95rem]">
              {b.items.map((it) => (
                <li key={it.name}>
                  <span className="font-medium text-ink">
                    {it.url ? (
                      <a href={it.url} target="_blank" rel="noopener" className="underline hover:text-teal">
                        {it.name}
                      </a>
                    ) : (
                      it.name
                    )}
                  </span>
                  {it.phone && (
                    <a href={`tel:${it.phone.replace(/[^\d+]/g, "")}`} className="block font-mono text-sm text-teal">
                      {it.phone}
                    </a>
                  )}
                  {it.address && <span className="block text-sm text-sub">{it.address}</span>}
                  {it.note && <span className="block text-sm text-sub">{it.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-sub">
        Actualizat la {new Date(`${info.updated}T12:00:00Z`).toLocaleDateString("ro-MD", DATE)} · Surse:{" "}
        {info.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ", "}
            <a href={s.url} target="_blank" rel="noopener" className="underline">
              {s.name}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}
