// Vremea din coloana laterală: MET Norway (api.met.no) — gratuit și pentru
// site-uri comerciale, cu condiția de a cita sursa (CC BY 4.0) și de a trimite
// un User-Agent cu contact. Cache 30 de minute (ei cer cel mult o cerere la
// câteva minute per locație). La eroare: null, caseta nu apare.
const UA = "stiriactuale.info contact@stiriactuale.info";

export const CITIES = [
  { name: "Chișinău", lat: 47.01, lon: 28.86 },
  { name: "Bălți", lat: 47.76, lon: 27.93 },
  { name: "Cahul", lat: 45.9, lon: 28.19 },
] as const;

type Series = { time: string; data: { instant: { details: { air_temperature: number } }; next_1_hours?: { summary: { symbol_code: string } }; next_6_hours?: { summary: { symbol_code: string } } } }[];

async function series(lat: number, lon: number): Promise<Series | null> {
  try {
    const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
      headers: { "User-Agent": UA },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return (await res.json()).properties.timeseries;
  } catch {
    return null;
  }
}

const LABELS: [RegExp, string, string][] = [
  [/thunder/, "⛈️", "furtună"],
  [/snow/, "❄️", "ninsoare"],
  [/sleet/, "🌨️", "lapoviță"],
  [/rain/, "🌧️", "ploaie"],
  [/fog/, "🌫️", "ceață"],
  [/^cloudy/, "☁️", "înnorat"],
  [/partlycloudy/, "⛅", "parțial noros"],
  [/fair/, "🌤️", "mai mult senin"],
  [/clearsky_night/, "🌙", "senin"],
  [/clearsky/, "☀️", "senin"],
];
export const describe = (symbol?: string) => {
  const l = LABELS.find(([re]) => symbol && re.test(symbol));
  return { icon: l?.[1] ?? "🌡️", text: l?.[2] ?? "" };
};

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });

export async function getWeather() {
  const all = await Promise.all(CITIES.map((c) => series(c.lat, c.lon)));
  if (!all[0]) return null;
  const now = CITIES.map((c, i) => {
    const t = all[i]?.[0];
    return t ? { city: c.name, temp: Math.round(t.data.instant.details.air_temperature), symbol: t.data.next_1_hours?.summary.symbol_code } : null;
  }).filter((x) => x !== null);
  // Chișinău: min/max pe zilele următoare
  const byDay = new Map<string, { min: number; max: number; symbol?: string }>();
  for (const t of all[0]) {
    const k = dayKey(t.time);
    const temp = t.data.instant.details.air_temperature;
    const d = byDay.get(k) ?? { min: temp, max: temp };
    d.min = Math.min(d.min, temp);
    d.max = Math.max(d.max, temp);
    // simbolul zilei: primul interval de 6 ore care începe între 06 și 12 UTC
    // (prognoza trece de la pași de o oră la pași de 6 ore după ~2 zile)
    const h = new Date(t.time).getUTCHours();
    if (!d.symbol && h >= 6 && h <= 12) d.symbol = t.data.next_6_hours?.summary.symbol_code;
    byDay.set(k, d);
  }
  const days = [...byDay.entries()].slice(1, 4).map(([date, d]) => ({ date, min: Math.round(d.min), max: Math.round(d.max), symbol: d.symbol }));
  return { now, days };
}
