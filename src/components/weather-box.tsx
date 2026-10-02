import { describe, getWeather } from "@/lib/weather";

const WEEKDAY = ["dum", "lun", "mar", "mie", "joi", "vin", "sâm"];

export async function WeatherBox() {
  const w = await getWeather();
  if (!w) return null;
  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-4">
      <h2 className="font-mono text-xs uppercase tracking-wide text-sub">Vremea acum</h2>
      <ul className="mt-2 space-y-1">
        {w.now.map((c) => {
          const d = describe(c.symbol);
          return (
            <li key={c.city} className="flex items-center justify-between text-[0.95rem]">
              <span className="text-ink">{c.city}</span>
              <span className="font-mono text-ink" title={d.text}>
                {d.icon} {c.temp}°
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        {w.days.map((d) => (
          <div key={d.date} title={describe(d.symbol).text}>
            <div className="font-mono text-xs text-sub">{WEEKDAY[new Date(`${d.date}T12:00:00Z`).getUTCDay()]}</div>
            <div className="text-lg">{describe(d.symbol).icon}</div>
            <div className="font-mono text-xs text-ink">
              {d.max}° / {d.min}°
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-sub">
        Prognoza pentru Chișinău. Date:{" "}
        <a href="https://www.met.no/" target="_blank" rel="noopener" className="underline">
          MET Norway
        </a>
      </p>
    </section>
  );
}
